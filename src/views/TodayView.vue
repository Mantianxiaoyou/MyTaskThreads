<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import TaskCard from '../components/TaskCard.vue'
import TaskEditor from '../components/TaskEditor.vue'
import ProgressRing from '../components/ProgressRing.vue'
import { useRouter } from 'vue-router'

const taskStore = useTaskStore()
const router = useRouter()

const editorOpen = ref(false)
const editingId = ref(null)

const todayTasks = computed(() => taskStore.todayTasks)
const completionRate = computed(() => {
  if (!todayTasks.value.length) return 0
  return Math.round((taskStore.todayCompleted / todayTasks.value.length) * 100)
})

onMounted(async () => {
  if (!taskStore.loaded) await taskStore.init()
})

function openCreate () {
  editingId.value = null
  editorOpen.value = true
}
function openEdit (id) {
  editingId.value = id
  editorOpen.value = true
}
async function toggleStatus (id, status) {
  await taskStore.setStatus(id, status)
}
async function setProgress (id, p) {
  await taskStore.setProgress(id, p)
}
function startPomodoro (taskId) {
  router.push({ path: '/timer', query: { taskId } })
}
</script>

<template>
  <div class="today-view">
    <div class="header">
      <h2>今日</h2>
      <button class="primary" @click="openCreate">+ 新建任务</button>
    </div>

    <div class="summary card">
      <ProgressRing :percent="completionRate" />
      <div class="summary-text">
        <div>今日完成 <b>{{ taskStore.todayCompleted }}</b> / {{ todayTasks.length }}</div>
        <div class="hint">{{ todayTasks.length === 0 ? '今日暂无安排' : (completionRate === 100 ? '全部完成，干得漂亮！' : '继续加油') }}</div>
      </div>
    </div>

    <div v-if="todayTasks.length === 0" class="empty">
      还没有今日任务，点击右上角新建一项吧。
    </div>
    <div v-else class="task-list">
      <TaskCard
        v-for="t in todayTasks"
        :key="t.id"
        :task="t"
        @edit="openEdit"
        @delete="taskStore.remove"
        @toggle-status="toggleStatus"
        @set-progress="setProgress"
        @start-pomodoro="startPomodoro"
      />
    </div>

    <TaskEditor v-model="editorOpen" :task-id="editingId" />
  </div>
</template>

<style scoped>
.today-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header h2 {
  font-size: 18px;
}
.summary {
  display: flex;
  align-items: center;
  gap: 16px;
}
.summary-text {
  flex: 1;
}
.summary-text b {
  color: var(--primary);
}
.hint {
  margin-top: 4px;
  color: var(--fg-soft);
  font-size: 12px;
}
.task-list {
  display: flex;
  flex-direction: column;
}
</style>
