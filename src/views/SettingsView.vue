<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { useBackground } from '../composables/useBackground'
import { dataApi } from '../services/api'

const settingsStore = useSettingsStore()

const sections = [
  { key: 'pomodoro', label: '番茄钟' },
  { key: 'reminders', label: '提醒' },
  { key: 'window', label: '窗口' },
  { key: 'data', label: '数据' },
  { key: 'system', label: '系统' }
]
const activeSection = ref('pomodoro')

onMounted(async () => {
  if (!settingsStore.loaded) {
    await settingsStore.init()
  } else if (settingsStore.settings.bgImage && !settingsStore.imageUrl) {
    // 上次读取失败（例如接口刚加载完），进设置页时再试一次
    await settingsStore.loadBackgroundImage()
  }
})

async function update (patch) {
  await settingsStore.update(patch)
}

// 背景预览：与窗口实际使用的样式同源（主窗口基准色）
const { bgStyle: previewBgStyle, bgImageStyle: previewBgImageStyle } = useBackground()

// 明暗滑块的文字说明：显示相对基准色的混合比例
const brightnessLabel = computed(() => {
  const b = Number(settingsStore.settings.bgBrightness ?? 50)
  if (b === 50) return '跟随主题'
  return (b < 50 ? '更暗 ' : '更亮 ') + Math.abs(b - 50) * 2 + '%'
})

const BUILTIN_BG = 'builtin:wallpaper'

const DEFAULT_BG = {
  bgOpacity: 100,
  bgBrightness: 50,
  bgImage: BUILTIN_BG,
  bgImageFit: 'cover',
  bgImageVeil: 40
}

// 当前用的是不是内置背景图
const usingBuiltin = computed(() => settingsStore.settings.bgImage === BUILTIN_BG)

// 拖动滑块时只改内存值（实时预览），松手（change）才写入磁盘
function previewBg (patch) {
  settingsStore.preview(patch)
}

// 选图 / 换图：图片读取成功才会写进设置
async function pickImage () {
  // 主进程接口缺失时（改了 preload 但没重启 Electron）直接说清楚，别静默无反应
  if (typeof window.api?.data?.pickImage !== 'function') {
    alert('图片背景功能需要重启应用后生效：主进程接口还没加载。请关闭并重新运行（npm run dev）。')
    return
  }
  const filePath = await dataApi.pickImage()
  if (!filePath) return
  await settingsStore.setBackgroundImage(filePath)
}

// 换回内置背景图
async function useBuiltinImage () {
  await settingsStore.setBackgroundImage(BUILTIN_BG)
}

async function clearImage () {
  await settingsStore.setBackgroundImage('')
}

async function resetBackground () {
  settingsStore.imageUrl = ''
  settingsStore.imageError = ''
  await update({ ...DEFAULT_BG })
}

async function exportData () {
  try {
    const p = await window.api?.data?.export?.(null)
    if (p) alert(`已导出到：${p}`)
  } catch (e) {
    alert('导出失败：' + e.message)
  }
}
async function importData () {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const f = input.files[0]
    if (!f) return
    try {
      if (f.path) {
        await window.api?.data?.import?.(f.path)
        await settingsStore.init()
        alert('导入成功')
      } else {
        alert('无法获取文件路径')
      }
    } catch (e) {
      alert('导入失败：' + e.message)
    }
  }
  input.click()
}
</script>

