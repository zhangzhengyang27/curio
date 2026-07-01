<template>
  <Transition name="slide-up">
    <div
      v-if="compareList.length > 0"
      class="compare-panel"
    >
      <div class="compare-header">
        <span class="compare-title">对比 ({{ compareList.length }})</span>
        <button
          class="clear-btn"
          @click="earthStore.compareCountries = []"
        >
          清空
        </button>
      </div>
      <div class="compare-chips">
        <span
          v-for="name in compareList"
          :key="name"
          class="chip"
          @click="remove(name)"
        >
          {{ name }} ×
        </span>
      </div>
      <div class="chart-container">
        <canvas ref="chartRef" />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useEarthStore } from '../stores/useEarthStore.js'

const earthStore = useEarthStore()
const chartRef = ref(null)
let chartInstance = null

const compareList = computed(() => earthStore.compareCountries)

function remove(name) {
  earthStore.toggleCompare(name)
}

async function renderChart() {
  await nextTick()
  if (!chartRef.value) return

  // 动态导入 Chart.js
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  if (chartInstance) chartInstance.destroy()

  // 找到每个对比国家的mesh获取GDP
  const labels = []
  const gdpData = []
  const colors = []

  compareList.value.forEach(name => {
    labels.push(name)
    const mesh = earthStore.earthGroup?.meshArr?.find(m => m.name === name)
    const gdp = mesh?.gdp ? mesh.gdp / 1000000000000 : 0
    gdpData.push(parseFloat(gdp.toFixed(2)))
    colors.push(getColor(name))
  })

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'GDP (万亿美元)',
        data: gdpData,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#888', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: '#888', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: {
            display: true,
            text: '万亿美元',
            color: '#888'
          }
        }
      }
    }
  })
}

const barColors = [
  'rgba(0, 204, 204, 0.7)',
  'rgba(255, 102, 102, 0.7)',
  'rgba(255, 204, 0, 0.7)',
  'rgba(102, 204, 102, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 153, 51, 0.7)',
  'rgba(51, 153, 255, 0.7)',
  'rgba(255, 102, 178, 0.7)'
]

function getColor(name) {
  const idx = compareList.value.indexOf(name)
  return barColors[idx % barColors.length]
}

watch(compareList, () => renderChart(), { deep: true })

onUnmounted(() => {
  chartInstance?.destroy()
})
</script>

<style scoped>
.compare-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 16px 24px;
  z-index: 150;
  max-height: 260px;
}
.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.compare-title {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.clear-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #888;
  padding: 4px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.clear-btn:hover {
  background: rgba(255,102,102,0.2);
  color: #ff6666;
}
.compare-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.chip {
  background: rgba(0, 204, 204, 0.15);
  color: #00cccc;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  background: rgba(255, 102, 102, 0.2);
  color: #ff6666;
}
.chart-container {
  height: 140px;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
