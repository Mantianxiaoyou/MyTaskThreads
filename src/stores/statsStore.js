// 统计 Store：从 pomodoroSessions + tasks 计算日/周/月聚合
import { defineStore } from 'pinia'
import { dataApi } from '../services/api'
import { isToday } from '../utils/time'

function dayKey (iso) {
  if (!iso) return null
  const d = new Date(iso)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

export const useStatsStore = defineStore('stats', {
  state: () => ({
    sessions: [],
    tasks: [],
    loaded: false
  }),
  getters: {
    todayFocusSec (state) {
      const tk = dayKey(new Date().toISOString())
      return state.sessions
        .filter(s => s.type === 'focus' && s.completed && dayKey(s.startTime) === tk)
        .reduce((a, s) => a + (s.durationSec || 0), 0)
    },
    todayTaskCount (state) {
      return state.tasks.filter(t => t.status === 'completed' && isToday(t.completedAt)).length
    },
    weekData (state) {
      const arr = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = dayKey(d.toISOString())
        const focusMin = Math.round(
          state.sessions
            .filter(s => s.type === 'focus' && s.completed && dayKey(s.startTime) === key)
            .reduce((a, s) => a + (s.durationSec || 0), 0) / 60
        )
        const taskCount = state.tasks.filter(t => t.status === 'completed' && dayKey(t.completedAt) === key).length
        arr.push({ date: key, focusMin, taskCount })
      }
      return arr
    },
    monthHeatmap (state) {
      const map = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        map[dayKey(d.toISOString())] = 0
      }
      state.sessions.forEach(s => {
        if (s.type !== 'focus' || !s.completed) return
        const k = dayKey(s.startTime)
        if (k in map) map[k] += Math.round((s.durationSec || 0) / 60)
      })
      return map
    },
    categoryDistribution (state) {
      const map = {}
      const now = new Date()
      state.tasks.forEach(t => {
        if (!t.completedAt) return
        const d = new Date(t.completedAt)
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return
        const c = t.category || '未分类'
        map[c] = (map[c] || 0) + 1
      })
      return Object.entries(map).map(([name, value]) => ({ name, value }))
    }
  },
  actions: {
    async init () {
      const data = await dataApi.load()
      this.sessions = data.pomodoroSessions || []
      this.tasks = data.tasks || []
      this.loaded = true
    }
  }
})
