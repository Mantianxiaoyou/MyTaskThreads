<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/taskStore'
import { useTimerStore } from '../stores/timerStore'

const route = useRoute()
const taskStore = useTaskStore()
const timerStore = useTimerStore()

const collapsed = ref(false)

const navItems = [
  { path: '/today', label: '今日', icon: '◉' },
  { path: '/tasks', label: '全部任务', icon: '☰' },
  { path: '/timer', label: '番茄钟', icon: '⏱' },
  { path: '/stats', label: '统计', icon: '◐' },
  { path: '/settings', label: '设置', icon: '⚙' }
]

const pending = computed(() => taskStore.pendingCount)
const timerRunning = computed(() => timerStore.running && !timerStore.paused)
const timerText = computed(() => {
  const m = Math.floor(timerStore.remainingSec / 60)
  const s = timerStore.remainingSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

async function ensureLoaded () {
  if (!taskStore.loaded) await taskStore.init()
}
ensureLoaded()

async function toggleMini () {
  // 切换到 mini 模式：调用主进程缩窗，并通知 App 切换视图
  if (window.api?.window?.toggleMini) {
    await window.api.window.toggleMini(true)
  }
  window.dispatchEvent(new CustomEvent('mini-mode-change', { detail: { mini: true } }))
}

function toggleCollapse () {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="logo-row">
      <div v-if="!collapsed" class="logo">工作进度提醒</div>
      <button class="icon-btn ghost" :title="collapsed ? '展开' : '收起'" @click="toggleCollapse">
        <span class="icon">{{ collapsed ? '»' : '«' }}</span>
      </button>
    </div>

    <!-- 番茄钟状态条 -->
    <div v-if="timerRunning" class="timer-bar" :class="{ collapsed }">
      <div v-if="!collapsed" class="timer-text">
        <span class="dot pulse"></span>
        <span class="mono">{{ timerText }}</span>
      </div>
      <div v-else class="timer-mini mono">{{ timerText }}</div>
    </div>

    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path, 'icon-only': collapsed }"
        :title="item.label"
      >
        <span class="icon">{{ item.icon }}</span>
        <span v-if="!collapsed" class="label">{{ item.label }}</span>
        <span v-if="item.path === '/today' && pending > 0" class="badge">{{ pending }}</span>
      </RouterLink>
    </nav>

    <div class="footer">
      <button v-if="!collapsed" class="mini-btn" title="缩为小窗置顶" @click="toggleMini">
        ⊟ 缩为小窗
      </button>
      <button v-else class="icon-btn ghost mini-toggle" title="缩为小窗置顶" @click="toggleMini">
        ⊟
      </button>
      <div v-if="!collapsed" class="progress-mini">
        今日完成 {{ taskStore.todayCompleted }} / {{ taskStore.todayTotal }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: var(--bg-soft);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  transition: width var(--duration) var(--ease);
  flex-shrink: 0;
}
.sidebar.collapsed {
  width: 52px;
}
.logo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 12px;
  height: 36px;
}
.logo {
  font-weight: 600;
  font-size: 13px;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
}
.icon-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  font-size: 14px;
  color: var(--fg-soft);
  border-radius: var(--radius-sm);
}
.icon-btn:hover {
  background: var(--bg-strong);
  color: var(--fg);
}

.timer-bar {
  margin: 0 8px 8px;
  padding: 6px 10px;
  background: var(--primary-soft);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 11px;
  display: flex;
  align-items: center;
}
.timer-bar.collapsed {
  justify-content: center;
  padding: 4px;
}
.timer-text {
  display: flex;
  align-items: center;
  gap: 6px;
}
.timer-mini {
  font-size: 11px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}
.dot.pulse {
  animation: pulse 1.6s var(--ease) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  text-decoration: none;
  color: var(--fg-soft);
  font-size: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 2px;
  transition: all var(--duration-fast) var(--ease);
  position: relative;
  border: 1px solid transparent;
}
.nav-item:hover {
  background: var(--bg-strong);
  color: var(--fg);
}
.nav-item.active {
  color: var(--primary);
  background: var(--primary-soft);
  font-weight: 500;
}
.nav-item .icon {
  margin-right: 10px;
  font-size: 13px;
  width: 16px;
  text-align: center;
}
.nav-item.icon-only {
  justify-content: center;
  padding: 8px;
}
.nav-item.icon-only .icon {
  margin-right: 0;
}
.nav-item .label {
  flex: 1;
  white-space: nowrap;
}
.badge {
  background: var(--danger);
  color: #fff;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 500;
  min-width: 18px;
  text-align: center;
}

.footer {
  padding: 8px 12px 4px;
  border-top: 1px solid var(--border);
}
.mini-btn {
  width: 100%;
  font-size: 11px;
  color: var(--fg-soft);
  background: transparent;
  border: 1px dashed var(--border-strong);
  margin-bottom: 6px;
}
.mini-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}
.mini-toggle {
  width: 100%;
}
.progress-mini {
  font-size: 10px;
  color: var(--fg-mute);
  text-align: center;
  padding: 4px 0;
}
</style>
