// 任务 Store：CRUD、过滤、排序、分类/标签
import { defineStore } from 'pinia'
import { dataApi } from '../services/api'
import { genId, isToday, isOverdue } from '../utils/time'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    categories: ['工作', '学习', '生活'],
    tags: [],
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
      return state.tasks
        .filter(t => isToday(t.plannedStart) || isToday(t.dueTime) || (t.status === 'in_progress'))
        .sort((a, b) => (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) || ((a.sortOrder || 0) - (b.sortOrder || 0)))
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
      return state.tasks
        .filter(t => {
          if (state.filter.category && t.category !== state.filter.category) return false
          if (state.filter.tag && !(t.tags || []).includes(state.filter.tag)) return false
          if (state.filter.status && t.status !== state.filter.status) return false
          if (state.filter.priority && t.priority !== state.filter.priority) return false
          if (state.filter.scope === 'today' && !(isToday(t.plannedStart) || isToday(t.dueTime))) return false
          if (state.filter.scope === 'overdue' && !(t.status !== 'completed' && isOverdue(t.dueTime))) return false
          return true
        })
        .sort((a, b) => (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) || ((a.sortOrder || 0) - (b.sortOrder || 0)))
    }
  },
  actions: {
    async init () {
      const data = await dataApi.load()
      this.tasks = data.tasks || []
      this.categories = data.categories || ['工作', '学习', '生活']
      this.tags = data.tags || []
      this.loaded = true
    },
    async persist () {
      const data = await dataApi.load()
      data.tasks = this.tasks
      data.categories = this.categories
      data.tags = this.tags
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
    async reorder (fromId, toId) {
      const fromIdx = this.tasks.findIndex(t => t.id === fromId)
      const toIdx = this.tasks.findIndex(t => t.id === toId)
      if (fromIdx < 0 || toIdx < 0) return
      const [moved] = this.tasks.splice(fromIdx, 1)
      this.tasks.splice(toIdx, 0, moved)
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
