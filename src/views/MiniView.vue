<script setup>
import { computed, onMounted, ref } from 'vue'
import TitleBar from '../components/TitleBar.vue'
import { useTaskStore } from '../stores/taskStore'
import { useTimerStore } from '../stores/timerStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useBackground } from '../composables/useBackground'
import { formatTime } from '../utils/time'

const taskStore = useTaskStore()
const timerStore = useTimerStore()
const settingsStore = useSettingsStore()
const { bgStyle, bgImageStyle } = useBackground('mini') // mini 小窗以 --bg-elevated 为基准色

const activeTab = ref('tasks') // tasks | timer

const todayTasks = computed(() => taskStore.todayTasks)
const pending = computed(() => todayTasks.value.filter(t => t.status !== 'completed'))
const completed = computed(() => taskStore.todayCompleted)
const total = computed(() => todayTasks.value.length)
const completionRate = computed(() => total.value === 0 ? 0 : Math.round(completed.value / total.value * 100))

const timerRunning = computed(() => timerStore.running && !timerStore.paused)
const timerText = computed(() => formatTime(timerStore.remainingSec))
const phaseLabel = computed(() => ({
  focus: '专注',
  break: '短休',
  longBreak: '长休'
}[timerStore.type] || '准备'))
const currentTask = computed(() => taskStore.tasks.find(t => t.id === timerStore.taskId))

// 暴露 Math 给 template 使用
const PI2 = 2 * Math.PI * 45

onMounted(async () => {
  if (!taskStore.loaded) await taskStore.init()
  if (!settingsStore.loaded) await settingsStore.init()
  timerStore.bindEvents?.()
})

async function toggleComplete (id, status) {
  await taskStore.setStatus(id, status === 'completed' ? 'pending' : 'completed')
}

async function exitMini () {
  if (window.api?.window?.toggleMini) {
    await window.api.window.toggleMini(false)
  }
  window.dispatchEvent(new CustomEvent('mini-mode-change', { detail: { mini: false } }))
}

async function startQuickFocus () {
  // 选择第一个未完成任务进行专注
  const t = pending.value[0]
  await timerStore.start({ type: 'focus', taskId: t?.id })
}

async function pauseTimer () {
  await timerStore.pause()
}
async function resumeTimer () {
  await timerStore.resume()
}
</script>

<template>
  <div class="mini-view" :style="bgStyle">
    <div class="bg-image" :style="bgImageStyle"></div>
    <TitleBar :mini="true" />

    <div class="mini-summary">
      <div class="date">{{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }) }}</div>
      <div class="progress-line">
        <span class="count">{{ completed }}/{{ total }}</span>
        <div class="bar">
          <div class="fill" :style="{ width: completionRate + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <button :class="{ active: activeTab === 'tasks' }" @click="activeTab = 'tasks'">任务</button>
      <button :class="{ active: activeTab === 'timer' }" @click="activeTab = 'timer'">番茄钟</button>
    </div>

    <!-- 番茄钟面板 -->
    <div v-if="activeTab === 'timer'" class="timer-panel">
      <div class="timer-circle" :class="{ running: timerRunning }">
        <svg viewBox="0 0 100 100" class="ring">
          <circle class="track" cx="50" cy="50" r="45" />
          <circle
            class="progress-circle"
            cx="50"
            cy="50"
            r="45"
            :stroke-dasharray="PI2"
            :stroke-dashoffset="PI2 * (1 - timerStore.progress / 100)"
          />
        </svg>
        <div class="time-display">
          <div class="time mono">{{ timerText }}</div>
          <div class="phase">{{ phaseLabel }}</div>
        </div>
      </div>

      <div v-if="currentTask" class="current-task">
        {{ currentTask.title }}
      </div>

      <div class="timer-controls">
        <template v-if="!timerStore.running">
          <button class="primary" @click="startQuickFocus">开始专注</button>
        </template>
        <template v-else-if="timerStore.paused">
          <button class="primary" @click="resumeTimer">继续</button>
        </template>
        <template v-else>
          <button @click="pauseTimer">暂停</button>
        </template>
      </div>
    </div>

    <!-- 任务列表 -->
    <div v-else class="task-panel">
      <div v-if="pending.length === 0" class="empty-mini">
        ✓ 今日任务全部完成
      </div>
      <div v-else class="task-list-mini">
        <div
          v-for="t in todayTasks"
          :key="t.id"
          class="task-item"
          :class="`p-${t.priority}`, `s-${t.status}`"
        >
          <input
            type="checkbox"
            :checked="t.status === 'completed'"
            @change="toggleComplete(t.id, t.status)"
          />
          <div class="task-text">
            <div class="title">{{ t.title }}</div>
            <div v-if="t.dueTime" class="meta">{{ new Date(t.dueTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* 兜底：自定义背景（内联样式）不可用时退回主题背景色 */
  background: var(--bg-elevated);
  color: var(--fg);
  padding: 8px;
  gap: 6px;
  font-size: 11px;
  overflow: hidden;
}
/* 自定义图片背景层：定位/层叠全部来自内联样式，这里不再定义 */
.bg-image {
  pointer-events: none;
}

.mini-summary {
  padding: 4px 4px 6px;
}
.date {
  font-size: 10px;
  color: var(--fg-soft);
  margin-bottom: 4px;
}
.progress-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.count {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  min-width: 30px;
}
.bar {
  flex: 1;
  height: 4px;
  background: var(--bg-strong);
  border-radius: 2px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--primary);
  transition: width var(--duration) var(--ease);
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--bg-soft);
  padding: 3px;
  border-radius: var(--radius-md);
}
.tab-bar button {
  flex: 1;
  padding: 5px 8px;
  font-size: 11px;
  background: transparent;
  border: none;
  color: var(--fg-soft);
}
.tab-bar button.active {
  background: var(--bg-elevated);
  color: var(--primary);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

/* 番茄钟面板 */
.timer-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 0;
}
.timer-circle {
  position: relative;
  width: 140px;
  height: 140px;
}
.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.ring .track {
  fill: none;
  stroke: var(--bg-strong);
  stroke-width: 4;
}
.ring .progress-circle {
  fill: none;
  stroke: var(--primary);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}
.timer-circle.running .ring .progress-circle {
  animation: pulse-stroke 1.6s var(--ease) infinite;
}
@keyframes pulse-stroke {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.time-display {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.time {
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--fg);
  line-height: 1;
}
.phase {
  font-size: 10px;
  color: var(--fg-soft);
  margin-top: 4px;
}
.current-task {
  font-size: 11px;
  color: var(--fg-soft);
  text-align: center;
  padding: 0 8px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.timer-controls {
  display: flex;
  gap: 6px;
}

/* 任务列表 */
.task-panel {
  flex: 1;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.empty-mini {
  text-align: center;
  padding: 40px 16px;
  color: var(--success);
  font-size: 12px;
}
.task-list-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: var(--bg-soft);
  border-radius: var(--radius-md);
  border-left: 3px solid transparent;
  transition: all var(--duration-fast) var(--ease);
}
.task-item:hover {
  background: var(--bg-strong);
}
.task-item.p-high { border-left-color: var(--high); }
.task-item.p-medium { border-left-color: var(--medium); }
.task-item.p-low { border-left-color: var(--low); }
.task-item.s-completed {
  opacity: 0.5;
}
.task-item.s-completed .title {
  text-decoration: line-through;
}
.task-item input[type="checkbox"] {
  margin-top: 2px;
  width: 14px;
  height: 14px;
}
.task-text {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 11px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  font-size: 9px;
  color: var(--fg-mute);
  margin-top: 2px;
}

.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
</style>
