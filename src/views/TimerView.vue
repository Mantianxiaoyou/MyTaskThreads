<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTimerStore } from '../stores/timerStore'
import { useTaskStore } from '../stores/taskStore'
import { formatTime } from '../utils/time'
import ProgressRing from '../components/ProgressRing.vue'

const timerStore = useTimerStore()
const taskStore = useTaskStore()
const route = useRoute()

const selectedTaskId = ref(null)

const tasks = computed(() => taskStore.tasks.filter(t => t.status !== 'completed'))
const currentTask = computed(() => taskStore.tasks.find(t => t.id === (timerStore.taskId || selectedTaskId.value)))

const remainingText = computed(() => formatTime(timerStore.remainingSec))
const phaseLabel = computed(() => ({
  focus: '专注中',
  break: '短休',
  longBreak: '长休'
}[timerStore.type] || '准备'))

onMounted(async () => {
  if (!taskStore.loaded) await taskStore.init()
  timerStore.bindEvents?.()
  if (route.query.taskId) {
    selectedTaskId.value = route.query.taskId
  }
})

watch(() => route.query.taskId, (v) => {
  if (v) selectedTaskId.value = v
})

async function startFocus () {
  await timerStore.start({ type: 'focus', taskId: selectedTaskId.value })
}
async function startBreak () {
  await timerStore.start({ type: 'break' })
}
async function startLongBreak () {
  await timerStore.start({ type: 'longBreak' })
}
async function pause () {
  await timerStore.pause()
}
async function resume () {
  await timerStore.resume()
}
async function reset () {
  await timerStore.reset()
}
</script>

<template>
  <div class="timer-view">
    <h2>番茄钟</h2>

    <div class="timer-card">
      <div class="phase">{{ phaseLabel }}</div>
      <ProgressRing :percent="timerStore.progress" :size="180">
        <text v-if="timerStore.running || timerStore.paused" class="time-text" x="90" y="90">{{ remainingText }}</text>
      </ProgressRing>
      <div class="time-text big">{{ remainingText }}</div>

      <div class="task-pick">
        <label>关联任务：</label>
        <select v-model="selectedTaskId" :disabled="timerStore.running">
          <option :value="null">无关联</option>
          <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
        <div v-if="currentTask" class="current-task">
          当前：{{ currentTask.title }} · 番茄数 {{ currentTask.pomodoroCount }}
        </div>
      </div>

      <div class="controls">
        <template v-if="!timerStore.running">
          <button class="primary" @click="startFocus">开始专注</button>
          <button @click="startBreak">短休</button>
          <button @click="startLongBreak">长休</button>
        </template>
        <template v-else-if="timerStore.paused">
          <button class="primary" @click="resume">继续</button>
          <button @click="reset">重置</button>
        </template>
        <template v-else>
          <button class="primary" @click="pause">暂停</button>
          <button @click="reset">重置</button>
        </template>
      </div>

      <div class="hint">番茄钟每完成一轮专注后任务自动 +1 番茄数。可在设置中开启自动开始下一轮。</div>
    </div>
  </div>
</template>

<style scoped>
.timer-view { display: flex; flex-direction: column; gap: 16px; align-items: center; }
.timer-view h2 { font-size: 18px; align-self: flex-start; }
.timer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  min-width: 320px;
}
.phase { font-size: 13px; color: var(--fg-soft); }
.time-text.big {
  font-size: 32px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  margin-top: -8px;
}
.task-pick { display: flex; flex-direction: column; gap: 6px; width: 100%; margin-top: 6px; }
.task-pick label { font-size: 12px; color: var(--fg-soft); }
.task-pick select { width: 100%; }
.current-task { font-size: 12px; color: var(--fg-soft); }
.controls { display: flex; gap: 8px; margin-top: 8px; }
.hint { font-size: 11px; color: var(--fg-soft); text-align: center; max-width: 280px; }
</style>
