<script setup>
import { onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'

onMounted(async () => {
  try {
    const { useSettingsStore } = await import('./stores/settingsStore')
    const settingsStore = useSettingsStore()
    await settingsStore.init()
    if (window.api?.window?.toggleAlwaysOnTop) {
      await window.api.window.toggleAlwaysOnTop(settingsStore.settings.alwaysOnTop)
    }
  } catch (e) {
    console.warn('初始化设置失败：', e)
  }
})
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.app-main {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
}
</style>
