<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/taskStore'

const route = useRoute()
const taskStore = useTaskStore()

const navItems = [
  { path: '/today', label: '今日', icon: '◉' },
  { path: '/tasks', label: '全部任务', icon: '☰' },
  { path: '/timer', label: '番茄钟', icon: '⏱' },
  { path: '/stats', label: '统计', icon: '◐' },
  { path: '/settings', label: '设置', icon: '⚙' }
]

const pending = computed(() => taskStore.pendingCount)

async function ensureLoaded () {
  if (!taskStore.loaded) await taskStore.init()
}
ensureLoaded()
</script>

<template>
  <aside class="sidebar">
    <div class="logo">工作进度提醒</div>
    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.label }}</span>
        <span v-if="item.path === '/today' && pending > 0" class="badge">{{ pending }}</span>
      </RouterLink>
    </nav>
    <div class="footer">
      <div class="progress-mini">
        今日完成 {{ taskStore.todayCompleted }} / {{ taskStore.todayTotal }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: var(--bg-soft);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}
.logo {
  padding: 0 20px 16px;
  font-weight: 600;
  font-size: 16px;
  color: var(--primary);
}
.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--fg-soft);
  font-size: 13px;
  border-left: 3px solid transparent;
}
.nav-item:hover {
  background: var(--bg-strong);
}
.nav-item.active {
  color: var(--primary);
  background: var(--bg-strong);
  border-left-color: var(--primary);
}
.nav-item .icon {
  margin-right: 10px;
  font-size: 14px;
}
.nav-item .label {
  flex: 1;
}
.badge {
  background: var(--danger);
  color: #fff;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
}
.footer {
  padding: 10px 20px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--fg-soft);
}
</style>
