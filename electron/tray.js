// 系统托盘
const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')

function createTray (mainWindow) {
  let icon
  const iconPath = path.join(__dirname, '..', 'src', 'assets', 'icons', 'tray.png')
  try {
    const fs = require('fs')
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath)
      icon.setAspectRatio(1, 1)
    } else {
      icon = nativeImage.createFromBuffer(Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQElEQVR4nO3SQQ0AIAwEMP9w9jW237Mt3wcdBEICcRtJVSDWF8/gh0yKUQ0kLg8S14yEMo+1AP9zBnqL9cQ+AAAAAElFTkSuQmCC',
        'base64'
      ))
    }
  } catch (e) {
    icon = nativeImage.createEmpty()
  }

  const tray = new Tray(icon)
  tray.setToolTip('工作进度提醒')

  const buildContextMenu = () => Menu.buildFromTemplate([
    { label: '工作进度提醒', enabled: false },
    { type: 'separator' },
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '切换 mini 小窗',
      click: () => {
        if (!mainWindow) return
        const target = !mainWindow._miniMode
        if (target) {
          mainWindow._normalBounds = mainWindow.getBounds()
          mainWindow.setAlwaysOnTop(true)
          mainWindow.setSkipTaskbar(true)
          mainWindow.setMinimumSize(200, 240)
          mainWindow.setBounds({ x: 120, y: 120, width: 260, height: 360 })
          mainWindow._miniMode = true
          // 通知渲染进程切换视图
          mainWindow.webContents.send('mini-mode-change', { mini: true })
        } else {
          mainWindow.setAlwaysOnTop(false)
          mainWindow.setSkipTaskbar(false)
          mainWindow.setMinimumSize(720, 480)
          if (mainWindow._normalBounds) {
            mainWindow.setBounds(mainWindow._normalBounds)
          }
          mainWindow._miniMode = false
          mainWindow.webContents.send('mini-mode-change', { mini: false })
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(buildContextMenu())
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
      }
    }
  })

  return tray
}

module.exports = { createTray }
