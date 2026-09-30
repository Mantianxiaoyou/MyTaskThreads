<script setup>
import { computed, onMounted } from 'vue'
import { useStatsStore } from '../stores/statsStore'
import { useTaskStore } from '../stores/taskStore'
import ProgressRing from '../components/ProgressRing.vue'
import HeatmapView from '../components/HeatmapView.vue'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const statsStore = useStatsStore()
const taskStore = useTaskStore()

const todayFocusMin = computed(() => Math.round(statsStore.todayFocusSec / 60))
const todayTaskCount = computed(() => statsStore.todayTaskCount)
const completionRate = computed(() => {
  const total = taskStore.todayTotal
  if (!total) return 0
  return Math.round((todayTaskCount.value / total) * 100)
})

const weekChart = computed(() => ({
  labels: statsStore.weekData.map(d => d.date.slice(5)),
  datasets: [
    { label: '专注时长(分钟)', data: statsStore.weekData.map(d => d.focusMin), backgroundColor: '#2f6df6' },
    { label: '完成任务', data: statsStore.weekData.map(d => d.taskCount), backgroundColor: '#34c759' }
  ]
}))

const categoryChart = computed(() => ({
  labels: statsStore.categoryDistribution.map(c => c.name),
  datasets: [{
    data: statsStore.categoryDistribution.map(c => c.value),
    backgroundColor: ['#2f6df6', '#34c759', '#ff9f0a', '#ff453a', '#8e44ad', '#16a085']
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#888', font: { size: 10 } } } },
  scales: {
    y: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { ticks: { color: '#888', font: { size: 10 } } }
  }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right', labels: { color: '#888', font: { size: 10 } } } }
}

onMounted(async () => {
  await statsStore.init()
  if (!taskStore.loaded) await taskStore.init()
})
</script>

<template>
  <div class="stats-view">
    <h2>统计</h2>

    <div class="grid">
      <div class="card summary">
        <ProgressRing :percent="completionRate" />
        <div>
          <div class="metric">今日完成率 <b>{{ completionRate }}%</b></div>
          <div class="metric">完成任务 <b>{{ todayTaskCount }}</b></div>
          <div class="metric">专注时长 <b>{{ todayFocusMin }}</b> 分钟</div>
        </div>
      </div>

      <div class="card chart-card">
        <h3>近 7 天趋势</h3>
        <div class="chart-wrap">
          <Bar :data="weekChart" :options="chartOptions" />
        </div>
      </div>

      <div class="card chart-card">
        <h3>本月分类分布</h3>
        <div class="chart-wrap pie">
          <Pie v-if="categoryChart.datasets[0].data.length" :data="categoryChart" :options="pieOptions" />
          <div v-else class="empty">本月暂无数据</div>
        </div>
      </div>

      <div class="card chart-card">
        <h3>近 30 天热力图</h3>
        <HeatmapView :data="statsStore.monthHeatmap" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-view { display: flex; flex-direction: column; gap: 12px; }
.stats-view h2 { font-size: 18px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.summary { display: flex; align-items: center; gap: 16px; }
.metric { font-size: 13px; color: var(--fg-soft); }
.metric b { color: var(--primary); font-size: 16px; }
.chart-card { display: flex; flex-direction: column; gap: 8px; }
.chart-card h3 { font-size: 13px; color: var(--fg-soft); font-weight: 500; }
.chart-wrap { height: 200px; position: relative; }
.chart-wrap.pie { display: flex; align-items: center; justify-content: center; }
</style>
