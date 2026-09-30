// 工具：生成 ID（无依赖）
export function genId (prefix = 'id') {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${t}${r}`
}

// 工具：时间格式化
export function formatTime (sec) {
  if (!sec || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function todayIso () {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

export function isSameDay (isoA, isoB) {
  if (!isoA || !isoB) return false
  return new Date(isoA).toDateString() === new Date(isoB).toDateString()
}

export function isToday (iso) {
  if (!iso) return false
  return new Date(iso).toDateString() === new Date().toDateString()
}

export function isOverdue (iso) {
  if (!iso) return false
  return new Date(iso).getTime() < Date.now()
}

export function localToIso (local) {
  if (!local) return null
  const d = new Date(local)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export function isoToLocal (iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 16)
}

// 展示用的截止时间：今天 18:00 / 明天 09:30 / 10-05 18:00 / 2027-01-03 10:00
// （isoToLocal 是给 datetime-local 输入框用的，直接显示会露出 ISO 串）
export function formatDueTime (iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const dayStart = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((dayStart(d) - dayStart(new Date())) / 86400000)
  if (diff === 0) return `今天 ${hm}`
  if (diff === 1) return `明天 ${hm}`
  if (diff === -1) return `昨天 ${hm}`
  const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return d.getFullYear() === new Date().getFullYear() ? `${md} ${hm}` : `${d.getFullYear()}-${md} ${hm}`
}
