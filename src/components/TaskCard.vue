<script setup>
import { computed, ref } from 'vue'
import { isOverdue, formatDueTime } from '../utils/time'

const props = defineProps({
  task: { type: Object, required: true }
})
const emit = defineEmits(['edit', 'delete', 'toggle-status', 'set-progress', 'start-pomodoro', 'reorder'])

const priorityLabel = computed(() => ({ high: '高', medium: '中', low: '低' }[props.task.priority] || '中'))
const overdue = computed(() => props.task.status !== 'completed' && isOverdue(props.task.dueTime))
const completed = computed(() => props.task.status === 'completed')
const progress = computed(() => Math.max(0, Math.min(100, props.task.progress || 0)))

// 拖动排序：只让卡片里的握把发起拖动，避免和进度滑块、按钮抢事件
const dragging = ref(false)
const dropPos = ref('')

function onDragStart (e) {
  dragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', props.task.id)
  const card = e.currentTarget.closest('.task-card')
  if (card) e.dataTransfer.setDragImage(card, 24, 24)
}

function onDragEnd () {
  dragging.value = false
  dropPos.value = ''
}

function onDragOver (e) {
  e.preventDefault()
  if (dragging.value) return // 拖到自己身上不显示插入线
  e.dataTransfer.dropEffect = 'move'
  const rect = e.currentTarget.getBoundingClientRect()
  dropPos.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function onDragLeave () {
  dropPos.value = ''
}

function onDrop (e) {
  e.preventDefault()
  const fromId = e.dataTransfer.getData('text/plain')
  const position = dropPos.value || 'before'
  dropPos.value = ''
  dragging.value = false
  if (!fromId || fromId === props.task.id) return
  emit('reorder', fromId, props.task.id, position)
}

function onProgress (e) {
  emit('set-progress', props.task.id, Number(e.target.value))
}
function toggleComplete () {
  emit('toggle-status', props.task.id, completed.value ? 'pending' : 'completed')
}
</script>

<template>
  <div
    class="task-card"
    :class="[`status-${task.status}`, `p-${task.priority}`, { overdue, completed, dragging, 'drop-before': dropPos === 'before', 'drop-after': dropPos === 'after' }]"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="left-line"></div>
    <div class="card-body">
      <div class="header">
        <label class="check-wrap" :title="completed ? '标记未完成' : '标记完成'">
          <input
            type="checkbox"
            :checked="completed"
            @change="toggleComplete"
          />
          <span class="checkbox-fake"></span>
        </label>

        <span
          class="grip"
          draggable="true"
          title="按住拖动排序"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
        >⋮⋮</span>

        <div class="title-area">
          <div class="title" :title="task.title">{{ task.title }}</div>
          <div class="meta">
            <span class="cat" v-if="task.category">{{ task.category }}</span>
            <span class="priority" :class="`p-${task.priority}`">{{ priorityLabel }}</span>
            <span v-if="task.dueTime" class="due" :class="{ overdue }">
              {{ overdue ? '已超期 ' : '截止 ' }}{{ formatDueTime(task.dueTime) }}
            </span>
            <span v-if="task.pomodoroCount > 0" class="pomo">🍅 {{ task.pomodoroCount }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="icon-btn ghost" title="开始番茄钟" @click="emit('start-pomodoro', task.id)">⏱</button>
          <button class="icon-btn ghost" title="编辑" @click="emit('edit', task.id)">✎</button>
          <button class="icon-btn ghost danger" title="删除" @click="emit('delete', task.id)">×</button>
        </div>
      </div>

      <!-- 进度条 + 滑块 -->
      <div class="progress-row" v-if="!completed">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          :value="progress"
          class="range-input"
          @input="onProgress"
        />
        <span class="progress-text mono">{{ progress }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  display: flex;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--duration) var(--ease);
  position: relative;
}
.task-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.task-card.completed {
  opacity: 0.65;
}
.left-line {
  width: 3px;
  background: var(--border);
  transition: background var(--duration) var(--ease);
}
.task-card.p-high .left-line { background: var(--high); }
.task-card.p-medium .left-line { background: var(--medium); }
.task-card.p-low .left-line { background: var(--low); }
.task-card.completed .left-line { background: var(--success); }
.task-card.overdue {
  border-color: var(--danger);
  box-shadow: 0 0 0 1px var(--danger);
}
.task-card.overdue .left-line {
  background: var(--danger);
  animation: blink 1.6s var(--ease) infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.card-body {
  flex: 1;
  padding: 10px 12px;
  min-width: 0;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

/* 拖动手柄：只有它能发起拖动，避免和复选框 / 滑块 / 按钮抢事件 */
.grip {
  flex-shrink: 0;
  padding: 1px 3px;
  margin-top: 1px;
  font-size: 11px;
  line-height: 1;
  letter-spacing: -1px;
  color: var(--fg-mute);
  border-radius: var(--radius-sm);
  cursor: grab;
  user-select: none;
  transition: all var(--duration-fast) var(--ease);
}
.grip:hover {
  color: var(--fg-soft);
  background: var(--bg-strong);
}
.grip:active {
  cursor: grabbing;
}

/* 拖动中的卡片与被拖到的那条插入线 */
.task-card.dragging {
  opacity: 0.45;
}
.task-card.drop-before::before,
.task-card.drop-after::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  height: 2px;
  background: var(--primary);
  border-radius: 2px;
}
.task-card.drop-before::before { top: 0; }
.task-card.drop-after::after { bottom: 0; }

/* 复选框 */
.check-wrap {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-top: 1px;
}
.check-wrap input {
  display: none;
}
.checkbox-fake {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border-strong);
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all var(--duration-fast) var(--ease);
}
.check-wrap:hover .checkbox-fake {
  border-color: var(--primary);
}
.check-wrap input:checked + .checkbox-fake {
  background: var(--primary);
  border-color: var(--primary);
}
.check-wrap input:checked + .checkbox-fake::after {
  content: '✓';
  color: #fff;
  font-size: 11px;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.title-area {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 13px;
  font-weight: 500;
  color: var(--fg);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-card.completed .title {
  text-decoration: line-through;
  color: var(--fg-soft);
}
.meta {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: var(--fg-mute);
  flex-wrap: wrap;
}
.cat, .priority, .due, .pomo {
  padding: 1px 6px;
  background: var(--bg-strong);
  border-radius: 3px;
}
.priority.p-high { background: rgba(185, 28, 28, 0.1); color: var(--high); }
.priority.p-medium { background: rgba(194, 65, 12, 0.1); color: var(--medium); }
.priority.p-low { background: rgba(21, 128, 61, 0.1); color: var(--low); }
.due.overdue {
  background: rgba(185, 28, 28, 0.1);
  color: var(--danger);
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease);
}
.task-card:hover .actions {
  opacity: 1;
}
.icon-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  font-size: 13px;
  color: var(--fg-soft);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease);
}
.icon-btn:hover {
  background: var(--bg-strong);
  color: var(--fg);
}
.icon-btn.danger:hover {
  color: var(--danger);
  background: rgba(185, 28, 28, 0.1);
}

/* 进度条 */
.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-left: 24px;
}
.progress-track {
  flex: 1;
  height: 4px;
  background: var(--bg-strong);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width var(--duration) var(--ease);
  border-radius: 2px;
}
.range-input {
  width: 80px;
  margin: 0;
  padding: 0;
  height: 14px;
  background: transparent;
  border: none;
}
.range-input::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--bg-strong);
  border-radius: 2px;
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: -4px;
  cursor: pointer;
  border: 2px solid var(--bg-elevated);
  box-shadow: var(--shadow-sm);
}
.progress-text {
  font-size: 10px;
  color: var(--fg-soft);
  min-width: 28px;
  text-align: right;
}
.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
</style>
