<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { windowApi } from '../services/api'

const props = defineProps({
  mini: { type: Boolean, default: false }
})

const route = useRoute()
const settingsStore = useSettingsStore()

const alwaysOnTop = ref(false)

const titleMap = {
  '/today': '今日任务',
  '/tasks': '全部任务',
  '/timer': '番茄钟',
  '/stats': '统计',
  '/settings': '设置'
}
const currentTitle = computed(() => {
  if (props.mini) return '多线程管理器'
  return titleMap[route.path] || '多线程管理器'
})

onMounted(async () => {
  try {
    alwaysOnTop.value = await windowApi.isAlwaysOnTop()
  } catch (e) {}
})

async function togglePin () {
  const next = !alwaysOnTop.value
  await windowApi.setAlwaysOnTop(next)
  alwaysOnTop.value = next
  // 同步到设置 store
  if (settingsStore.loaded) {
    settingsStore.settings.alwaysOnTop = next
    await settingsStore.update({ alwaysOnTop: next })
  }
}

async function toggleMini () {
  await windowApi.toggleMini(true)
  window.dispatchEvent(new CustomEvent('mini-mode-change', { detail: { mini: true } }))
}

async function exitMini () {
  await windowApi.toggleMini(false)
  window.dispatchEvent(new CustomEvent('mini-mode-change', { detail: { mini: false } }))
}

async function minimize () {
  await windowApi.minimize()
}
async function closeWin () {
  await windowApi.close()
}
</script>

<template>
  <div class="titlebar" :class="{ mini: props.mini }">
    <div class="drag-area">
      <div class="app-name">
        <span class="logo-dot"></span>
        <span class="name">{{ currentTitle }}</span>
      </div>
    </div>

    <div class="actions">
      <button
        class="win-btn pin"
        :class="{ active: alwaysOnTop }"
        :title="alwaysOnTop ? '取消置顶' : '置顶'"
        @click="togglePin"
      >
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path
            :fill="alwaysOnTop ? 'var(--primary)' : 'currentColor'"
            d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z"
          />
        </svg>
      </button>

      <button
        v-if="!props.mini"
        class="win-btn"
        title="缩为小窗"
        @click="toggleMini"
      >
        <svg viewBox="0 0 16 16" width="14" height="14">
          <rect x="2" y="2" width="9" height="9" :fill="'none'" stroke="currentColor" stroke-width="1.4"/>
          <rect x="5" y="5" width="9" height="9" :fill="'currentColor'"/>
        </svg>
      </button>

      <button
        v-else
        class="win-btn"
        title="放大为主窗口"
        @click="exitMini"
      >
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path
            d="M2 2 L7 2 M2 2 L2 7 M14 9 L9 9 M14 9 L14 14 M2 14 L7 14 M2 14 L2 9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <button class="win-btn" title="最小化" @click="minimize">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>

      <button class="win-btn close" title="关闭" @click="closeWin">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  /* 透明填充：标题栏跟随窗口背景，窗口背景半透明时不会留下不透明白条 */
  background: transparent;
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  flex-shrink: 0;
  user-select: none;
}
.titlebar.mini {
  height: 28px;
  background: transparent;
}

.drag-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  overflow: hidden;
}
.app-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--fg-soft);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.logo-dot {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 2px;
  display: inline-block;
}

.actions {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
  height: 100%;
}
.win-btn {
  width: 32px;
  height: 100%;
  background: transparent;
  border: none;
  color: var(--fg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
  border-radius: 0;
}
.win-btn:hover {
  background: var(--bg-strong);
  color: var(--fg);
}
.win-btn.pin.active {
  color: var(--primary);
  background: var(--primary-soft);
}
.win-btn.pin.active:hover {
  background: var(--primary-mute);
}
.win-btn.close:hover {
  background: var(--danger);
  color: #fff;
}
</style>
