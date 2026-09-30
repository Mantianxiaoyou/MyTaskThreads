<script setup>
import { computed } from 'vue'
const props = defineProps({
  data: { type: Object, required: true }
})
const cells = computed(() => {
  const entries = Object.entries(props.data).sort(([a], [b]) => a.localeCompare(b))
  return entries.map(([date, min]) => ({ date, min }))
})
function colorFor (min) {
  if (min <= 0) return 'var(--bg-strong)'
  if (min < 25) return '#cfe8b8'
  if (min < 50) return '#9bd16a'
  if (min < 100) return '#5ba733'
  return '#2f6df6'
}
function dayLabel (date) {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div class="heatmap">
    <div v-for="c in cells" :key="c.date" class="cell" :style="{ background: colorFor(c.min) }" :title="`${c.date} - ${c.min} 分钟`">
      <span class="lbl">{{ dayLabel(c.date) }}</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 4px;
}
.cell {
  aspect-ratio: 1;
  border-radius: 3px;
  position: relative;
  min-height: 22px;
  font-size: 9px;
  color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.lbl {
  opacity: 0.5;
}
</style>
