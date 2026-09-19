<template>
  <Transition name="fade">
    <div
      v-if="legendConfig"
      class="legend-bar"
    >
      <span class="legend-low">{{ legendConfig.low }}</span>
      <div
        class="legend-gradient"
        :style="{ background: `linear-gradient(to right, ${legendConfig.lowColor}, ${legendConfig.highColor})` }"
      />
      <span class="legend-high">{{ legendConfig.high }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEarthStore } from '../stores/useEarthStore'

const earthStore = useEarthStore()

const legendMap: Record<string, { low: string; high: string; lowColor: string; highColor: string }> = {
  gdp: { low: '0', high: '18万亿$', lowColor: '#fff', highColor: '#f00' },
  population: { low: '低密度', high: '高密度', lowColor: '#fff', highColor: '#f60' },
  carbon: { low: '低排放', high: '高排放', lowColor: '#fff', highColor: '#840' },
  trade: { low: '少', high: '多', lowColor: '#044', highColor: '#0cc' },
  flights: { low: '少', high: '多', lowColor: '#024', highColor: '#4af' },
  earthquake: { low: '3级', high: '9级', lowColor: '#4f4', highColor: '#f00' },
  nightlights: { low: '暗', high: '亮', lowColor: '#024', highColor: '#fc4' },
  china: { low: '545', high: '11万', lowColor: '#444', highColor: '#f00' },
}

const legendConfig = computed(() => legendMap[earthStore.currentVisualization])
</script>

<style scoped>
.legend-bar {
  position: fixed; bottom: 130px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  background: rgba(15,15,35,0.85); padding: 6px 16px;
  border-radius: 20px; backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08); z-index: 99;
}
.legend-low, .legend-high { color: #888; font-size: 11px; white-space: nowrap; }
.legend-gradient {
  width: 120px; height: 8px; border-radius: 4px;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
