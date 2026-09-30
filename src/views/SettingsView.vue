<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

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
  if (!settingsStore.loaded) await settingsStore.init()
})

async function update (patch) {
  await settingsStore.update(patch)
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
</style>
