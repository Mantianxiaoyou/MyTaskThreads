// 番茄钟 Store：状态由主进程驱动，前端只接收 tick/complete 事件
import { defineStore } from 'pinia'
import { timerApi, dataApi } from '../services/api'
import { useSettingsStore } from './settingsStore'
import { useTaskStore } from './taskStore'
import { genId } from '../utils/time'

export const useTimerStore = defineStore('timer', {
  state: () => ({
    running: false,
    paused: false,
    type: 'focus',
    remainingSec: 0,
    totalSec: 0,
    taskId: null,
    completedRounds: 0
  }),
  getters: {
    progress (state) {
      if (state.totalSec <= 0) return 0
      return Math.round((1 - state.remainingSec / state.totalSec) * 100)
    }
  },
  actions: {
    bindEvents () {
      timerApi.onTick?.((payload) => {
        this.remainingSec = payload.remainingSec
        this.totalSec = payload.totalSec
        this.type = payload.type
        this.taskId = payload.taskId
      })
      timerApi.onComplete?.(async (payload) => {
        this.running = false
        this.remainingSec = 0
        await this.onComplete(payload)
      })
    },
    async start (payload = {}) {
      const settingsStore = useSettingsStore()
      if (!settingsStore.loaded) await settingsStore.init()
      const s = settingsStore.settings
      const type = payload.type || 'focus'
      let durationMin
      if (type === 'focus') durationMin = s.pomodoroFocus
      else if (type === 'longBreak') durationMin = s.pomodoroLongBreak
      else durationMin = s.pomodoroBreak

      this.type = type
      this.taskId = payload.taskId || null
      this.totalSec = durationMin * 60
      this.remainingSec = durationMin * 60
      this.running = true
      this.paused = false

      await timerApi.start({
        totalSec: this.totalSec,
        type: this.type,
        taskId: this.taskId
      })
    },
    async pause () {
      this.paused = true
      await timerApi.pause()
    },
    async resume () {
      this.paused = false
      await timerApi.resume()
    },
    async reset () {
      this.running = false
      this.paused = false
      this.remainingSec = 0
      await timerApi.reset()
    },
    async onComplete (payload) {
      const settingsStore = useSettingsStore()
      const taskStore = useTaskStore()
      if (!taskStore.loaded) await taskStore.init()
      const s = settingsStore.settings

      const data = await dataApi.load()
      data.pomodoroSessions = data.pomodoroSessions || []
      const dur = payload.type === 'focus' ? s.pomodoroFocus : (payload.type === 'longBreak' ? s.pomodoroLongBreak : s.pomodoroBreak)
      data.pomodoroSessions.push({
        id: genId('pm'),
        taskId: payload.taskId,
        startTime: new Date(Date.now() - dur * 60000).toISOString(),
        durationSec: dur * 60,
        type: payload.type,
        completed: true
      })

      if (payload.type === 'focus' && payload.taskId) {
        const t = (data.tasks || []).find(x => x.id === payload.taskId)
        if (t) {
          t.pomodoroCount = (t.pomodoroCount || 0) + 1
          this.completedRounds = this.completedRounds + 1
        }
      }
      await dataApi.save(data)
      await taskStore.init()

      if (s.autoStartNext) {
        if (payload.type === 'focus') {
          const isLongBreak = this.completedRounds > 0 && this.completedRounds % s.longBreakInterval === 0
          await this.start({ type: isLongBreak ? 'longBreak' : 'break' })
        } else {
          await this.start({ type: 'focus', taskId: this.taskId })
        }
      }
    }
  }
})
