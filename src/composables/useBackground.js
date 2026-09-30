import { computed } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

// 窗口背景样式，分两层：
//   1. bgStyle       —— 窗口底色 + 遮罩色变量（把主题色按「明暗」「不透明度」混合出来）
//   2. bgImageStyle  —— 可选的自定义图片层，叠在底色之上、内容之下
//
// 关键：图片层需要的定位 / 层叠属性全部走内联样式，不依赖组件的 <style scoped>。
// 之前放在 scoped CSS 里时，只要那个模块的样式没跟上（热更新没生效、加载的是旧产物），
// 图片层就会没有 position/z-index 而整个消失，表现为「设置页预览有图、窗口里没有」。
//
// 基准色直接取主题变量（主窗口 --bg，mini 小窗 --bg-elevated），
// 因此默认设置（明暗 50 / 不透明度 100 / 无图片）与未自定义时完全一致。
// 窗口本身需要 transparent: true（见 electron/main.js），否则 alpha 无效。
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

  // 底色：带 alpha 的主题色
  const bgColor = computed(() => {
    const a = opacity.value
    if (a >= 100) return toneColor.value
    return `color-mix(in srgb, ${toneColor.value} ${a}%, transparent)`
  })

  // 图片上的遮罩色。用 CSS 变量往下传，这样拖动明暗 / 遮罩滑块时
  // 只更新这个变量，不会重设图片层那一整串 data URL。
  const veilColor = computed(() => {
    const veil = clamp(settingsStore.settings.bgImageVeil, 40)
    if (!settingsStore.imageUrl || veil <= 0) return 'transparent'
    return `color-mix(in srgb, ${toneColor.value} ${veil}%, transparent)`
  })

  const bgStyle = computed(() => ({
    backgroundColor: bgColor.value,
    // 让窗口容器成为层叠上下文，负 z-index 的图片层才会落在「底色之上、内容之下」
    position: 'relative',
    zIndex: '0',
    '--bg-veil-color': veilColor.value
  }))

  // 图片层：图片 + 遮罩（遮罩越强文字越清晰）
  const hasImage = computed(() => !!settingsStore.imageUrl)
  const bgImageStyle = computed(() => {
    const url = settingsStore.imageUrl
    // 没有图片时不渲染这一层，避免多一个空盒子
    if (!url) return { display: 'none' }
    const fit = settingsStore.settings.bgImageFit || 'cover'
    const style = {
      position: 'absolute',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      zIndex: '-1',
      pointerEvents: 'none',
      backgroundImage: `linear-gradient(var(--bg-veil-color), var(--bg-veil-color)), url("${url}")`,
      backgroundPosition: 'center',
      // 图片层同样跟随不透明度，这样选了图片也依然能透出桌面
      opacity: String(opacity.value / 100)
    }
    if (fit === 'repeat') {
      style.backgroundSize = 'auto'
      style.backgroundRepeat = 'repeat'
    } else {
      style.backgroundSize = fit === 'contain' ? 'contain' : 'cover'
      style.backgroundRepeat = 'no-repeat'
    }
    return style
  })

  return { bgStyle, bgImageStyle, bgColor, hasImage, opacity, brightness }
}
