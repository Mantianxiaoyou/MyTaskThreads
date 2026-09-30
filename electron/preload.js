// preload：通过 contextBridge 暴露受控 API 给渲染进程
const { contextBridge, ipcRenderer } = require('electron')

// 数据 IPC
contextBridge.exposeInMainWorld('api', {
  // 数据
  data: {
    load: () => ipcRenderer.invoke('data:load'),
    save: (data) => ipcRenderer.invoke('data:save', data),
    export: (targetPath) => ipcRenderer.invoke('data:export', targetPath),
    import: (sourcePath) => ipcRenderer.invoke('data:import', sourcePath)
  },
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleAlwaysOnTop: (value) => ipcRenderer.invoke('window:set-always-on-top', value),
    isAlwaysOnTop: () => ipcRenderer.invoke('window:is-always-on-top'),
    toggleMini: (mini) => ipcRenderer.invoke('window:toggle-mini', mini),
    onMiniModeChange: (cb) => {
      const handler = (_e, detail) => cb(detail)
      ipcRenderer.on('mini-mode-change', handler)
      return () => ipcRenderer.removeListener('mini-mode-change', handler)
    }
  },
  // 通知
  notification: {
    show: (title, body) => ipcRenderer.invoke('notification:show', { title, body }),
    onScheduleRefresh: (cb) => ipcRenderer.on('schedule:refresh', () => cb())
  },
  // 番茄钟
  timer: {
    start: (payload) => ipcRenderer.invoke('timer:start', payload),
    pause: () => ipcRenderer.invoke('timer:pause'),
    resume: () => ipcRenderer.invoke('timer:resume'),
    reset: () => ipcRenderer.invoke('timer:reset'),
    onTick: (cb) => ipcRenderer.on('timer:tick', (_e, payload) => cb(payload)),
    onComplete: (cb) => ipcRenderer.on('timer:complete', (_e, payload) => cb(payload))
  },
  // 系统信息
  system: {
    setAutoLaunch: (enabled) => ipcRenderer.invoke('system:set-auto-launch', enabled),
    setTheme: (theme) => ipcRenderer.invoke('system:set-theme', theme)
  }
})
