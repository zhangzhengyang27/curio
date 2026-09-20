<template>
  <div class="workbench-view">
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
          {{ THEMES[key].short }}
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
      <!-- 选国下钻(W3):GDP 主题点排行后显示该国多年趋势 -->
      <template v-if="drillCountry">
        <p class="group-label">
          {{ drillCountry }} · GDP 走势(2000~2020)
        </p>
        <div
          ref="drillRef"
          class="drill-box"
          data-testid="drill-chart"
        />
      </template>
      <p
        class="summary"
        data-testid="summary"
      >
        {{ summary }}
      </p>
      <p class="group-label">
        报告模板
      </p>
      <div class="report-mode">
        <button
          class="mode-pill"
          :class="{ active: reportMode === 'brief' }"
          data-testid="mode-brief"
          @click="reportMode = 'brief'"
        >
          摘要版
        </button>
        <button
          class="mode-pill"
          :class="{ active: reportMode === 'full' }"
          data-testid="mode-full"
          @click="reportMode = 'full'"
        >
          完整版
        </button>
      </div>
      <button
        class="mini-btn primary"
        data-testid="export-report"
        :disabled="exporting"
        @click="exportReport"
      >
        <UiIcon
          v-if="!exporting"
          name="download"
          :size="14"
        />
        {{ exporting ? '报告生成中…' : '生成分析报告' }}
      </button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadCesium } from '../map/cesiumLoader'
import { createMapViewer } from '../map/createViewer'
import { Choropleth } from '../map/analysis/choropleth'
import { useCountryData, formatUSD, formatPopulation } from '../map/analysis/useCountryData'
import UiIcon from '../components/UiIcon'

// 数轴刻度压缩：原始值如 5,000,000,000,000 会让相邻刻度互相重叠成一团，
// 统一压缩为 万/亿/万亿 量级（与排行/摘要的中文单位口径一致）
function formatCompact(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1e12) return `${Number((v / 1e12).toFixed(1))}万亿`
  if (abs >= 1e8) return `${Number((v / 1e8).toFixed(0))}亿`
  if (abs >= 1e4) return `${Number((v / 1e4).toFixed(0))}万`
  return `${v}`
}

// 图表文字色取自主题令牌：ECharts 默认按浅色底渲染，暗色下不注入会看不清
function chartTextColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--tv-on-surface-variant').trim() || '#97a0b4'
}

interface WorkbenchTheme {
  title: string
  /** 分段按钮里的短标签（面板窄，全称会挤成三行） */
  short: string
  word: string
  unit: string
  fmt: (v: number) => string
  fmtCard: (v: number) => string
}

const THEMES: Record<string, WorkbenchTheme> = {
  gdp: {
    title: '全球经济 · GDP',
    short: 'GDP',
    word: 'GDP 总量',
    unit: '万亿美元',
    fmt: (v: number) => `${(v / 1e12).toFixed(2)}`,
    fmtCard: formatUSD,
  },
  carbon: {
    title: '全球碳排放',
    short: '碳排放',
    word: '碳排放总量',
    unit: 'MtCO₂',
    fmt: (v: number) => Math.round(v).toLocaleString(),
    fmtCard: (v: number) => `${Math.round(v).toLocaleString()} MtCO₂`,
  },
  population: {
    title: '人口规模',
    short: '人口',
    word: '人口总量',
    unit: '亿人',
    fmt: (v: number) => (v / 1e8).toFixed(2),
    fmtCard: formatPopulation,
  },
  density: {
    title: '人口密度',
    short: '密度',
    word: '人口密度',
    unit: '人/km²',
    fmt: (v: number) => Math.round(v).toLocaleString(),
    fmtCard: (v: number) => `${Math.round(v).toLocaleString()} 人/km²`,
  },
}
const THEME_KEYS = Object.keys(THEMES)

const containerRef = ref<HTMLElement | null>(null)
const chartRef = ref<HTMLDivElement | null>(null)
const ready = ref(false)
const loadError = ref('')
const theme = ref('gdp')
const exporting = ref(false)
const route = useRoute()
const router = useRouter()

// URL 状态(X2):?theme= 与 analysis 的 ?country=&year= 同一套命名规范;
// 本页仅此一个 URL 机制(C11:一个页面的 URL 状态只能归一个机制管)
const THEME_QUERY_KEYS: string[] = Object.keys(THEMES)
const queryTheme = typeof route.query.theme === 'string' ? route.query.theme : ''
if (THEME_QUERY_KEYS.includes(queryTheme)) theme.value = queryTheme

watch(theme, (t: string) => {
  router.replace({ query: t === 'gdp' ? {} : { theme: t } }).catch(() => {})
})

// dataError = 数据层错误(数据文件拉取失败);loadError = Cesium 初始化错误。
// 曾只解构数据不接 error,数据失败时页面静默全灰(审查 P2 死代码分支)
const { countries, gdpByYear, world, load, error: dataError } = useCountryData()
let viewer: any = null
let choropleth: Choropleth | null = null
let chartInstance: import('echarts').ECharts | null = null

