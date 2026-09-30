// IPC 处理器：注册所有主进程 IPC 调用
const { ipcMain, BrowserWindow, app, Notification, nativeTheme, dialog } = require('electron')
const { loadData, saveData, exportData, importData } = require('./data.service')
const { refreshSchedule } = require('./notifications')

let timerState = {
  running: false,
  paused: false,
  remainingSec: 0,
  totalSec: 0,
  type: 'focus',
  taskId: null,
  interval: null
}

function getMainWindow () {
  const wins = BrowserWindow.getAllWindows()
  return wins.find(w => w.webContents.getURL().includes('localhost') || w.webContents.getURL().includes('index.html')) || wins[0]
}

function startTimerInterval (getWindow) {
  timerState.interval = setInterval(() => {
    if (!timerState.running || timerState.paused) return
    timerState.remainingSec = Math.max(0, timerState.remainingSec - 1)
    const win = getWindow()
    if (win) {
      win.webContents.send('timer:tick', {
        remainingSec: timerState.remainingSec,
        totalSec: timerState.totalSec,
        type: timerState.type,
        taskId: timerState.taskId
      })
    }
    if (timerState.remainingSec <= 0) {
      stopTimerInterval()
      timerState.running = false
      if (win) {
        win.webContents.send('timer:complete', {
          type: timerState.type,
          taskId: timerState.taskId
        })
      }
    }
  }, 1000)
}

function stopTimerInterval () {
  if (timerState.interval) {
    clearInterval(timerState.interval)
    timerState.interval = null
  }
}

function registerIpcHandlers () {
  // ─── 数据 ───
  ipcMain.handle('data:load', () => loadData())

  ipcMain.handle('data:save', (_e, data) => {
    const result = saveData(data)
    refreshSchedule(getMainWindow, data)
    return result
  })

  ipcMain.handle('data:export', async (_e, targetPath) => {
    const p = targetPath || (await dialog.showSaveDialog({
      title: '导出数据',
      defaultPath: 'tasks-export.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })).filePath
    if (!p) return null
    return exportData(p)
  })

  ipcMain.handle('data:import', async (_e, sourcePath) => {
    const p = sourcePath || (await dialog.showOpenDialog({
      title: '导入数据',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })).filePaths[0]
    if (!p) return null
    return importData(p)
  })

  // ─── 窗口 ───
  ipcMain.handle('window:minimize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win?.minimize()
  })

  ipcMain.handle('window:close', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win?.close()
  })

  ipcMain.handle('window:set-always-on-top', (e, value) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win?.setAlwaysOnTop(!!value)
    return !!value
  })

  ipcMain.handle('window:is-always-on-top', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    return win?.isAlwaysOnTop() || false
  })

  // mini 模式切换：缩小窗口 + 自动置顶
  ipcMain.handle('window:toggle-mini', (e, mini) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return false
    const target = typeof mini === 'boolean' ? mini : !win._miniMode
    if (target) {
      // 进入 mini 模式前保存当前 bounds
      win._normalBounds = win.getBounds()
      win.setAlwaysOnTop(true)
      win.setSkipTaskbar(true)
      win.setMinimumSize(200, 240)
      win.setBounds({ x: 120, y: 120, width: 260, height: 360 })
      win._miniMode = true
    } else {
      win.setAlwaysOnTop(false)
      win.setSkipTaskbar(false)
      win.setMinimumSize(720, 480)
      if (win._normalBounds) {
        win.setBounds(win._normalBounds)
      } else {
        win.setBounds({ width: 900, height: 650 })
      }
      win._miniMode = false
    }
    return target
  })

  // ─── 通知 ───
  ipcMain.handle('notification:show', (_e, { title, body }) => {
    if (!Notification.isSupported()) return false
    const n = new Notification({ title, body })
    n.show()
    return true
  })

  // ─── 番茄钟 ───
  ipcMain.handle('timer:start', (e, payload) => {
    stopTimerInterval()
    timerState.running = true
    timerState.paused = false
    timerState.totalSec = payload.totalSec
    timerState.remainingSec = payload.totalSec
    timerState.type = payload.type || 'focus'
    timerState.taskId = payload.taskId || null
    startTimerInterval(getMainWindow)
    return true
  })

  ipcMain.handle('timer:pause', () => {
    timerState.paused = true
    stopTimerInterval()
    return true
  })

  ipcMain.handle('timer:resume', () => {
    if (timerState.running && timerState.paused) {
      timerState.paused = false
      startTimerInterval(getMainWindow)
    }
    return true
  })

  ipcMain.handle('timer:reset', () => {
    stopTimerInterval()
    timerState.running = false
    timerState.paused = false
    timerState.remainingSec = 0
    return true
  })

  // ─── 系统 ───
  ipcMain.handle('system:set-auto-launch', (_e, enabled) => {
    app.setLoginItemSettings({ openAtLogin: !!enabled })
    return true
  })

  ipcMain.handle('system:set-theme', (_e, theme) => {
    if (theme === 'dark') nativeTheme.themeSource = 'dark'
    else if (theme === 'light') nativeTheme.themeSource = 'light'
    else nativeTheme.themeSource = 'system'
    return true
  })
}

module.exports = { registerIpcHandlers }
