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
            :title="compareFull && !compare.includes(c.name) ? '最多同时对比 4 个国家' : '加入对比'"
            @click.stop
          >
            <input
              type="checkbox"
              :checked="compare.includes(c.name)"
              :disabled="compareFull && !compare.includes(c.name)"
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

      <!-- 图例 + 着色指标切换:放面板内,避免与居中的时间轴条重叠
           (横排版曾在 1280/1440 视口盖住时间轴滑杆右段) -->
      <div class="legend">
        <div class="metric-tabs">
          <button
            v-for="m in METRICS"
            :key="m.key"
            class="metric-tab"
            :class="{ active: metric === m.key }"
            :data-testid="`metric-tab-${m.key}`"
            @click="setMetric(m.key)"
          >
            {{ m.label }}
          </button>
        </div>
        <span class="legend-text">{{ metricLabel }} 低 → 高</span>
        <span class="legend-gradient" />
      </div>
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

        <!-- 国家趋势图(A2):选中国 GDP 2000~2020 -->
        <template v-if="selected">
          <p class="group-label">
            {{ selected }} · GDP 走势(2000~2020)
          </p>
          <div
            ref="trendRef"
            class="trend-box"
            data-testid="trend-chart"
          />
        </template>
      </template>
      <p
        v-else
        class="empty-tip"
      >
        点击地图上的国家，或在左侧列表选择。
      </p>

      <!-- 导出当前视图(A4):不依赖选国,常驻 -->
      <button
        class="mini-btn"
        data-testid="export-csv"
        @click="exportCsv"
      >
        ⬇ 导出当前视图 CSV
      </button>

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

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadCesium } from '../map/cesiumLoader'
import { createMapViewer } from '../map/createViewer'
import { useCountryData, formatUSD, formatPopulation, formatAreaSqKm, gdpRank } from '../map/analysis/useCountryData'
import { Choropleth } from '../map/analysis/choropleth'

const containerRef = ref<HTMLElement | null>(null)
const ready = ref(false)
const search = ref('')
const selected = ref<string | null>(null)
const compare = ref<string[]>([])
// ?debug=1 时暴露渲染器调试钩子与 HUD
const debug = ref(new URLSearchParams(window.location.search).has('debug'))
const yearIndex = ref(0)
const playing = ref(false)

const { loading, error: dataError, years, countries, gdpByYear, world, load } = useCountryData()
const route = useRoute()
const router = useRouter()
let viewer: any = null
let choropleth: Choropleth | null = null
let playTimer: ReturnType<typeof setInterval> | null = null
let debugTimer: ReturnType<typeof setInterval> | null = null
let pickHandler: any = null
let trendChart: import('echarts').ECharts | null = null
const trendRef = ref<HTMLDivElement | null>(null)
const debugHeight = ref(0)

const year = computed(() => years.value[yearIndex.value] ?? '')
const selectedCountry = computed(() => countries.value.find((c) => c.name === selected.value) || null)
const compareFull = computed(() => compare.value.length >= 4)

// 着色指标(A1/A5):GDP 随时间轴年份联动;人均 GDP 派生;人口/碳排放为静态年,
// 复用 choropleth 的排名百分位色阶(applyValues 通用入口,无需为指标写专用色阶)
const METRICS = [
  { key: 'gdp', label: 'GDP' },
  { key: 'percapita', label: '人均 GDP' },
  { key: 'population', label: '人口' },
  { key: 'carbon', label: '碳排放' },
]
const metric = ref('gdp')
const metricLabel = computed(() => METRICS.find((m) => m.key === metric.value)?.label || '')

function setMetric(key: string) {
  if (metric.value === key) return
  metric.value = key
  choropleth?.applyValues(metricValues.value, selected.value, compare.value)
}

const metricValues = computed(() => {
  if (metric.value === 'gdp') return gdpByYear.value[year.value] || {}
  if (metric.value === 'percapita') {
    const yearData = gdpByYear.value[year.value] || {}
    const map: Record<string, number> = {}
    for (const c of countries.value) {
      const gdp = yearData[c.name]
      if (gdp != null && c.population) map[c.name] = gdp / c.population
    }
    return map
  }
  if (metric.value === 'population') {
    const map: Record<string, number> = {}
    for (const c of countries.value) {
      if (c.population != null) map[c.name] = c.population
    }
    return map
  }
  const map: Record<string, number> = {}
  for (const c of countries.value) {
    if (c.emission != null) map[c.name] = c.emission
  }
  return map
})

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
  const r = year.value && selected.value ? gdpRank(gdpByYear.value, year.value, selected.value) : null
  return r ? `第 ${r} 位 / ${countries.value.length}` : ''
})

function compareCell(name: string, metric: string) {
  if (metric === 'gdp') return formatUSD(gdpByYear.value[year.value]?.[name] ?? null)
  if (metric === 'population') return formatPopulation(countries.value.find((c) => c.name === name)?.population)
  if (metric === 'emission') {
    const v = countries.value.find((c) => c.name === name)?.emission
    return v != null ? `${v} MtCO₂` : '暂无数据'
  }
  return '—'
}

function selectCountry(name: string) {
  selected.value = name
  choropleth?.flyTo(name)
}

function toggleCompare(name: string) {
  const idx = compare.value.indexOf(name)
  if (idx > -1) compare.value.splice(idx, 1)
  else if (!compareFull.value) compare.value.push(name)
  // 满员后靠复选框 disabled 拦截(悬停有说明);曾在此静默丢弃第 5 国勾选
}

function togglePlay() {
  playing.value = !playing.value
  if (playing.value && yearIndex.value >= years.value.length - 1) yearIndex.value = 0
}

