<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import TaskCard from '../components/TaskCard.vue'
import TaskEditor from '../components/TaskEditor.vue'
import { useRouter } from 'vue-router'

const taskStore = useTaskStore()
const router = useRouter()
const editorOpen = ref(false)
const editingId = ref(null)

onMounted(async () => {
  if (!taskStore.loaded) await taskStore.init()
  taskStore.setFilter({ scope: 'all' })
})

const list = computed(() => taskStore.filtered)

function openCreate () {
  editingId.value = null
  editorOpen.value = true
}
function openEdit (id) {
  editingId.value = id
  editorOpen.value = true
}
function setFilter (patch) {
  taskStore.setFilter(patch)
}
function clearFilter () {
  taskStore.setFilter({
    category: null, tag: null, status: null, priority: null, scope: 'all'
  })
}
</script>

<template>
  <div class="all-tasks">
    <div class="header">
      <h2>全部任务</h2>
      <button class="primary" @click="openCreate">+ 新建</button>
    </div>

    <div class="filter-bar card">
      <select :value="taskStore.filter.category" @change="e => setFilter({ category: e.target.value || null })">
        <option value="">全部分类</option>
        <option v-for="c in taskStore.categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select :value="taskStore.filter.status" @change="e => setFilter({ status: e.target.value || null })">
        <option value="">全部状态</option>
        <option value="pending">待办</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
      </select>
      <select :value="taskStore.filter.priority" @change="e => setFilter({ priority: e.target.value || null })">
        <option value="">全部优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      <select :value="taskStore.filter.scope" @change="e => setFilter({ scope: e.target.value })">
        <option value="all">不限时间</option>
        <option value="today">仅今日</option>
        <option value="overdue">已逾期</option>
      </select>
      <button @click="clearFilter">清空</button>
    </div>

    <div v-if="list.length === 0" class="empty">暂无符合条件的任务</div>
    <div v-else class="task-list">
      <TaskCard
        v-for="t in list"
        :key="t.id"
        :task="t"
        @edit="openEdit"
        @delete="taskStore.remove"
        @toggle-status="(id, s) => taskStore.setStatus(id, s)"
        @set-progress="(id, p) => taskStore.setProgress(id, p)"
        @start-pomodoro="(id) => router.push({ path: '/timer', query: { taskId: id } })"
      />
    </div>

    <TaskEditor v-model="editorOpen" :task-id="editingId" />
  </div>
</template>

<style scoped>
.all-tasks { display: flex; flex-direction: column; gap: 12px; }
.header { display: flex; justify-content: space-between; align-items: center; }
.header h2 { font-size: 18px; }
.filter-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.filter-bar select { min-width: 100px; }
.task-list { display: flex; flex-direction: column; }
</style>