<template>
  <div class="settings-view">
    <h2>设置</h2>

    <div class="sections">
      <button
        v-for="s in sections"
        :key="s.key"
        :class="{ active: activeSection === s.key }"
        @click="activeSection = s.key"
      >{{ s.label }}</button>
    </div>

    <div v-if="activeSection === 'pomodoro'" class="card form">
      <label>专注时长（分钟）</label>
      <input type="number" min="1" max="120" :value="settingsStore.settings.pomodoroFocus"
             @change="e => update({ pomodoroFocus: Number(e.target.value) })" />
      <label>短休时长（分钟）</label>
      <input type="number" min="1" max="60" :value="settingsStore.settings.pomodoroBreak"
             @change="e => update({ pomodoroBreak: Number(e.target.value) })" />
      <label>长休时长（分钟）</label>
      <input type="number" min="1" max="60" :value="settingsStore.settings.pomodoroLongBreak"
             @change="e => update({ pomodoroLongBreak: Number(e.target.value) })" />
      <label>长休间隔（每几轮）</label>
      <input type="number" min="2" max="10" :value="settingsStore.settings.longBreakInterval"
             @change="e => update({ longBreakInterval: Number(e.target.value) })" />
      <label class="check">
        <input type="checkbox" :checked="settingsStore.settings.autoStartNext"
               @change="e => update({ autoStartNext: e.target.checked })" />
        自动开始下一轮
      </label>
    </div>

    <div v-if="activeSection === 'reminders'" class="card form">
      <label class="check">
        <input type="checkbox" :checked="settingsStore.settings.notificationsEnabled"
               @change="e => update({ notificationsEnabled: e.target.checked })" />
        启用系统通知
      </label>
      <label>提前提醒（分钟）</label>
      <input type="number" min="0" max="60" :value="settingsStore.settings.remindBeforeMin"
             @change="e => update({ remindBeforeMin: Number(e.target.value) })" />
    </div>

    <div v-if="activeSection === 'window'" class="card form">
      <label class="check">
        <input type="checkbox" :checked="settingsStore.settings.alwaysOnTop"
               @change="e => update({ alwaysOnTop: e.target.checked })" />
        窗口始终置顶
      </label>
      <label class="check">
        <input type="checkbox" :checked="settingsStore.settings.minimizeToTray"
               @change="e => update({ minimizeToTray: e.target.checked })" />
        最小化到托盘
      </label>

      <div class="subgroup">
        <h4>窗口背景</h4>
        <div class="slider-row">
          <label class="slider-label">不透明度</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="settingsStore.settings.bgOpacity"
            @input="e => previewBg({ bgOpacity: Number(e.target.value) })"
            @change="e => update({ bgOpacity: Number(e.target.value) })"
          />
          <span class="slider-value">{{ settingsStore.settings.bgOpacity }}%</span>
        </div>
        <div class="slider-row">
          <label class="slider-label">明暗程度</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="settingsStore.settings.bgBrightness"
            @input="e => previewBg({ bgBrightness: Number(e.target.value) })"
            @change="e => update({ bgBrightness: Number(e.target.value) })"
          />
          <span class="slider-value">{{ brightnessLabel }}</span>
        </div>

        <div class="slider-row">
          <label class="slider-label">背景图片</label>
          <button class="pick-image" @click="pickImage">
            {{ usingBuiltin ? '换成自己的图片…' : '更换图片…' }}
          </button>
          <button v-if="!usingBuiltin" class="use-builtin" @click="useBuiltinImage">用内置背景</button>
          <button v-if="settingsStore.settings.bgImage" class="clear-image" @click="clearImage">清除</button>
        </div>
        <div
          v-if="settingsStore.settings.bgImage"
          class="image-path"
          :title="usingBuiltin ? '内置背景：src/assets/bg/wallpaper.jpg' : settingsStore.settings.bgImage"
        >{{ usingBuiltin ? '内置背景（src/assets/bg/wallpaper.jpg，可自行替换）' : settingsStore.settings.bgImage }}</div>
        <div v-if="settingsStore.imageError" class="hint warn">{{ settingsStore.imageError }}</div>

        <template v-if="settingsStore.imageUrl">
          <div class="slider-row">
            <label class="slider-label">图片填充</label>
            <select
              class="fit-select"
              :value="settingsStore.settings.bgImageFit"
              @change="e => update({ bgImageFit: e.target.value })"
            >
              <option value="cover">铺满窗口</option>
              <option value="contain">完整显示</option>
              <option value="repeat">平铺</option>
            </select>
          </div>
          <div class="slider-row">
            <label class="slider-label">图片遮罩</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              :value="settingsStore.settings.bgImageVeil"
              @input="e => previewBg({ bgImageVeil: Number(e.target.value) })"
              @change="e => update({ bgImageVeil: Number(e.target.value) })"
            />
            <span class="slider-value">{{ settingsStore.settings.bgImageVeil }}%</span>
          </div>
        </template>

        <div class="bg-preview" :style="previewBgStyle">
          <div class="bg-preview-image" :style="previewBgImageStyle"></div>
        </div>
        <div class="hint">
          窗口背景对主窗口和 mini 小窗同时生效：不透明度越低越能透出桌面，明暗程度调整背景颜色的深浅；图片遮罩越大文字越清晰。
        </div>
        <button class="reset-bg" @click="resetBackground">恢复默认背景</button>
      </div>
    </div>

    <div v-if="activeSection === 'data'" class="card form">
      <button @click="exportData">导出数据</button>
      <button @click="importData">导入数据</button>
      <div class="hint">数据存储于本地 JSON 文件，不会上传到任何服务器。</div>
    </div>

    <div v-if="activeSection === 'system'" class="card form">
      <label class="check">
        <input type="checkbox" :checked="settingsStore.settings.launchOnBoot"
               @change="e => update({ launchOnBoot: e.target.checked })" />
        开机自启动
      </label>
      <label>主题</label>
      <select :value="settingsStore.settings.theme"
              @change="e => update({ theme: e.target.value })">
        <option value="auto">跟随系统</option>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.settings-view { display: flex; flex-direction: column; gap: 12px; }
.settings-view h2 { font-size: 18px; }
.sections { display: flex; gap: 6px; flex-wrap: wrap; }
.sections button { padding: 6px 12px; }
.sections button.active { background: var(--primary); color: #fff; }
.form { display: flex; flex-direction: column; gap: 8px; }
.form label { font-size: 12px; color: var(--fg-soft); }
.form input[type="number"], .form select { width: 200px; }
.form .check { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.form .check input[type="checkbox"] { width: 16px; height: 16px; }
.hint { font-size: 11px; color: var(--fg-soft); margin-top: 4px; }

.subgroup {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}
.subgroup h4 {
  font-size: 12px;
  color: var(--fg);
  margin-bottom: 8px;
  font-weight: 600;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.slider-label {
  flex: 0 0 80px;
  font-size: 11px;
  color: var(--fg-soft);
}
.slider-row input[type="range"] {
  flex: 1;
  margin: 0;
}
.slider-value {
  flex: 0 0 80px;
  text-align: right;
  font-size: 11px;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}
.reset-bg {
  align-self: flex-start;
  margin-top: 8px;
  font-size: 11px;
}
.pick-image,
.clear-image,
.use-builtin {
  font-size: 11px;
}
.image-path {
  margin: -4px 0 6px 90px;
  font-size: 10px;
  color: var(--fg-mute);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fit-select {
  flex: 1;
  max-width: 200px;
}
.hint.warn {
  color: var(--danger);
}
/* 定位/层叠来自内联样式，这里只补一个圆角 */
.bg-preview-image {
  border-radius: var(--radius-md);
}
.bg-preview {
  height: 40px;
  margin-top: 4px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background-image: linear-gradient(45deg, var(--border) 25%, transparent 25%, transparent 75%, var(--border) 75%),
    linear-gradient(45deg, var(--border) 25%, transparent 25%, transparent 75%, var(--border) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 6px 6px;
  position: relative;
}
.bg-preview::after {
  content: '预览';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--fg-mute);
}
</style>
