// 通知调度器：基于任务列表设置 setTimeout 提醒
const { Notification } = require('electron')
const { loadData } = require('./data.service')

let activeTimers = []

function clearTimers () {
  activeTimers.forEach(t => clearTimeout(t))
  activeTimers = []
}

function scheduleAt (whenMs, title, body) {
  const delay = whenMs - Date.now()
  if (delay <= 0) return
  const t = setTimeout(() => {
    if (Notification.isSupported()) {
      const n = new Notification({ title, body })
      n.show()
    }
  }, delay)
  activeTimers.push(t)
}

function isToday (isoStr) {
  if (!isoStr) return false
  const d = new Date(isoStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

function refreshSchedule (getWindow, dataOverride) {
  clearTimers()
  const data = dataOverride || loadData()
  const settings = data.settings || {}
  if (!settings.notificationsEnabled) return

  const remindBefore = (settings.remindBeforeMin || 10) * 60 * 1000
  const now = Date.now()

  for (const task of data.tasks || []) {
    if (task.status === 'completed') continue
    const startMs = task.plannedStart ? new Date(task.plannedStart).getTime() : null
    const dueMs = task.dueTime ? new Date(task.dueTime).getTime() : null

    if (startMs && isToday(task.plannedStart) && startMs > now) {
      const remindAt = Math.max(startMs - remindBefore, now + 1000)
      scheduleAt(remindAt, `任务即将开始：${task.title}`, `将在 ${Math.floor((startMs - remindAt) / 60000)} 分钟后开始`)
      scheduleAt(startMs, `任务开始：${task.title}`, '该开始这项工作了')
    }
    if (dueMs) {
      const remindAt = dueMs - remindBefore
      if (remindAt > now) {
        scheduleAt(remindAt, `任务即将到期：${task.title}`, `将在 ${Math.floor((dueMs - remindAt) / 60000)} 分钟后到期`)
      }
      if (dueMs > now) {
        scheduleAt(dueMs, `任务已到期：${task.title}`, '请尽快完成或调整时间')
      }
    }
  }
}

function initNotificationScheduler (getWindow) {
  refreshSchedule(getWindow)
}

module.exports = {
  initNotificationScheduler,
  refreshSchedule
}
