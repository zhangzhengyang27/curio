<template>
  <div class="workbench-view">
    <div
      ref="containerRef"
      class="map-container"
    />

    <div
      v-if="loadError"
      class="load-error tv-glass-panel"
    >
      {{ loadError }}
    </div>

    <!-- 左侧：主题与排行 -->
    <aside
      v-if="ready"
      class="panel panel-left tv-glass-panel"
    >
      <h3 class="panel-title">
        分析工作台
      </h3>
      <div class="theme-tabs">
        <button
          v-for="key in THEME_KEYS"
          :key="key"
          class="theme-tab"
          :class="{ active: theme === key }"
          :data-testid="`theme-${key}`"
          @click="setTheme(key)"
        >
          {{ THEMES[key].title }}
        </button>
      </div>

      <p class="group-label">
        {{ themeTitle }} · Top 10
      </p>
      <ol
        class="ranking"
        data-testid="ranking-list"
      >
        <li
          v-for="(item, i) in top10"
          :key="item.name"
          class="rank-row"
          :data-testid="`rank-item-${i}`"
          @click="focusCountry(item.name)"
        >
          <span class="rank-no">{{ i + 1 }}</span>
          <span class="rank-name">{{ item.name }}</span>
          <span class="rank-value">{{ formatValue(item.value) }}</span>
        </li>
      </ol>
    </aside>

    <!-- 右侧：图表与报告 -->
    <aside
      v-if="ready"
      class="panel panel-right tv-glass-panel"
    >
      <h3 class="panel-title">
        {{ themeTitle }} · 分布图表
      </h3>
      <div
        ref="chartRef"
        class="chart-box"
        data-testid="chart"
      />
      <p
        class="summary"
        data-testid="summary"
      >
        {{ summary }}
      </p>
      <button
        class="mini-btn primary"
        data-testid="export-report"
        :disabled="exporting"
        @click="exportReport"
      >
        {{ exporting ? '报告生成中…' : '⬇ 生成分析报告' }}
      </button>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { loadCesium } from '../map/cesiumLoader.js'
import { createMapViewer } from '../map/createViewer.js'
import { Choropleth } from '../map/analysis/choropleth.js'
import { useCountryData, formatUSD, formatPopulation } from '../map/analysis/useCountryData.js'

const THEMES = {
  gdp: {
    title: '全球经济 · GDP',
    word: 'GDP 总量',
    unit: '万亿美元',
    fmt: (v) => `${(v / 1e12).toFixed(2)}`,
    fmtCard: formatUSD,
  },
  carbon: {
    title: '全球碳排放',
    word: '碳排放总量',
    unit: 'MtCO₂',
    fmt: (v) => Math.round(v).toLocaleString(),
    fmtCard: (v) => `${Math.round(v).toLocaleString()} MtCO₂`,
  },
  population: {
    title: '人口规模',
    word: '人口总量',
    unit: '亿人',
    fmt: (v) => (v / 1e8).toFixed(2),
    fmtCard: formatPopulation,
  },
  density: {
    title: '人口密度',
    word: '人口密度',
    unit: '人/km²',
    fmt: (v) => Math.round(v).toLocaleString(),
    fmtCard: (v) => `${Math.round(v).toLocaleString()} 人/km²`,
  },
}
const THEME_KEYS = Object.keys(THEMES)

const containerRef = ref(null)
const chartRef = ref(null)
const ready = ref(false)
const loadError = ref('')
const theme = ref('gdp')
const exporting = ref(false)

const { years, countries, gdpByYear, load } = useCountryData()
let viewer = null
let choropleth = null
let chart = null
let chartInstance = null

// GDP 用 2020 年(时间序列末年);其余主题数据文件均为静态年
const THEME_YEAR = { gdp: '2020' }
const THEME_YEAR_LABEL = { gdp: '2020 年，', carbon: '2020 年，', population: '', density: '' }
const THEME_YEAR_TEXT = { gdp: '2020', carbon: '2020', population: '静态演示数据', density: '静态演示数据' }

// 各主题的「国名 → 数值」映射
// ⚠ gdp 必须按 countries(多边形 ∩ GDP 交集,166 国)过滤:timeline 原始数据
//   含「世界/高收入国家」等 96 个无多边形聚合项,不过滤会把全球总量当国家
//   排进 Top10/摘要/导出报告(2026-09-15 审查 P0)。carbon 已按 countries 构建。
const metricMaps = {
  gdp: computed(() => {
    const map = {}
    const yearData = gdpByYear.value[THEME_YEAR.gdp] || {}
    for (const c of countries.value) {
      if (yearData[c.name] != null) map[c.name] = yearData[c.name]
    }
    return map
  }),
  carbon: computed(() => {
    const map = {}
    for (const c of countries.value) {
      if (c.emission != null) map[c.name] = c.emission
    }
    return map
  }),
  population: computed(() => {
    const map = {}
    for (const c of countries.value) {
      if (c.population != null) map[c.name] = c.population
    }
    return map
  }),
  // 密度直接取数据文件的 density 字段(与 analysis 指标卡同口径),不重算
  density: computed(() => {
    const map = {}
    for (const c of countries.value) {
      if (c.density != null) map[c.name] = c.density
    }
    return map
  }),
}

const values = computed(() => metricMaps[theme.value].value)
const themeTitle = computed(() => THEMES[theme.value].title)
const top10 = computed(() => {
  return Object.entries(values.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))
})

function formatValue(v) {
  return THEMES[theme.value].fmtCard(v)
}

function setTheme(t) {
  if (theme.value === t) return
  theme.value = t
  refresh()
}

