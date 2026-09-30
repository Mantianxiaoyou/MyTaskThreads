<script setup>
import { computed } from 'vue'
import { isOverdue, isoToLocal } from '../utils/time'

const props = defineProps({
  task: { type: Object, required: true }
})
const emit = defineEmits(['edit', 'delete', 'toggle-status', 'set-progress', 'start-pomodoro'])

const priorityLabel = computed(() => ({ high: '高', medium: '中', low: '低' }[props.task.priority] || '中'))
const overdue = computed(() => props.task.status !== 'completed' && isOverdue(props.task.dueTime))

function onProgress (e) {
  emit('set-progress', props.task.id, Number(e.target.value))
}
function toggleComplete () {
  emit('toggle-status', props.task.id, props.task.status === 'completed' ? 'pending' : 'completed')
}
</script>

<template>
  <div class="task-card" :class="[`status-${task.status}`, { overdue }]">
    <div class="header">
      <input
        type="checkbox"
        :checked="task.status === 'completed'"
        @change="toggleComplete"
      />
      <div class="title-area">
        <div class="title">{{ task.title }}</div>
        <div class="meta">
          <span class="cat" v-if="task.category">{{ task.category }}</span>
          <span class="priority" :class="`p-${task.priority}`">{{ priorityLabel }}</span>
          <span v-if="task.dueTime" class="due">截止 {{ isoToLocal(task.dueTime) }}</span>
          <span v-if="task.pomodoroCount > 0" class="pomo">🍅 × {{ task.pomodoroCount }}</span>
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn" title="开始番茄钟" @click="emit('start-pomodoro', task.id)">⏱</button>
        <button class="icon-btn" title="编辑" @click="emit('edit', task.id)">✎</button>
        <button class="icon-btn danger" title="删除" @click="emit('delete', task.id)">🗑</button>
      </div>
    </div>
    <div v-if="task.tags && task.tags.length" class="tags">
      <span v-for="t in task.tags" :key="t" class="tag">{{ t }}</span>
    </div>
    <div class="progress-row">
      <input
        type="range"
        min="0"
        max="100"
        :value="task.progress"
        @input="onProgress"
        class="progress-bar"
      />
      <span class="progress-text">{{ task.progress }}%</span>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  transition: all 0.15s;
}
.task-card.status-completed {
  opacity: 0.6;
}
.task-card.overdue {
  border-color: var(--danger);
}
.header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.title-area {
  flex: 1;
}
.title {
  font-weight: 500;
  font-size: 14px;
}
.status-completed .title {
  text-decoration: line-through;
}
.meta {
  margin-top: 4px;
  font-size: 11px;
  color: var(--fg-soft);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cat {
  color: var(--primary);
}
.priority {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
}
.p-high { background: rgba(255, 69, 58, 0.15); color: var(--high); }
.p-medium { background: rgba(255, 159, 10, 0.15); color: var(--medium); }
.p-low { background: rgba(52, 199, 89, 0.15); color: var(--low); }
.due {
  color: var(--fg-soft);
}
.overdue .due {
  color: var(--danger);
}
.actions {
  display: flex;
  gap: 4px;
}
.icon-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  font-size: 14px;
  color: var(--fg-soft);
  border-radius: 4px;
}
.icon-btn:hover {
  background: var(--bg-strong);
}
.icon-btn.danger:hover {
  color: var(--danger);
}
.tags {
  margin-top: 6px;
}
.progress-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-bar {
  flex: 1;
}
.progress-text {
  font-size: 11px;
  color: var(--fg-soft);
  min-width: 32px;
  text-align: right;
}
</style>
