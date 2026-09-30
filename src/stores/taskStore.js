// 任务 Store：CRUD、过滤、排序、分类/标签
import { defineStore } from 'pinia'
import { dataApi } from '../services/api'
import { genId, isToday, isOverdue, todayIso } from '../utils/time'

// 列表顺序 = 手动顺序（sortOrder），这样拖动换位才说了算；
// 优先级仍然用颜色标签显示，也仍然可以筛选。
const byManualOrder = (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)

// 跨天自动刷新：isToday() 读的是当前时间，不是响应式数据，
// 所以用 todayKey 作为依赖，日期变了就让「今日」相关视图重新计算。
let dayTimer = null
function startDayWatcher (store) {
  if (dayTimer) return
  dayTimer = setInterval(() => {
    const key = todayIso()
    if (store.todayKey !== key) store.todayKey = key
  }, 30000)
}

// 「今日任务」判定：
//   1. 计划开始 / 截止 / 创建时间落在今天
//   2. 进行中的任务
//   3. 无期限任务（既没计划开始也没截止时间）：没做完就一直留在今日，
//      做完后只在完成当天显示
export function isTodayTask (t) {
  if (!t) return false
  if (isToday(t.plannedStart) || isToday(t.dueTime) || isToday(t.createdAt)) return true
  if (t.status === 'in_progress') return true
  if (!t.plannedStart && !t.dueTime) {
    return t.status !== 'completed' || isToday(t.completedAt)
  }
  return false
}

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    categories: ['工作', '学习', '生活'],
    tags: [],
    todayKey: todayIso(),
    filter: {
      category: null,
      tag: null,
      status: null,
      priority: null,
      scope: 'today'
    },
    loaded: false
  }),
  getters: {
    todayTasks (state) {
      void state.todayKey // 建立跨天依赖
      return state.tasks
        .filter(isTodayTask)
        .sort(byManualOrder)
    },
    overdueTasks (state) {
      return state.tasks.filter(t => t.status !== 'completed' && isOverdue(t.dueTime))
    },
    pendingCount (state) {
      return state.tasks.filter(t => t.status !== 'completed').length
    },
    todayCompleted (state) {
      return state.tasks.filter(t => t.status === 'completed' && isToday(t.completedAt)).length
    },
    todayTotal () {
      return (this.todayTasks || []).length
    },
    filtered (state) {
      void state.todayKey // 建立跨天依赖
      return state.tasks
        .filter(t => {
          if (state.filter.category && t.category !== state.filter.category) return false
          if (state.filter.tag && !(t.tags || []).includes(state.filter.tag)) return false
          if (state.filter.status && t.status !== state.filter.status) return false
          if (state.filter.priority && t.priority !== state.filter.priority) return false
          if (state.filter.scope === 'today' && !isTodayTask(t)) return false
          if (state.filter.scope === 'overdue' && !(t.status !== 'completed' && isOverdue(t.dueTime))) return false
          return true
        })
        .sort(byManualOrder)
    }
  },
  actions: {
    async init () {
      const data = await dataApi.load()
      this.tasks = data.tasks || []
      this.categories = data.categories || ['工作', '学习', '生活']
      this.tags = data.tags || []
      this.todayKey = todayIso()
      this.loaded = true
      startDayWatcher(this)
    },
    async persist () {
      // 从磁盘加载最新数据，仅覆盖 tasks/categories/tags 字段
      // 用 JSON 序列化确保是纯对象（Pinia reactive Proxy 在 IPC 时可能丢失数据）
      const data = await dataApi.load()
      data.tasks = JSON.parse(JSON.stringify(this.tasks))
      data.categories = JSON.parse(JSON.stringify(this.categories))
      data.tags = JSON.parse(JSON.stringify(this.tags))
      await dataApi.save(data)
    },
    async create (partial) {
      const now = new Date().toISOString()
      const task = {
        id: genId('task'),
        title: partial.title || '未命名任务',
        description: partial.description || '',
        category: partial.category || this.categories[0] || '其他',
        tags: partial.tags || [],
        priority: partial.priority || 'medium',
        status: partial.status || 'pending',
        progress: partial.progress || 0,
        plannedStart: partial.plannedStart || null,
        dueTime: partial.dueTime || null,
        completedAt: partial.completedAt || null,
        pomodoroCount: 0,
        sortOrder: this.tasks.length,
        createdAt: now,
        updatedAt: now
      }
      this.tasks.push(task)
      await this.persist()
      return task
    },
    async update (id, patch) {
      const t = this.tasks.find(x => x.id === id)
      if (!t) return null
      Object.assign(t, patch, { updatedAt: new Date().toISOString() })
      await this.persist()
      return t
    },
    async remove (id) {
      const idx = this.tasks.findIndex(x => x.id === id)
      if (idx >= 0) {
        this.tasks.splice(idx, 1)
        await this.persist()
      }
    },
    async setStatus (id, status) {
      const patch = { status }
      if (status === 'completed') {
        patch.progress = 100
        patch.completedAt = new Date().toISOString()
      } else if (status === 'pending') {
        patch.progress = 0
        patch.completedAt = null
      } else {
        patch.completedAt = null
      }
      return this.update(id, patch)
    },
    async setProgress (id, progress) {
      const p = Math.max(0, Math.min(100, progress))
      const patch = { progress: p }
      if (p >= 100) {
        patch.status = 'completed'
        patch.completedAt = new Date().toISOString()
      } else if (p > 0) {
        patch.status = 'in_progress'
      }
      return this.update(id, patch)
    },
    // 拖动排序：把 fromId 插到 toId 的前面或后面（position: before | after）
    async reorder (fromId, toId, position = 'before') {
      const fromIdx = this.tasks.findIndex(t => t.id === fromId)
      const toIdx = this.tasks.findIndex(t => t.id === toId)
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
      // 目标索引按「移除之后」的数组位置换算
      let insertAt = position === 'after' ? toIdx + 1 : toIdx
      if (fromIdx < insertAt) insertAt -= 1
      const [moved] = this.tasks.splice(fromIdx, 1)
      this.tasks.splice(insertAt, 0, moved)
      this.tasks.forEach((t, i) => { t.sortOrder = i })
      await this.persist()
    },
    async addCategory (name) {
      if (!name || this.categories.includes(name)) return
      this.categories.push(name)
      await this.persist()
    },
    async addTag (name) {
      if (!name || this.tags.includes(name)) return
      this.tags.push(name)
      await this.persist()
    },
    setFilter (patch) {
      this.filter = { ...this.filter, ...patch }
    }
  }
})
