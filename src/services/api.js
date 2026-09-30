// 前端 API 封装：所有对主进程的 IPC 调用统一在此
const api = window.api || {}

export const dataApi = {
  load: () => api.data?.load(),
  save: (data) => api.data?.save(data),
  exportPath: (p) => api.data?.export(p),
  importPath: (p) => api.data?.import(p)
}

export const windowApi = {
  minimize: () => api.window?.minimize(),
  setAlwaysOnTop: (value) => api.window?.toggleAlwaysOnTop(value),
  isAlwaysOnTop: () => api.window?.isAlwaysOnTop(),
  toggleMini: (mini) => api.window?.toggleMini(mini)
}

export const notificationApi = {
  show: (title, body) => api.notification?.show(title, body),
  onScheduleRefresh: (cb) => api.notification?.onScheduleRefresh?.(cb)
}

export const timerApi = {
  start: (payload) => api.timer?.start(payload),
  pause: () => api.timer?.pause(),
  resume: () => api.timer?.resume(),
  reset: () => api.timer?.reset(),
  onTick: (cb) => api.timer?.onTick?.(cb),
  onComplete: (cb) => api.timer?.onComplete?.(cb)
}

export const systemApi = {
  setAutoLaunch: (enabled) => api.system?.setAutoLaunch(enabled),
  setTheme: (theme) => api.system?.setTheme(theme)
}

export default api
