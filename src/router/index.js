import { createRouter, createMemoryHistory } from 'vue-router'

// 路由：今日 / 全部任务 / 番茄钟 / 统计 / 设置
const routes = [
  { path: '/', redirect: '/today' },
  { path: '/today', name: 'today', component: () => import('../views/TodayView.vue'), meta: { title: '今日' } },
  { path: '/tasks', name: 'tasks', component: () => import('../views/AllTasksView.vue'), meta: { title: '全部任务' } },
  { path: '/timer', name: 'timer', component: () => import('../views/TimerView.vue'), meta: { title: '番茄钟' } },
  { path: '/stats', name: 'stats', component: () => import('../views/StatsView.vue'), meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { title: '设置' } }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
