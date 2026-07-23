<template>
  <Transition name="panel">
    <div
      v-if="interactionStore.showInfoPanel"
      class="info-panel"
    >
      <div class="panel-header">
        <div class="header-title">
          <span v-if="flag" class="flag">{{ flag }}</span>
          <span v-else class="flag-placeholder">
            <svg class="flag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </span>
          <h3>{{ interactionStore.infoPanelData?.name || '地点详情' }}</h3>
        </div>
        <button class="more-btn" aria-label="更多操作">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div class="panel-body custom-scrollbar">
        <div class="metrics-section">
          <h4 class="section-title">关键指标</h4>

          <div v-if="interactionStore.infoPanelData?.gdp" class="metric-row">
            <div class="metric-label">
              <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
              <span>GDP</span>
            </div>
            <span class="metric-value">{{ interactionStore.infoPanelData.gdp }}</span>
          </div>

          <div v-if="interactionStore.infoPanelData?.population" class="metric-row">
            <div class="metric-label">
              <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>人口</span>
            </div>
            <span class="metric-value">{{ interactionStore.infoPanelData.population }}</span>
          </div>

          <div v-if="interactionStore.infoPanelData?.lon !== undefined" class="metric-row">
            <div class="metric-label">
              <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>经度</span>
            </div>
            <span class="metric-value mono">{{ formatCoord(interactionStore.infoPanelData.lon, 'lon') }}</span>
          </div>

          <div v-if="interactionStore.infoPanelData?.lat !== undefined" class="metric-row">
            <div class="metric-label">
              <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>纬度</span>
            </div>
            <span class="metric-value mono">{{ formatCoord(interactionStore.infoPanelData.lat, 'lat') }}</span>
          </div>
        </div>

        <div class="chart-section">
          <h4 class="section-title">GDP 增长（10年）</h4>
          <div class="chart-placeholder">
            <svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <span>趋势图占位</span>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="primary-btn" @click="addToComparison">
          加入对比
        </button>
        <button class="secondary-btn" @click="interactionStore.closeInfoPanel">
          关闭
        </button>
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

function formatCoord(val, type) {
  if (val === undefined || val === null) return '--'
  const abs = Math.abs(val).toFixed(4)
  if (type === 'lon') return `${abs}° ${val >= 0 ? 'E' : 'W'}`
  return `${abs}° ${val >= 0 ? 'N' : 'S'}`
}

function addToComparison() {
  const name = interactionStore.infoPanelData?.name
  if (name) {
    earthStore.toggleCompare?.(name)
  }
}
</script>

<style scoped>
.info-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--tv-md);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--tv-md);
  border-bottom: 1px solid var(--tv-outline-variant);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
}

.flag {
  font-size: 24px;
  line-height: 1;
}

.flag-placeholder {
  width: 28px;
  height: 20px;
  border-radius: 2px;
  background: var(--tv-surface-variant);
  border: 1px solid var(--tv-outline-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tv-primary);
}

.flag-icon {
  width: 14px;
  height: 14px;
}

h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--tv-on-surface);
  line-height: 28px;
}

.more-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--tv-radius-full);
  border: none;
  background: transparent;
  color: var(--tv-on-surface-variant);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.more-btn:hover {
  background: var(--tv-surface-container);
  color: var(--tv-primary);
}

.icon {
  width: 18px;
  height: 18px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--tv-md) 0;
  display: flex;
  flex-direction: column;
  gap: var(--tv-lg);
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--tv-outline);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--tv-sm);
}

.metrics-section {
  display: flex;
  flex-direction: column;
  gap: var(--tv-xs);
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tv-sm);
  border-radius: var(--tv-radius-lg);
  transition: background 0.2s;
}

.metric-row:hover {
  background: var(--tv-surface-container);
}

.metric-label {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  color: var(--tv-on-surface-variant);
  font-size: 14px;
}

.metric-icon {
  width: 18px;
  height: 18px;
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--tv-on-surface);
}

.metric-value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.chart-section {
  display: flex;
  flex-direction: column;
}

.chart-placeholder {
  height: 96px;
  border-radius: var(--tv-radius-lg);
  background: var(--tv-surface-container);
  border: 1px solid var(--tv-outline-variant);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--tv-xs);
  color: var(--tv-outline);
  font-size: 12px;
}

.chart-icon {
  width: 28px;
  height: 28px;
}

.panel-footer {
  display: flex;
  flex-direction: column;
  gap: var(--tv-sm);
  padding-top: var(--tv-md);
  border-top: 1px solid var(--tv-outline-variant);
}

.primary-btn,
.secondary-btn {
  width: 100%;
  padding: var(--tv-sm);
  border-radius: var(--tv-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.primary-btn {
  background: var(--tv-primary);
  color: var(--tv-on-primary);
}

.primary-btn:hover {
  filter: brightness(1.1);
}

.secondary-btn {
  background: transparent;
  color: var(--tv-primary);
  border: 1px solid var(--tv-outline-variant);
}

.secondary-btn:hover {
  background: var(--tv-primary-fixed);
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
