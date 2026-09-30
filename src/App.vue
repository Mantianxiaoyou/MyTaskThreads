<script setup>
import { ref, onMounted, computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import TitleBar from './components/TitleBar.vue'
import MiniView from './views/MiniView.vue'
import { useSettingsStore } from './stores/settingsStore'
import { useBackground } from './composables/useBackground'

const miniMode = ref(false)
const settingsStore = useSettingsStore()
const { bgStyle, bgImageStyle } = useBackground()

const isMini = computed(() => miniMode.value)

onMounted(async () => {
  try {
    await settingsStore.init()
    if (window.api?.window?.toggleAlwaysOnTop) {
      await window.api.window.toggleAlwaysOnTop(settingsStore.settings.alwaysOnTop)
    }
    // 应用主题到根元素
    if (settingsStore.settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (settingsStore.settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  } catch (e) {
    console.warn('初始化设置失败：', e)
  }

  // 监听 mini 模式切换（来自 Sidebar 按钮或托盘菜单）
  window.addEventListener('mini-mode-change', (e) => {
    miniMode.value = e.detail?.mini === true
    document.body.classList.toggle('mini-mode', miniMode.value)
  })
  // 主进程托盘菜单触发的 mini 切换
  if (window.api?.window?.onMiniModeChange) {
    window.api.window.onMiniModeChange((detail) => {
      miniMode.value = detail?.mini === true
      document.body.classList.toggle('mini-mode', miniMode.value)
    })
  }
})
</script>

<template>
  <MiniView v-if="isMini" />
  <div v-else class="app-layout" :style="bgStyle">
    <div class="bg-image" :style="bgImageStyle"></div>
    <TitleBar />
    <div class="app-body">
      <Sidebar />
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  /* 兜底：自定义背景（内联样式）不可用时退回主题背景色 */
  background: var(--bg);
}
/* 自定义图片背景层：定位/层叠全部来自内联样式，这里不再定义 */
.bg-image {
  pointer-events: none;
}
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.app-main {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
}
</style>