// GDP 用 2020 年(时间序列末年);其余主题数据文件均为静态年
const THEME_YEAR: Record<string, string> = { gdp: '2020' }
const THEME_YEAR_LABEL: Record<string, string> = { gdp: '2020 年，', carbon: '2020 年，', population: '', density: '' }
const THEME_YEAR_TEXT: Record<string, string> = { gdp: '2020', carbon: '2020', population: '静态演示数据', density: '静态演示数据' }

// 各主题的「国名 → 数值」映射
// ⚠ gdp 必须按 countries(多边形 ∩ GDP 交集,166 国)过滤:timeline 原始数据
//   含「世界/高收入国家」等 96 个无多边形聚合项,不过滤会把全球总量当国家
//   排进 Top10/摘要/导出报告(2026-09-15 审查 P0)。carbon 已按 countries 构建。
const metricMaps: Record<string, ComputedRef<Record<string, number>>> = {
  gdp: computed(() => {
    const map: Record<string, number> = {}
    const yearData = gdpByYear.value[THEME_YEAR.gdp] || {}
    for (const c of countries.value) {
      if (yearData[c.name] != null) map[c.name] = yearData[c.name]
    }
    return map
  }),
  carbon: computed(() => {
    const map: Record<string, number> = {}
    for (const c of countries.value) {
      if (c.emission != null) map[c.name] = c.emission
    }
    return map
  }),
  population: computed(() => {
    const map: Record<string, number> = {}
    for (const c of countries.value) {
      if (c.population != null) map[c.name] = c.population
    }
    return map
  }),
  // 密度直接取数据文件的 density 字段(与 analysis 指标卡同口径),不重算
  density: computed(() => {
    const map: Record<string, number> = {}
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

function formatValue(v: number) {
  return THEMES[theme.value].fmtCard(v)
}

function setTheme(t: string) {
  if (theme.value === t) return
  theme.value = t
  drillCountry.value = null // 趋势图仅 GDP 有时间序列,切主题关闭下钻
  refresh()
}

function refresh() {
  choropleth?.applyValues(values.value)
  renderChart()
  renderDrill()
}

// ---- 选国下钻(W3):点排行 → flyTo + 该国多年趋势小图(GDP 有时间序列) ----
const drillCountry = ref<string | null>(null)
const drillRef = ref<HTMLDivElement | null>(null)
let drillChart: import('echarts').ECharts | null = null

function focusCountry(name: string) {
  choropleth?.flyTo(name)
  drillCountry.value = theme.value === 'gdp' ? name : null
  nextTick(renderDrill)
}

async function renderDrill() {
  if (!drillCountry.value || !drillRef.value) {
    // drillCountry 清空会让 .drill-box 被 v-if 卸载，但实例还绑在已脱离文档的旧 div 上。
    // 不丢掉的话，下次下钻会命中 !drillChart 短路、把 setOption 打进死容器 → 图永久空白。
    // 只在「国家被清空」这一支丢，避免把尚未挂载（drillRef 暂时为 null）的有效实例误杀。
    if (!drillCountry.value && drillChart) {
      drillChart.dispose()
      drillChart = null
    }
    return
  }
  if (!drillChart) {
    const echarts = await import('echarts')
    drillChart = echarts.init(drillRef.value)
  }
  const years = Object.keys(gdpByYear.value).sort()
  const series = years.map((y) => gdpByYear.value[y]?.[drillCountry.value!] ?? null)
  drillChart.setOption({
    grid: { left: 6, right: 10, top: 8, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: years, axisLabel: { fontSize: 9, color: chartTextColor(), hideOverlap: true } },
    yAxis: { type: 'value', axisLabel: { fontSize: 9, color: chartTextColor(), formatter: formatCompact, hideOverlap: true } },
    series: [{ type: 'line', data: series, symbolSize: 3, itemStyle: { color: '#2271b2' } }],
  })
}

function renderChart() {
  if (!chartInstance || !chartRef.value) return
  const top = top10.value
  chartInstance.setOption({
    // right 预留条形末端「数值 + 单位」标签的宽度，避免贴边裁切
    grid: { left: 8, right: 72, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { fontSize: 10, color: chartTextColor(), formatter: formatCompact, hideOverlap: true } },
    yAxis: {
      type: 'category',
      data: top.map((t) => t.name).reverse(),
      axisLabel: { fontSize: 11, color: chartTextColor() },
    },
    series: [{
      type: 'bar',
      data: top.map((t) => t.value).reverse(),
      itemStyle: { color: '#2271b2', borderRadius: [0, 4, 4, 0] },
      barWidth: '60%',
      label: { show: true, position: 'right', fontSize: 10, formatter: (p: any) => formatValue(p.value) },
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

// 报告模板(W2):摘要版 / 完整版
const reportMode = ref('full')

/** 生成参数指纹(W2):主题/数据年份/样本量/榜首/合计值摘要,同参数重复生成指纹一致 */
function reportFingerprint() {
  const entries = Object.entries(values.value)
  const top1 = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const total = entries.reduce((s, [, v]) => s + v, 0)
  const raw = `${theme.value}|${THEME_YEAR.gdp}|${entries.length}|${top1}|${Math.round(total)}`
  let h = 5381
  for (const ch of raw) h = ((h * 33) ^ (ch.codePointAt(0) ?? 0)) >>> 0
  return `TV-${theme.value.toUpperCase()}-${entries.length}N-${h.toString(36).toUpperCase()}`
}

async function exportReport() {
  if (exporting.value) return
  exporting.value = true
  try {
    viewer.render()
    const mapSnap = viewer.canvas.toDataURL('image/png')
    const chartSnap = chartInstance ? chartInstance.getDataURL({ type: 'png', pixelRatio: 2 }) : ''
    const yearDesc = THEME_YEAR_TEXT[theme.value]
    const full = reportMode.value === 'full'
    const rows = top10.value
      .map((t, i) => `<tr><td>${i + 1}</td><td>${t.name}</td><td>${formatValue(t.value)}</td></tr>`)
      .join('')
    const chartSection = full
      ? `<h2>Top 10 图表</h2><img src="${chartSnap}" alt="Top10 图表">`
      : ''
    const fingerprintSection = full
      ? `<h2>生成参数指纹</h2><p class="meta"><code>${reportFingerprint()}</code> · 相同参数重新生成指纹一致,可用于核对报告与数据版本</p>`
      : ''
    const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<title>TerraVista 分析报告 · ${themeTitle.value}${full ? '' : '（摘要版）'}</title>
<style>body{font-family:system-ui,-apple-system,'PingFang SC',sans-serif;max-width:920px;margin:28px auto;padding:0 16px;color:#222}
img{max-width:100%;border:1px solid #ddd;border-radius:8px}h1{font-size:22px}h2{font-size:16px;margin-top:28px}
table{border-collapse:collapse;width:100%;margin-top:8px}td,th{border:1px solid #ddd;padding:6px 10px;font-size:14px;text-align:left}
.meta{color:#888;font-size:12px}
.print-bar{position:fixed;top:12px;right:12px;padding:8px 16px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;font-size:14px}
@media print{.print-bar{display:none}body{max-width:none;margin:0;padding:12mm}img{page-break-inside:avoid}h2{page-break-after:avoid}}
</style></head><body>
<button class="print-bar" onclick="window.print()">🖨 打印 / 保存为 PDF</button>
<p class="meta">提示:点击右上角按钮,在打印对话框中选择「另存为 PDF」即可导出 PDF 文件。</p>
<h1>TerraVista 3D · ${themeTitle.value}分析报告${full ? '' : '（摘要版）'}</h1>
<p class="meta">模板 ${full ? '完整版' : '摘要版'} · 生成时间 ${new Date().toLocaleString('zh-CN')} · 数据年份 ${yearDesc} · 样本 ${Object.keys(values.value).length} 个经济体</p>
<p>${summary.value}</p>
<h2>全球分布</h2><img src="${mapSnap}" alt="全球分布">
${chartSection}
<h2>Top 10</h2><table><tr><th>排名</th><th>经济体</th><th>数值</th></tr>${rows}</table>
${fingerprintSection}
<p class="meta">由 TerraVista 3D 分析工作台生成 · 数据为演示用途</p>
</body></html>`
    const a = document.createElement('a')
    a.download = `terra-report-${theme.value}-${reportMode.value}-${Date.now()}.html`
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  } finally {
    exporting.value = false
  }
}

let resizeHandler: (() => void) | null = null
onMounted(async () => {
  try {
    await load()
    if (dataError.value) return
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value, {
      mode: 'vec',
      view: { lon: 60, lat: 28, height: 9_500_000 },
    })
    choropleth = new Choropleth(Cesium, viewer)
    await choropleth.load(world.value)
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
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  chartInstance?.dispose()
  chartInstance = null
  drillChart?.dispose()
  drillChart = null
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
  background: var(--tv-background);
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.theme-tab {
  padding: 6px 4px;
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-md);
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-xs);
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color var(--tv-dur-fast) var(--tv-ease), background var(--tv-dur-fast) var(--tv-ease),
    color var(--tv-dur-fast) var(--tv-ease);
}

.theme-tab:hover {
  color: var(--tv-on-surface);
  border-color: var(--tv-outline);
}

.theme-tab.active {
  border-color: transparent;
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
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

.drill-box {
  width: 100%;
  height: 140px;
}

.report-mode {
  display: flex;
  gap: 6px;
}

.mode-pill {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-full);
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-xs);
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--tv-dur-fast) var(--tv-ease), background var(--tv-dur-fast) var(--tv-ease),
    color var(--tv-dur-fast) var(--tv-ease);
}

.mode-pill:hover {
  color: var(--tv-on-surface);
}

.mode-pill.active {
  border-color: transparent;
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
  font-weight: 600;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: var(--tv-radius-md);
  background: var(--tv-primary);
  color: var(--tv-on-primary);
  font-size: var(--tv-fs-sm);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform var(--tv-dur-fast) var(--tv-ease), filter var(--tv-dur-fast) var(--tv-ease);
}

.mini-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.mini-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
