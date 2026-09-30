<script setup>
import { computed } from 'vue'
const props = defineProps({
  percent: { type: Number, default: 0 },
  size: { type: Number, default: 64 }
})
const stroke = 6
const r = computed(() => (props.size - stroke) / 2)
const c = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => c.value * (1 - Math.min(100, Math.max(0, props.percent)) / 100))
</script>

<template>
  <svg :width="size" :height="size" class="ring">
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="r"
      :stroke-width="stroke"
      class="track"
      fill="none"
    />
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="r"
      :stroke-width="stroke"
      class="bar"
      fill="none"
      :stroke-dasharray="c"
      :stroke-dashoffset="offset"
      :transform="`rotate(-90 ${size / 2} ${size / 2})`"
    />
    <text :x="size / 2" :y="size / 2" class="label" dominant-baseline="middle" text-anchor="middle">{{ percent }}%</text>
  </svg>
</template>

<style scoped>
.ring .track {
  stroke: var(--border);
}
.ring .bar {
  stroke: var(--primary);
  transition: stroke-dashoffset 0.3s;
  stroke-linecap: round;
}
.ring .label {
  fill: var(--fg);
  font-size: 12px;
  font-weight: 600;
}
</style>