watch(playing, (on) => {
  // 暂停与重新播放都要先清旧计时器:曾只在「自然播完」分支清理,
  // 手动暂停后 interval 继续走,年份在暂停状态下仍逐年演进(审查 P1)
  if (playTimer) clearInterval(playTimer)
  playTimer = null
  if (!on) return
  playTimer = setInterval(() => {
    if (yearIndex.value >= years.value.length - 1) {
      playing.value = false
      clearInterval(playTimer!)
      playTimer = null
      return
    }
    yearIndex.value++
  }, 700)
})

// 对比国必须用长度做源：多源 watch 对 ref 只读 .value、不做 traverse，
// toggleCompare 的 push/splice 原地改数组不会触发回调（曾致勾选对比后地图不重着色）
watch([year, selected, () => compare.value.length, metric], () => {
  choropleth?.applyValues(metricValues.value, selected.value, compare.value)
})

// ---- URL 状态分享(A3):?country=&year=,单一机制管本页 query(C11) ----
// 初始化时从 query 还原一次;之后操作驱动 replace,不再 watch route(避免回写环)
function restoreFromQuery() {
  const restored = { country: false, year: false }
  const qCountry = typeof route.query.country === 'string' ? route.query.country : ''
  if (qCountry && countries.value.some((c) => c.name === qCountry)) {
    selected.value = qCountry
    restored.country = true
  }
  const qYear = String(route.query.year ?? '')
  const idx = years.value.indexOf(qYear)
  if (idx > -1) {
    yearIndex.value = idx
    restored.year = true
  }
  return restored
}

watch([selected, year], () => {
  const q: Record<string, string> = {}
  if (selected.value) q.country = selected.value
  if (year.value) q.year = String(year.value)
  router.replace({ query: q }).catch(() => {})
})

// ---- 国家趋势图(A2):选中国 → GDP 2000~2020 折线,echarts 动态 import ----
async function renderTrend() {
  const sel = selected.value
  if (!sel || !trendRef.value) return
  if (!trendChart) {
    const echarts = await import('echarts')
    trendChart = echarts.init(trendRef.value)
  }
  const series = years.value.map((y) => gdpByYear.value[y]?.[sel] ?? null)
  trendChart.setOption({
    grid: { left: 8, right: 12, top: 20, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: years.value, axisLabel: { fontSize: 9 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 9, formatter: (v: number) => (v >= 1e12 ? `${(v / 1e12).toFixed(1)}万亿` : '') } },
    series: [{ type: 'line', data: series, symbolSize: 4, itemStyle: { color: '#2271b2' } }],
  })
}

watch(selected, () => {
  nextTick(renderTrend)
})

// ---- 当前视图数据导出(A4):CSV(UTF-8 BOM),随时间轴年份 ----
function exportCsv() {
  const header = ['国家/地区', `GDP(${year.value},美元)`, '人口', '人均GDP(美元)', '面积(km²)', '人口密度(人/km²)', '碳排放(MtCO2)']
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = countries.value.map((c) => {
    const gdpNum = gdpByYear.value[year.value]?.[c.name]
    const gdp: number | string = gdpNum ?? ''
    const percap = typeof gdp === 'number' && c.population ? Math.round(gdp / c.population) : ''
    return [c.name, gdp, c.population ?? '', percap, c.area ?? '', c.density ?? '', c.emission ?? '']
  })
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const a = document.createElement('a')
  a.download = `terra-analysis-${year.value || 'data'}.csv`
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

onMounted(async () => {
  await load()
  if (dataError.value) return
    const restored = restoreFromQuery() // A3:?country=&year= 还原选国与年份(须在首次着色前)
  try {
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value, {
      mode: 'vec',
      view: { lon: 60, lat: 28, height: 9_500_000 },
    })
    choropleth = new Choropleth(Cesium, viewer)
    await choropleth.load(world.value)

    if (debug.value) {
      // 调试钩子：供探针读取渲染器真实状态
      window.__tvMapDebug = { viewer, Cesium }
      debugTimer = setInterval(() => {
        debugHeight.value = Math.round(viewer.camera.positionCartographic.height)
      }, 500)
    }
    // 默认落在末年;URL 已指定年份时保持还原值
    if (!restored.year) yearIndex.value = years.value.length - 1
    choropleth.applyValues(metricValues.value, selected.value, compare.value)

    // 点击地图选国(挂组件级引用,卸载时销毁——其余页面均如此)
    pickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    pickHandler.setInputAction((e: any) => {
      const name = choropleth!.pickName(e.position)
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
  pickHandler?.destroy()
  trendChart?.dispose()
  trendChart = null
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

.trend-box {
  width: 100%;
  height: 150px;
  margin-top: 2px;
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
  /* 面板内静态布局:竖排(指标按钮一行、文案+渐变一行),不与时间轴争位 */
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  padding: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
  font-size: 11px;
}

.legend-text,
.legend-gradient {
  align-self: center;
}

.legend-gradient {
  width: 80%;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(to right, #f7fbff, #d0e1f2, #94c4df, #4a98c9, #2271b2, #0c4a8c, #08306b);
}

.metric-tabs {
  display: flex;
  gap: 4px;
}

.metric-tab {
  padding: 2px 8px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: var(--tv-radius-full, 999px);
  background: transparent;
  color: inherit;
  font-size: 11px;
  cursor: pointer;
}

.metric-tab.active {
  border-color: var(--tv-primary, #4f8ef7);
  background: var(--tv-primary-fixed, rgba(79, 142, 247, 0.14));
  font-weight: 600;
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
