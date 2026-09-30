import { computed } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

// 窗口背景样式：把主题色按「明暗」和「不透明度」两个维度重新混合出来。
// - 基准色直接取主题变量：主窗口用 --bg，mini 小窗用 --bg-elevated，
//   因此 bgBrightness = 50、bgOpacity = 100 时与未自定义时完全一致。
// - 明暗：50 为基准，< 50 向黑混合，> 50 向白混合。
// - 不透明度：再与 transparent 混合，得到带 alpha 的背景色。
//   窗口本身需要 transparent: true（见 electron/main.js），否则 alpha 无效。
export function useBackground (variant = 'main') {
  const settingsStore = useSettingsStore()
  const baseColor = variant === 'mini' ? 'var(--bg-elevated)' : 'var(--bg)'

  function clamp (value, fallback) {
    const n = Number(value)
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback
  }

  const opacity = computed(() => clamp(settingsStore.settings.bgOpacity, 100))
  const brightness = computed(() => clamp(settingsStore.settings.bgBrightness, 50))

  // 明暗调整后的基色
  const toneColor = computed(() => {
    const b = brightness.value
    if (b === 50) return baseColor
    const amount = Math.abs(b - 50) * 2 // 0-100
    const target = b < 50 ? 'black' : 'white'
    return `color-mix(in srgb, ${baseColor} ${100 - amount}%, ${target})`
  })

  const bgColor = computed(() => {
    const a = opacity.value
    if (a >= 100) return toneColor.value
    return `color-mix(in srgb, ${toneColor.value} ${a}%, transparent)`
  })

  const bgStyle = computed(() => ({ backgroundColor: bgColor.value }))

  return { bgStyle, bgColor, opacity, brightness }
}
