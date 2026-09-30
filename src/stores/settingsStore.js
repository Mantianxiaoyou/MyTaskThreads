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
  bgOpacity: 100,      // 背景不透明度 0-100，100 = 完全不透明
  bgBrightness: 50     // 背景明暗 50 = 跟随主题，<50 更暗，>50 更亮
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: { ...DEFAULT_SETTINGS },
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
