<template>
  <div class="analysis-view">
    <div
      ref="containerRef"
      class="map-container"
    />

    <div
      v-if="dataError"
      class="load-error tv-glass-panel"
    >
      {{ dataError }}
    </div>
    <div
      v-else-if="loading"
      class="load-error tv-glass-panel"
    >
      数据加载中…
    </div>

    <!-- 左侧：国家列表 -->
    <aside
      v-if="ready"
      class="panel panel-left tv-glass-panel"
    >
      <h3 class="panel-title">
        全球数据分析
      </h3>
      <input
        v-model="search"
        class="search-input"
        data-testid="country-search"
        placeholder="搜索国家…"
      >
      <div
        class="country-list"
        data-testid="country-list"
      >
        <div
          v-for="(c, idx) in filteredCountries"
          :key="c.name"
          class="country-row"
          :class="{ active: selected === c.name }"
          :data-testid="`country-${c.name}`"
          @click="selectCountry(c.name)"
        >
          <span class="rank">{{ idx + 1 }}</span>
          <span class="name">{{ c.name }}</span>
          <label
            class="compare-toggle"
            title="加入对比"
            @click.stop
          >
            <input
              type="checkbox"
              :checked="compare.includes(c.name)"
              @change.stop="toggleCompare(c.name)"
            >
          </label>
        </div>
        <p
          v-if="filteredCountries.length === 0"
          class="empty-tip"
        >
          没有匹配的国家
        </p>
      </div>
      <p class="list-meta">
        共 {{ countries.length }} 个国家/地区 · 按最新 GDP 排序
      </p>
    </aside>

    <!-- 右侧：指标卡与对比 -->
    <aside
      v-if="ready"
      class="panel panel-right tv-glass-panel"
    >
      <template v-if="selectedCountry">
        <h3 class="panel-title">
          {{ selected }}
          <span
            v-if="gdpRankText"
            class="rank-badge"
          >GDP {{ gdpRankText }}</span>
        </h3>
        <dl class="metrics">
          <div class="metric">
            <dt>GDP（{{ year }}）</dt>
            <dd data-testid="metric-gdp">
              {{ gdpText }}
            </dd>
          </div>
          <div class="metric">
            <dt>人口</dt>
            <dd data-testid="metric-population">
              {{ popText }}
            </dd>
          </div>
          <div class="metric">
            <dt>人均 GDP</dt>
            <dd>{{ perCapitaText }}</dd>
          </div>
          <div class="metric">
            <dt>面积</dt>
            <dd>{{ areaText }}</dd>
          </div>
          <div class="metric">
            <dt>人口密度</dt>
            <dd>{{ densityText }}</dd>
          </div>
          <div class="metric">
            <dt>碳排放（{{ carbonYear }}）</dt>
            <dd>{{ emissionText }}</dd>
          </div>
        </dl>
      </template>
      <p
        v-else
        class="empty-tip"
      >
        点击地图上的国家，或在左侧列表选择。
      </p>

      <template v-if="compare.length">
        <p class="group-label">
          对比（{{ compare.length }}）
        </p>
        <table
          class="compare-table"
          data-testid="compare-table"
        >
          <thead>
            <tr>
              <th>指标</th>
              <th
                v-for="name in compare"
                :key="name"
              >
                {{ name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GDP</td>
              <td
                v-for="name in compare"
                :key="name"
              >
                {{ compareCell(name, 'gdp') }}
              </td>
            </tr>
            <tr>
              <td>人口</td>
              <td
                v-for="name in compare"
                :key="name"
              >
                {{ compareCell(name, 'population') }}
              </td>
            </tr>
            <tr>
              <td>碳排放</td>
              <td
                v-for="name in compare"
                :key="name"
              >
                {{ compareCell(name, 'emission') }}
              </td>
            </tr>
          </tbody>
        </table>
        <button
          class="mini-btn"
          data-testid="clear-compare"
          @click="compare = []"
        >
          清空对比
        </button>
      </template>
    </aside>

    <!-- 底部：GDP 时间轴 -->
    <footer
      v-if="ready && years.length"
      class="timeline-bar tv-glass-panel"
    >
      <button
        class="play-btn"
        data-testid="timeline-play"
        @click="togglePlay"
      >
        {{ playing ? '⏸ 暂停' : '▶ 播放' }}
      </button>
      <input
        v-model.number="yearIndex"
        type="range"
        min="0"
        :max="years.length - 1"
        class="timeline-range"
        data-testid="timeline-range"
      >
      <span
        class="year-label"
        data-testid="timeline-year"
      >{{ year }}</span>
    </footer>

    <!-- 图例 -->
    <div
      v-if="ready"
      class="legend tv-glass-panel"
    >
      <span class="legend-text">GDP 低 → 高</span>
      <span class="legend-gradient" />
    </div>

    <!-- 调试角标（?debug=1） -->
    <div
      v-if="debug && ready"
      class="debug-hud"
      data-testid="debug-hud"
    >
      DEBUG · 相机高度 {{ debugHeight }}m · 国家 {{ countries.length }} · 对比 {{ compare.length }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { loadCesium } from '../map/cesiumLoader.js'
import { createMapViewer } from '../map/createViewer.js'
import { useCountryData, formatUSD, formatPopulation, formatAreaSqKm, gdpRank } from '../map/analysis/useCountryData.js'
import { Choropleth } from '../map/analysis/choropleth.js'

const containerRef = ref(null)
const ready = ref(false)
const search = ref('')
const selected = ref(null)
const compare = ref([])
// ?debug=1 时暴露渲染器调试钩子与 HUD
const debug = ref(new URLSearchParams(window.location.search).has('debug'))
const yearIndex = ref(0)
const playing = ref(false)

const { loading, error: dataError, years, countries, gdpByYear, load } = useCountryData()
let viewer = null
let choropleth = null
let playTimer = null
let debugTimer = null
const debugHeight = ref(0)

const year = computed(() => years.value[yearIndex.value] ?? '')
const selectedCountry = computed(() => countries.value.find((c) => c.name === selected.value) || null)

const filteredCountries = computed(() => {
  const q = search.value.trim()
  if (!q) return countries.value
  return countries.value.filter((c) => c.name.includes(q))
})

const currentGdp = computed(() => (year.value && selected.value ? gdpByYear.value[year.value]?.[selected.value] ?? null : null))
const gdpText = computed(() => formatUSD(currentGdp.value))
const popText = computed(() => formatPopulation(selectedCountry.value?.population))
const areaText = computed(() => formatAreaSqKm(selectedCountry.value?.area))
const densityText = computed(() => (selectedCountry.value?.density != null ? `${selectedCountry.value.density} 人/km²` : '暂无数据'))
const perCapitaText = computed(() => {
  const pop = selectedCountry.value?.population
  if (!currentGdp.value || !pop) return '暂无数据'
  const v = currentGdp.value / pop
  return v >= 10000 ? `${Math.round(v).toLocaleString()} 美元` : `${v.toFixed(0)} 美元`
})
const emissionText = computed(() => (selectedCountry.value?.emission != null ? `${selectedCountry.value.emission} MtCO₂` : '暂无数据'))
const carbonYear = computed(() => '2020')
const gdpRankText = computed(() => {
  const r = year.value ? gdpRank(gdpByYear.value, year.value, selected.value) : null
  return r ? `第 ${r} 位 / ${countries.value.length}` : ''
})

function compareCell(name, metric) {
  if (metric === 'gdp') return formatUSD(gdpByYear.value[year.value]?.[name] ?? null)
  if (metric === 'population') return formatPopulation(countries.value.find((c) => c.name === name)?.population)
  if (metric === 'emission') {
    const v = countries.value.find((c) => c.name === name)?.emission
    return v != null ? `${v} MtCO₂` : '暂无数据'
  }
  return '—'
}

function selectCountry(name) {
  selected.value = name
  choropleth?.flyTo(name)
}

function toggleCompare(name) {
  const idx = compare.value.indexOf(name)
  if (idx > -1) compare.value.splice(idx, 1)
  else if (compare.value.length < 4) compare.value.push(name)
}

function togglePlay() {
  playing.value = !playing.value
  if (playing.value && yearIndex.value >= years.value.length - 1) yearIndex.value = 0
}

watch(playing, (on) => {
  if (!on) return
  playTimer = setInterval(() => {
    if (yearIndex.value >= years.value.length - 1) {
      playing.value = false
      clearInterval(playTimer)
      return
    }
    yearIndex.value++
  }, 700)
})

watch([year, selected, compare], () => {
  choropleth?.apply(gdpByYear.value, year.value, selected.value, compare.value)
})

onMounted(async () => {
  await load()
  if (dataError.value) return
  try {
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value, {
      mode: 'vec',
      view: { lon: 60, lat: 28, height: 9_500_000 },
    })
    choropleth = new Choropleth(Cesium, viewer)
    await choropleth.load()

    if (debug.value) {
      // 调试钩子：供探针读取渲染器真实状态
      window.__tvMapDebug = { viewer, Cesium }
      debugTimer = setInterval(() => {
        debugHeight.value = Math.round(viewer.camera.positionCartographic.height)
      }, 500)
    }
    yearIndex.value = years.value.length - 1
    choropleth.apply(gdpByYear.value, year.value, selected.value, compare.value)

    // 点击地图选国
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((e) => {
      const name = choropleth.pickName(e.position)
      if (name) selectCountry(name)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    ready.value = true
  } catch (err) {
    console.error('[analysis] 初始化失败:', err)
  }
})

onUnmounted(() => {
  if (playTimer) clearInterval(playTimer)
  if (debugTimer) clearInterval(debugTimer)
  choropleth?.destroy()
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
})
</script>

<style scoped>
.analysis-view {
  position: fixed;
  top: var(--tv-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: #000;
}

.map-container,
.map-container :deep(.cesium-viewer) {
  width: 100%;
  height: 100%;
}

.load-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 24px;
  border-radius: 12px;
  color: #eee;
}

.panel {
  position: absolute;
  top: 16px;
  bottom: 80px;
  z-index: 10;
  width: 230px;
  padding: 14px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-left {
  left: 16px;
}

.panel-right {
  right: 16px;
  bottom: 110px;
  overflow: auto;
}

.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
}

.rank-badge {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.65;
  margin-left: 6px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  box-sizing: border-box;
}

.country-list {
  flex: 1;
  overflow: auto;
  margin-top: 8px;
  min-height: 0;
}

.country-row {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
}

.country-row:hover {
  background: rgba(128, 128, 128, 0.12);
}

.country-row.active {
  background: var(--tv-primary-fixed, rgba(79, 142, 247, 0.15));
}

.country-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rank {
  width: 22px;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
}

.compare-toggle {
  padding: 0 6px;
  cursor: pointer;
}

.metrics {
  margin: 0;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.2);
  font-size: 12px;
}

.metric dt {
  opacity: 0.65;
}

.metric dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 6px;
}

.compare-table th,
.compare-table td {
  padding: 4px 5px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.compare-table th:first-child,
.compare-table td:first-child {
  text-align: left;
  opacity: 0.65;
}

.mini-btn {
  margin-top: 8px;
  padding: 5px 10px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
}

.mini-btn:hover {
  border-color: var(--tv-primary, #4f8ef7);
}

.empty-tip {
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.6;
}

.list-meta {
  margin: 6px 0 0;
  font-size: 10px;
  opacity: 0.5;
}

.timeline-bar {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: var(--tv-radius-full, 999px);
}

.play-btn {
  padding: 4px 12px;
  border: none;
  border-radius: var(--tv-radius-full, 999px);
  background: var(--tv-primary, #4f8ef7);
  color: var(--tv-on-primary, #fff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.timeline-range {
  width: 420px;
}

.year-label {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 42px;
  text-align: center;
}

.legend {
  position: absolute;
  left: 16px;
  bottom: 14px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--tv-radius-full, 999px);
  font-size: 11px;
}

.legend-gradient {
  width: 140px;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #f7fbff, #d0e1f2, #94c4df, #4a98c9, #2271b2, #0c4a8c, #08306b);
}

.debug-hud {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.65);
  color: #7fff9f;
  font: 11px/1.6 monospace;
  white-space: nowrap;
  pointer-events: none;
}
</style>
