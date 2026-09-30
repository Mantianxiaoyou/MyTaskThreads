// Electron 主进程入口
const { app, BrowserWindow, ipcMain, Notification, nativeTheme, globalShortcut } = require('electron')
const path = require('path')
const { registerIpcHandlers } = require('./ipc-handlers')
const { createTray } = require('./tray')
const { initNotificationScheduler } = require('./notifications')
const { loadData } = require('./data.service')

let mainWindow = null
let tray = null

// 是否开发环境：通过环境变量 DEV=1 显式开启，否则加载本地 dist
const isDev = process.env.DEV === '1' || process.argv.some(a => a.includes('--dev'))

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 720,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    title: '工作进度提醒',
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // 启动后显示，避免白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 加载渲染进程：开发环境连 Vite dev server，生产环境加载打包文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // 不自动打开 DevTools；需要时按 F12 或 Ctrl+Shift+I 手动打开
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // 默认非置顶；后续会被设置覆盖
  mainWindow.setAlwaysOnTop(false)
  // 标记当前是否 mini 模式
  mainWindow._miniMode = false

  // 关闭时清理引用
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // 注册 IPC
    registerIpcHandlers()
    // 创建主窗口
    createWindow()
    // 创建托盘
    tray = createTray(mainWindow)
    // 通知调度器
    initNotificationScheduler(mainWindow)
    // 应用持久化设置：始终置顶
    try {
      const data = loadData()
      if (data?.settings?.alwaysOnTop && mainWindow) {
        mainWindow.setAlwaysOnTop(true)
      }
    } catch (e) {
      console.error('应用 alwaysOnTop 失败：', e)
    }
    // 注册全局快捷键 Ctrl+Shift+T：显示/隐藏主窗口
    globalShortcut.register('CommandOrControl+Shift+T', () => {
      if (!mainWindow) return
      if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
        mainWindow.hide()
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
      }
    })
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  // macOS 重新激活
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

// 所有窗口关闭：在 Windows 上退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 导出供其他模块使用
module.exports = { getMainWindow: () => mainWindow, getTray: () => tray }