function refresh() {
  choropleth?.applyValues(values.value)
  renderChart()
}

function renderChart() {
  if (!chartInstance || !chartRef.value) return
  const top = top10.value
  chartInstance.setOption({
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: top.map((t) => t.name).reverse(),
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: top.map((t) => t.value).reverse(),
      itemStyle: { color: '#2271b2', borderRadius: [0, 4, 4, 0] },
      barWidth: '60%',
      label: { show: true, position: 'right', fontSize: 10, formatter: (p) => formatValue(p.value) },
    }],
  })
}

const summary = computed(() => {
  const conf = THEMES[theme.value]
  const entries = Object.entries(values.value).sort((a, b) => b[1] - a[1])
  if (!entries.length) return ''
  const total = entries.reduce((s, [, v]) => s + v, 0)
  const top10Sum = entries.slice(0, 10).reduce((s, [, v]) => s + v, 0)
  const [first, second] = entries
  return (
    `${THEME_YEAR_LABEL[theme.value]}样本内 ${entries.length} 个经济体的${conf.word}` +
    `合计 ${conf.fmt(total)} ${conf.unit}；前 10 名合计占 ${(top10Sum * 100 / total).toFixed(1)}%。` +
    `${first[0]} 以 ${conf.fmt(first[1])} ${conf.unit} 居首，` +
    `其后为 ${second?.[0] ?? '—'}（${conf.fmt(second?.[1] ?? 0)} ${conf.unit}）。` +
    `分布呈显著头部集中，区域间差距明显。`
  )
})

async function exportReport() {
  if (exporting.value) return
  exporting.value = true
  try {
    viewer.render()
    const mapSnap = viewer.canvas.toDataURL('image/png')
    const chartSnap = chartInstance ? chartInstance.getDataURL({ type: 'png', pixelRatio: 2 }) : ''
    const yearDesc = THEME_YEAR_TEXT[theme.value]
    const rows = top10.value
      .map((t, i) => `<tr><td>${i + 1}</td><td>${t.name}</td><td>${formatValue(t.value)}</td></tr>`)
      .join('')
    const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<title>TerraVista 分析报告 · ${themeTitle.value}</title>
<style>body{font-family:system-ui,-apple-system,'PingFang SC',sans-serif;max-width:920px;margin:28px auto;padding:0 16px;color:#222}
img{max-width:100%;border:1px solid #ddd;border-radius:8px}h1{font-size:22px}h2{font-size:16px;margin-top:28px}
table{border-collapse:collapse;width:100%;margin-top:8px}td,th{border:1px solid #ddd;padding:6px 10px;font-size:14px;text-align:left}
.meta{color:#888;font-size:12px}</style></head><body>
<h1>TerraVista 3D · ${themeTitle.value}分析报告</h1>
<p class="meta">生成时间 ${new Date().toLocaleString('zh-CN')} · 数据年份 ${yearDesc} · 样本 ${Object.keys(values.value).length} 个经济体</p>
<p>${summary.value}</p>
<h2>全球分布</h2><img src="${mapSnap}" alt="全球分布">
<h2>Top 10</h2><img src="${chartSnap}" alt="Top10 图表">
<h2>排名明细</h2><table><tr><th>排名</th><th>经济体</th><th>数值</th></tr>${rows}</table>
<p class="meta">由 TerraVista 3D 分析工作台生成 · 数据为演示用途</p>
</body></html>`
    const a = document.createElement('a')
    a.download = `terra-report-${theme.value}-${Date.now()}.html`
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  } finally {
    exporting.value = false
  }
}

function focusCountry(name) {
  choropleth?.flyTo(name)
}

let resizeHandler = null
onMounted(async () => {
  try {
    await load()
    if (loadError.value) return
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value, {
      mode: 'vec',
      view: { lon: 60, lat: 28, height: 9_500_000 },
    })
    choropleth = new Choropleth(Cesium, viewer)
    await choropleth.load()
    choropleth.applyValues(values.value)
    ready.value = true
    await nextTick()
    const echarts = await import('echarts')
    chartInstance = echarts.init(chartRef.value)
    renderChart()
    resizeHandler = () => chartInstance?.resize()
    window.addEventListener('resize', resizeHandler)
  } catch (err) {
    loadError.value = '页面初始化失败，请刷新重试。'
    console.error('[workbench] 初始化失败:', err)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  chartInstance?.dispose()
  chartInstance = null
  choropleth?.destroy()
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
})
</script>

<style scoped>
.workbench-view {
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
  z-index: 10;
  width: 300px;
  padding: 14px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.panel-left {
  left: 16px;
  bottom: 16px;
}

.panel-right {
  right: 16px;
  bottom: 16px;
  max-height: calc(100% - 32px);
}

.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
}

.theme-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.theme-tab {
  flex: 1;
  padding: 6px 4px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
}

.theme-tab.active {
  border-color: var(--tv-primary, #4f8ef7);
  background: var(--tv-primary-fixed, rgba(79, 142, 247, 0.14));
  font-weight: 600;
}

.group-label {
  margin: 4px 0 6px;
  font-size: 11px;
  opacity: 0.6;
}

.ranking {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.rank-row:hover {
  background: rgba(128, 128, 128, 0.12);
}

.rank-no {
  width: 18px;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
}

.rank-name {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rank-value {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}

.chart-box {
  width: 100%;
  height: 260px;
}

.summary {
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.85;
  margin: 10px 0 0;
}

.mini-btn {
  margin-top: 10px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 8px;
  background: var(--tv-primary, #4f8ef7);
  color: var(--tv-on-primary, #fff);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.mini-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
