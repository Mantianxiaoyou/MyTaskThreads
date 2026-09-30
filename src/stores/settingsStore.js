// 设置 Store：负责加载/保存 settings 部分到主进程
import { defineStore } from 'pinia'
import { dataApi, systemApi, windowApi } from '../services/api'

const DEFAULT_SETTINGS = {
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  longBreakInterval: 4,
  notificationsEnabled: true,
  minimizeToTray: true,
  autoStartNext: false,
  launchOnBoot: false,
  alwaysOnTop: false,
  theme: 'auto',
  remindBeforeMin: 10,
  // 窗口背景自定义（主窗口与 mini 小窗共用）
  bgOpacity: 100,        // 背景不透明度 0-100，100 = 完全不透明
  bgBrightness: 50,      // 背景明暗 50 = 跟随主题，<50 更暗，>50 更亮
  bgImage: 'builtin:wallpaper', // 背景图片：builtin:wallpaper = 内置图，绝对路径 = 自己的图，空 = 纯色
  bgImageFit: 'cover',   // 图片填充：cover 铺满 / contain 完整显示 / repeat 平铺
  bgImageVeil: 40        // 图片上的主题色遮罩强度 0-100，越大文字越清晰
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: { ...DEFAULT_SETTINGS },
    // 图片内容只在内存里放 data URL，不写进数据文件（路径才持久化）
    imageUrl: '',
    imageError: '',
    loaded: false
  }),
  actions: {
    async init () {
      const data = await dataApi.load()
      this.settings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) }
      this.loaded = true
      if (this.settings.theme) {
        await systemApi.setTheme(this.settings.theme)
        if (this.settings.theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark')
        } else if (this.settings.theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light')
        }
      }
      await this.loadBackgroundImage()
    },
    // 按已保存的路径读取图片内容（启动时、或外部改过路径时调用）
    async loadBackgroundImage () {
      if (!this.settings.bgImage) {
        this.imageUrl = ''
        this.imageError = ''
        return
      }
      const res = await dataApi.readImage(this.settings.bgImage)
      if (res?.ok) {
        this.imageUrl = res.dataUrl
        this.imageError = ''
      } else {
        this.imageUrl = ''
        this.imageError = res ? (res.message || '背景图片读取失败') : '图片接口未加载（通常是应用没重启），请重启后再试'
      }
    },
    // 选择 / 更换 / 清除背景图片；只有读取成功才把路径存进设置
    async setBackgroundImage (filePath) {
      if (!filePath) {
        this.imageUrl = ''
        this.imageError = ''
        await this.update({ bgImage: '' })
        return true
      }
      const res = await dataApi.readImage(filePath)
      if (!res?.ok) {
        this.imageError = res ? (res.message || '背景图片读取失败') : '图片接口未加载（通常是应用没重启），请重启后再试'
        return false
      }
      this.imageUrl = res.dataUrl
      this.imageError = ''
      await this.update({ bgImage: filePath })
      return true
    },
    // 预览：只改内存中的值，让滑块拖动时即时生效，不写磁盘
    preview (patch) {
      this.settings = { ...this.settings, ...patch }
    },
    async update (patch) {
      this.settings = { ...this.settings, ...patch }
      const full = await dataApi.load()
      // 用 JSON 序列化确保是纯对象（避免 Pinia reactive Proxy 在 IPC 时丢失）
      full.settings = JSON.parse(JSON.stringify(this.settings))
      await dataApi.save(full)
      if ('theme' in patch) {
        await systemApi.setTheme(patch.theme)
        if (patch.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
        else if (patch.theme === 'light') document.documentElement.setAttribute('data-theme', 'light')
      }
      if ('alwaysOnTop' in patch) {
        await windowApi.setAlwaysOnTop(patch.alwaysOnTop)
      }
      if ('launchOnBoot' in patch) {
        await systemApi.setAutoLaunch(patch.launchOnBoot)
      }
    }
  }
})
