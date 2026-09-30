// 数据服务：读写本地 JSON 文件，原子写入 + 解析失败时备份重建
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const DATA_FILE = 'tasks.json'

function getDataPath () {
  return path.join(app.getPath('userData'), DATA_FILE)
}

function getBackupPath () {
  return getDataPath() + '.bak'
}

function defaultData () {
  return {
    tasks: [],
    categories: ['工作', '学习', '生活'],
    tags: [],
    pomodoroSessions: [],
    settings: {
      pomodoroFocus: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
      longBreakInterval: 4,
      notificationsEnabled: true,
      minimizeToTray: true,
      autoStartNext: false,
      launchOnBoot: false,
      alwaysOnTop: false,
      theme: 'auto',
      remindBeforeMin: 10
    },
    version: 1
  }
}

function mergeWithDefaults (loaded) {
  const defaults = defaultData()
  return {
    tasks: Array.isArray(loaded?.tasks) ? loaded.tasks : [],
    categories: Array.isArray(loaded?.categories) && loaded.categories.length ? loaded.categories : defaults.categories,
    tags: Array.isArray(loaded?.tags) ? loaded.tags : [],
    pomodoroSessions: Array.isArray(loaded?.pomodoroSessions) ? loaded.pomodoroSessions : [],
    settings: { ...defaults.settings, ...(loaded?.settings || {}) },
    version: 1
  }
}

function atomicWrite (filePath, content) {
  const tmp = filePath + '.tmp.' + process.pid
  fs.writeFileSync(tmp, content, 'utf8')
  fs.renameSync(tmp, filePath)
}

function loadData () {
  const p = getDataPath()
  try {
    if (!fs.existsSync(p)) {
      const fresh = defaultData()
      atomicWrite(p, JSON.stringify(fresh, null, 2))
      return fresh
    }
    const raw = fs.readFileSync(p, 'utf8')
    const parsed = JSON.parse(raw)
    return mergeWithDefaults(parsed)
  } catch (e) {
    console.error('数据解析失败，备份原文件并重建：', e)
    try {
      if (fs.existsSync(p)) {
        const bak = `${getBackupPath()}.${Date.now()}`
        fs.copyFileSync(p, bak)
      }
    } catch (e2) {
      console.error('备份失败：', e2)
    }
    const fresh = defaultData()
    atomicWrite(p, JSON.stringify(fresh, null, 2))
    return fresh
  }
}

function saveData (data) {
  const merged = mergeWithDefaults(data)
  atomicWrite(getDataPath(), JSON.stringify(merged, null, 2))
  return merged
}

function exportData (targetPath) {
  const p = getDataPath()
  if (!fs.existsSync(p)) {
    atomicWrite(p, JSON.stringify(defaultData(), null, 2))
  }
  fs.copyFileSync(p, targetPath)
  return targetPath
}

function importData (sourcePath) {
  if (!fs.existsSync(sourcePath)) throw new Error('源文件不存在')
  const raw = fs.readFileSync(sourcePath, 'utf8')
  const parsed = JSON.parse(raw)
  const merged = mergeWithDefaults(parsed)
  saveData(merged)
  return merged
}

module.exports = {
  loadData,
  saveData,
  exportData,
  importData,
  defaultData,
  getDataPath
}
