<template>
  <Transition name="panel">
    <div
      v-if="interactionStore.showInfoPanel"
      class="info-panel"
    >
      <div class="panel-header">
        <h3>
          <span
            v-if="flag"
            class="flag"
          >{{ flag }}</span>
          {{ interactionStore.infoPanelData?.name || '国家详情' }}
        </h3>
        <button
          class="close-btn"
          @click="interactionStore.closeInfoPanel"
        >
          ×
        </button>
      </div>
      <div class="panel-body">
        <div
          v-if="interactionStore.infoPanelData?.gdp"
          class="info-row"
        >
          <span class="label">GDP (2015)</span>
          <span class="value gdp">{{ interactionStore.infoPanelData.gdp }}</span>
        </div>
        <div
          v-if="interactionStore.infoPanelData?.lon !== undefined"
          class="info-row"
        >
          <span class="label">经度</span>
          <span class="value">{{ formatCoord(interactionStore.infoPanelData.lon) }}</span>
        </div>
        <div
          v-if="interactionStore.infoPanelData?.lat !== undefined"
          class="info-row"
        >
          <span class="label">纬度</span>
          <span class="value">{{ formatCoord(interactionStore.infoPanelData.lat) }}</span>
        </div>
        <div
          v-if="earthStore.compareCountries.length"
          class="info-row"
        >
          <span class="label">对比列表</span>
          <span class="value selected">{{ earthStore.compareCountries.length }} 个</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useInteractionStore } from '../stores/useInteractionStore.js'
import { useEarthStore } from '../stores/useEarthStore.js'

const interactionStore = useInteractionStore()
const earthStore = useEarthStore()

const countryFlags = {
  '中国': '🇨🇳', '美国': '🇺🇸', '日本': '🇯🇵', '英国': '🇬🇧', '法国': '🇫🇷',
  '德国': '🇩🇪', '俄罗斯': '🇷🇺', '印度': '🇮🇳', '巴西': '🇧🇷', '加拿大': '🇨🇦',
  '澳大利亚': '🇦🇺', '韩国': '🇰🇷', '意大利': '🇮🇹', '西班牙': '🇪🇸', '墨西哥': '🇲🇽',
  '印度尼西亚': '🇮🇩', '土耳其': '🇹🇷', '沙特阿拉伯': '🇸🇦', '瑞士': '🇨🇭', '瑞典': '🇸🇪',
  '荷兰': '🇳🇱', '阿根廷': '🇦🇷', '南非': '🇿🇦', '尼日利亚': '🇳🇬', '埃及': '🇪🇬'
}

const flag = computed(() => {
  return countryFlags[interactionStore.infoPanelData?.name] || ''
})

function formatCoord(val) {
  if (val === undefined || val === null) return '--'
  return val > 0 ? `${val.toFixed(2)}°E` : `${Math.abs(val).toFixed(2)}°W`
}
</script>

<style scoped>
.info-panel {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 280px;
  background: rgba(15, 15, 35, 0.92);
  border-radius: 14px;
  padding: 18px;
  color: #fff;
  backdrop-filter: blur(12px);
  z-index: 100;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.panel-header h3 {
  margin: 0;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.flag {
  font-size: 20px;
}
.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 22px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.panel-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.label {
  color: #888;
  font-size: 13px;
}
.value {
  font-weight: 600;
  font-size: 13px;
  color: #ddd;
}
.value.gdp {
  color: #ff6666;
}
.value.selected {
  color: #00cccc;
}

.panel-enter-active, .panel-leave-active {
  transition: all 0.3s ease;
}
.panel-enter-from, .panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
