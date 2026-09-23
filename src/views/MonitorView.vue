<template>
  <div class="monitor-view">
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

    <!-- 顶部统计大盘 -->
    <header
      v-if="ready"
      class="stats-bar tv-glass-panel"
    >
      <span class="stats-title">地震应急监测</span>
      <span
        class="stat"
        data-testid="stats-open"
      >未处理 <b>{{ stats.open }}</b></span>
      <span
        class="stat"
        data-testid="stats-processing"
      >处理中 <b>{{ stats.processing }}</b></span>
      <span
        class="stat"
        data-testid="stats-resolved"
      >已处置 <b>{{ stats.resolved }}</b></span>
      <span
        class="stat warn"
        data-testid="stats-critical"
      >重大待处置 <b>{{ stats.critical }}</b></span>
      <label
        class="threshold-row"
        title="震级达到该值自动列为「重大」并置顶"
      >
        重大阈值
        <input
          id="monitor-threshold"
          type="number"
          min="4"
          max="9"
          step="0.5"
          :value="threshold"
          data-testid="threshold-input"
          @change="onThresholdChange"
        >
      </label>
      <button
        class="mini-btn"
        data-testid="tour-btn"
        :disabled="unresolvedCount === 0"
        :title="unresolvedCount === 0 ? '没有未处置事件可巡游' : '自动轮播未处置事件'"
        @click="toggleTour"
      >
        <UiIcon
          :name="tourStatus === 'playing' ? 'pause' : 'play'"
          :size="13"
        />
        {{ tourStatus === 'playing' ? '停止巡游' : '巡游大屏' }}
      </button>
      <button
        class="mini-btn icon-only"
        data-testid="tour-step"
        :disabled="unresolvedCount === 0"
        :title="unresolvedCount === 0 ? '没有未处置事件可巡游' : '步进到下一个未处置事件'"
        :aria-label="unresolvedCount === 0 ? '没有未处置事件可巡游' : '步进到下一个未处置事件'"
        @click="stepTour"
      >
        <UiIcon
          name="skip"
          :size="14"
        />
      </button>
      <button
        class="mini-btn"
        data-testid="replay-btn"
        title="按发震时间升序重放事件到达；退出后恢复回放前的事件流"
        @click="toggleReplay"
      >
        <UiIcon
          :name="replaying ? 'stop' : 'rewind'"
          :size="13"
        />
        {{ replaying ? '停止回放' : '时间回放' }}
      </button>
      <span
        class="stat source"
        data-testid="source-badge"
        :data-mode="sourceMode"
        :title="`数据源 ${sourceMode === 'live' ? 'USGS 实时（经 server/ 后端）' : '打包快照降级'} · 更新于 ${formatQuakeTime(sourceUpdatedAt, true)}${sourceDegraded ? ' · 最近一次轮询失败' : ''}`"
      >{{ sourceLabel }}</span>
    </header>

    <!-- 巡游分镜字幕（底部居中玻璃条） -->
    <div
      v-if="tourCaption"
      class="tour-caption tv-glass-panel"
      data-testid="tour-caption"
    >
      <b>{{ tourCaption.title }}</b>
      <span>{{ tourCaption.text }}</span>
    </div>

    <!-- 左侧：实时事件流 -->
    <aside
      v-if="ready"
      class="panel panel-left tv-glass-panel"
    >
      <div class="panel-head">
        <h3 class="panel-title">
          实时事件流
        </h3>
        <button
          class="mini-btn icon-only"
          data-testid="stream-toggle"
          :title="streaming ? '停止增量轮询' : `开启增量轮询（每 ${streamIntervalMs / 1000} 秒）`"
          :aria-label="streaming ? '停止增量轮询' : '开启增量轮询'"
          :aria-pressed="streaming"
          @click="toggleStream"
        >
          <UiIcon
            :name="streaming ? 'pause' : 'play'"
            :size="13"
          />
        </button>
        <button
          class="mini-btn"
          data-testid="simulate-btn"
          title="注入一条合成演练事件（非真实数据，用于演示与测试）"
          @click="onSimulate"
        >
          + 演练事件
        </button>
      </div>

      <div
        class="feed-list"
        data-testid="feed-list"
      >
        <button
          v-for="e in arrivedEvents"
          :key="e.id"
          class="feed-item"
          :class="{ active: selected?.id === e.id }"
          :data-testid="`feed-item-${e.id}`"
          :title="e.place"
          @click="selectEvent(e)"
        >
          <span
            class="level-dot"
            :style="{ background: LEVELS[e.level].color }"
          />
          <span class="feed-main">
            <span class="feed-title">M{{ formatMag(e.mag) }} · {{ LEVELS[e.level].label }}</span>
            <span class="feed-sub">{{ formatQuakeTime(e.time) }} · {{ e.place }}</span>
          </span>
          <span
            class="status-badge"
            :data-status="e.status"
          >{{ STATUS_LABEL[e.status] }}</span>
        </button>
        <p
          v-if="arrivedEvents.length === 0"
          class="empty-tip"
        >
          暂无事件，点击「+ 演练事件」注入一条。
        </p>
      </div>
      <p class="list-meta">
        已接收 {{ arrivedEvents.length }} / 已加载 {{ events.length }} 条 ·
        {{ streaming ? `每 ${streamIntervalMs / 1000}s 轮询增量` : '轮询已停' }} ·
        <button
          class="link-btn"
          data-testid="reset-drill"
          title="清空处置记录，全部回到未处理"
          @click="onResetDrill"
        >
          重置处置
        </button>
      </p>
    </aside>

    <!-- 右侧：详情与处置 -->
    <aside
      v-if="ready"
      class="panel panel-right tv-glass-panel"
    >
      <template v-if="selected">
        <h3 class="panel-title">
          事件详情
          <span
            class="status-badge big"
            :data-status="selected.status"
            data-testid="detail-status"
          >{{ STATUS_LABEL[selected.status] }}</span>
        </h3>
        <dl class="metrics">
          <div class="metric">
            <dt>震级</dt>
            <dd data-testid="detail-mag">
              M{{ formatMag(selected.mag) }}（{{ LEVELS[selected.level].label }}）
            </dd>
          </div>
          <div class="metric">
            <dt>发震时刻</dt>
            <dd>{{ formatQuakeTime(selected.time, true) }}</dd>
          </div>
          <div class="metric">
            <dt>震中坐标</dt>
            <dd>{{ selected.lat.toFixed(2) }}, {{ selected.lon.toFixed(2) }}</dd>
          </div>
          <div class="metric">
            <dt>震源深度</dt>
            <dd>{{ selected.depth }} km</dd>
          </div>
        </dl>

        <p class="place-line">
          {{ selected.place }}
          <a
            v-if="selected.url"
            :href="selected.url"
            target="_blank"
            rel="noopener"
          >USGS 详情</a>
        </p>

        <p class="group-label">
          处置
        </p>
        <div class="actions">
          <button
            v-if="selected.status === 'open'"
            class="mini-btn primary"
            data-testid="act-processing"
            @click="setStatus(selected.id, 'processing')"
          >
            开始处理
          </button>
          <button
            v-if="selected.status !== 'resolved'"
            class="mini-btn primary"
            data-testid="act-resolve"
            @click="setStatus(selected.id, 'resolved')"
          >
            标记已处置
          </button>
          <button
            v-if="selected.status !== 'open'"
            class="mini-btn"
            data-testid="act-reopen"
            @click="setStatus(selected.id, 'open')"
          >
            重新打开
          </button>
        </div>
      </template>
      <div
        v-else
        class="empty-state"
      >
        <UiIcon
          class="empty-icon"
          name="activity"
          :size="26"
        />
        <p class="empty-state-title">
          未选择事件
        </p>
        <p class="empty-tip">
          点击左侧事件流或地球上的标记查看详情并处置。
        </p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { loadCesium } from '../map/cesiumLoader'
import { createMapViewer } from '../map/createViewer'
import { useEarthquakeFeed, LEVELS, STATUS_LABEL, formatQuakeTime, formatMag } from '../map/monitor/useEarthquakeFeed'
import type { QuakeEvent, QuakeStatus } from '../map/monitor/useEarthquakeFeed'
import { useTourEngine } from '../composables/useTourEngine'
import type { TourStep } from '../composables/useTourEngine'
import UiIcon from '../components/UiIcon'

const containerRef = ref<HTMLElement | null>(null)
const ready = ref(false)
const loadError = ref('')
const selected = ref<QuakeEvent | null>(null)
const params = new URLSearchParams(window.location.search)
// ?poll=<ms> 与 ?nostream / ?tour-dwell 同惯例：把 30s 轮询压短，让增量用例不必真等半分钟
const streamIntervalMs = Number(params.get('poll')) || 30_000
const noStream = params.has('nostream')

const {
  events,
  arrivedEvents,
  stats,
  threshold,
  setThreshold,
  streaming,
  replaying,
  sourceMode,
  sourceUpdatedAt,
  sourceDegraded,
  startReplay,
  stopReplay,
  load,
  injectSimEvent,
  startStream,
  stopStream,
  setStatus: setEventStatus,
  resetDrill,
} = useEarthquakeFeed({ initialCount: 10, streamIntervalMs })
const unresolvedCount = computed(() => arrivedEvents.value.filter((e) => e.status !== 'resolved').length)
const sourceLabel = computed(() => {
  if (sourceMode.value === 'snapshot') return '打包快照'
  return sourceDegraded.value ? 'USGS 链路中断' : 'USGS 实时'
})

// 巡游大屏(K3)复用全局巡游引擎(X1):未处置事件序列 → 纯相机分镜
const tour = useTourEngine({
  flyTo: (lon: number, lat: number, durationMs = 1400) => {
    viewer?.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(lon, lat, 450_000),
      duration: durationMs / 1000,
    })
  },
})
const tourStatus = tour.status
const tourCaption = tour.caption

function buildTourRoute() {
  const targets = arrivedEvents.value.filter((e) => e.status !== 'resolved')
  return {
    steps: targets.map((e) => ({
      camera: { lon: e.lon, lat: e.lat },
      flyDuration: 1400,
      dwell: 2600,
      caption: { title: `M${formatMag(e.mag)} · ${LEVELS[e.level].label}`, text: `${formatQuakeTime(e.time)} · 深度 ${e.depth}km` },
      eventId: e.id,
    })),
  }
}

function toggleTour() {
  if (tour.status.value === 'idle') {
    const route = buildTourRoute()
    if (!route.steps.length) return
    tour.start(route, 0)
  } else if (tour.status.value === 'paused') {
    tour.play() // 步进浏览过的路线,从这里继续播
  } else {
    tour.stop()
  }
}

function stepTour() {
  if (tour.status.value === 'idle') {
    const route = buildTourRoute()
    if (!route.steps.length) return
    tour.loadAt(route, 0)
    return
  }
  tour.next()
}

// 分镜推进时同步左侧选中(巡游联动详情卡)
watch(
  () => tour.route.value?.steps[tour.stepIndex.value],
  (step) => {
    const eventId = (step as (TourStep & { eventId?: string }) | undefined)?.eventId
    if (eventId != null) {
      const ev = events.value.find((x) => x.id === eventId)
      if (ev) selected.value = ev
    }
  }
)

// 事件流回退(回放/重置演练)后,选中项可能已不在列表与地图上——
// 详情卡不能指向幽灵事件,否则「开始处理」会把状态写进一条看不见的记录
watch(arrivedEvents, (list) => {
  if (selected.value && !list.some((e) => e.id === selected.value?.id)) selected.value = null
})

function toggleStream() {
  if (streaming.value) stopStream()
  else startStream()
}

function onResetDrill() {
  tour.stop()
  resetDrill()
  syncMarkers()
  frameGlobal()
}

// ---- 阈值告警(K2) ----
function onThresholdChange(e: Event) {
  setThreshold(Number((e.target as HTMLInputElement).value))
  syncMarkers()
}

// ---- 巡游大屏(K3)已迁移至 useTourEngine(X1) ----

// ---- 时间回放(K4):按发震时间升序重放 ----
function toggleReplay() {
  if (replaying.value) {
    stopReplay()
    syncMarkers()
    return
  }
  tour.stop()
  startReplay((e) => {
    selected.value = e
    syncMarkers()
  }, 300)
}

let viewer: any = null
let markerEntities = new Map<string, any>() // eventId → Cesium.Entity
let handler: any = null

const GLOBAL_VIEW = { lon: 104, lat: 33, height: 7_500_000 }

const STATUS_COLORS: Record<QuakeStatus, string | null> = { open: null, processing: '#42a5f5', resolved: '#9e9e9e' }

function markerColorFor(e: QuakeEvent) {
  const Cesium = window.Cesium
  if (e.status === 'resolved') return Cesium.Color.fromCssColorString(STATUS_COLORS.resolved)
  if (e.status === 'processing') return Cesium.Color.fromCssColorString(STATUS_COLORS.processing)
  return Cesium.Color.fromCssColorString(LEVELS[e.level].color)
}

function addMarker(e: QuakeEvent) {
  const Cesium = window.Cesium
  const color = markerColorFor(e)
  const entity = viewer.entities.add({
    id: `eq_${e.id}`,
    position: Cesium.Cartesian3.fromDegrees(e.lon, e.lat),
    point: {
      pixelSize: Math.min(22, 8 + e.mag * 1.8),
      color,
      outlineWidth: 2,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: `M${formatMag(e.mag)}`,
      font: '12px sans-serif',
      fillColor: Cesium.Color.WHITE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString('rgba(20,20,24,0.75)'),
      pixelOffset: new Cesium.Cartesian2(0, -16),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })
  markerEntities.set(e.id, entity)
  viewer.scene.requestRender()
}

function refreshMarker(e: QuakeEvent) {
  const entity = markerEntities.get(e.id)
  if (entity) {
    entity.point.color = markerColorFor(e)
    viewer.scene.requestRender()
  }
}

// 选中态在地图上要有落点:加粗描边换色,否则 200 个点里看不出详情卡说的是哪个
function applySelectionHighlight() {
  const Cesium = window.Cesium
  const selId = selected.value?.id
  for (const [id, entity] of markerEntities) {
    const isSel = id === selId
    entity.point.outlineColor = isSel ? Cesium.Color.fromCssColorString('#4f8ef7') : Cesium.Color.WHITE.withAlpha(0.8)
    entity.point.outlineWidth = isSel ? 4 : 2
  }
  viewer?.scene.requestRender()
}
watch(selected, applySelectionHighlight)

function onSimulate() {
  injectSimEvent()
  syncMarkers()
}

function syncMarkers() {
  const arrivedIds = new Set(arrivedEvents.value.map((e) => e.id))
  // 清理已回退事件的标记(时间回放/重置演练会重置 arrived)
  for (const [id, entity] of markerEntities) {
    if (!arrivedIds.has(id)) {
      viewer.entities.remove(entity)
      markerEntities.delete(id)
    }
  }
  for (const e of arrivedEvents.value) {
    if (!markerEntities.has(e.id)) addMarker(e)
    else refreshMarker(e)
  }
  // 重建过的实体拿的是默认描边,选中态要再落一次
  applySelectionHighlight()
}

function frameGlobal() {
  viewer?.camera.flyTo({
    destination: window.Cesium.Cartesian3.fromDegrees(GLOBAL_VIEW.lon, GLOBAL_VIEW.lat, GLOBAL_VIEW.height),
    duration: 1.2,
  })
}

function selectEvent(e: QuakeEvent) {
  selected.value = e
  viewer.camera.flyTo({
    destination: window.Cesium.Cartesian3.fromDegrees(e.lon, e.lat, 450_000),
    duration: 1.4,
  })
}

function setStatus(id: string, status: QuakeStatus) {
  setEventStatus(id, status)
  const e = events.value.find((x) => x.id === id)
  if (e) refreshMarker(e)
}

onMounted(async () => {
  try {
    await load()
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value, {
      mode: 'img',
      view: GLOBAL_VIEW,
      // 全球视角高于影像门控(150 万米),不压暗就是天地图矢量的大面积米白——
      // 深色玻璃面板压在其上,首屏观感等于「地图没加载出来」(KNOWN_PITFALLS D3)
      dimBaseAtHighAltitude: true,
      // 监控页是长期挂着的看板,空闲时没必要 60fps 烧 GPU
      idleRender: true,
    })
    for (const e of arrivedEvents.value) addMarker(e)

    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((e: any) => {
      const picked = viewer.scene.pick(e.position)
      const rawId = picked?.id?.id
      const eqId = typeof rawId === 'string' && rawId.startsWith('eq_') ? rawId.slice(3) : null
      if (eqId != null && markerEntities.has(eqId)) {
        const ev = events.value.find((x) => x.id === eqId)
        if (ev) selected.value = ev
      } else {
        selected.value = null // 点空白处取消选中,与列表侧心智一致
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    if (!noStream) startStream()
    ready.value = true
  } catch (err) {
    const msg = err instanceof Error && err.message.startsWith('[feed]') ? err.message.slice(6) : ''
    loadError.value = msg || '地图引擎加载失败，请刷新重试。'
    console.error('[monitor] 初始化失败:', err)
  }
})

onUnmounted(() => {
  stopStream()
  handler?.destroy()
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
})
</script>

<style scoped>
.monitor-view {
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

.stats-bar {
  position: absolute;
  top: 14px;
  /* 绝对定位只给 left:50% 时可用宽度只剩半屏,flex-wrap 会在半屏里提前换行;
     双侧 0 + fit-content 才能按内容收缩且整屏居中 */
  left: 0;
  right: 0;
  margin-inline: auto;
  width: fit-content;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
  row-gap: 8px;
  /* 只在视口真的装不下时换行；nowrap 保证单个统计项不被劈开 */
  max-width: calc(100vw - 32px);
  padding: 10px 22px;
  border-radius: 18px;
  font-size: var(--tv-fs-sm);
  white-space: nowrap;
}

.stats-title {
  font-weight: 700;
  font-size: var(--tv-fs-md);
  margin-right: 6px;
}

.stat {
  display: inline-flex;
  align-items: baseline;
  color: var(--tv-on-surface-variant);
}

.stat b {
  font-size: var(--tv-fs-lg);
  margin-left: 5px;
  font-weight: 700;
  color: var(--tv-on-surface);
  font-variant-numeric: tabular-nums;
}

.stat.warn {
  color: var(--tv-error);
}

.stat.warn b {
  color: var(--tv-error);
}

.threshold-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.8;
}

.threshold-row input {
  width: 46px;
  padding: 2px 4px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  text-align: center;
}

.panel {
  position: absolute;
  top: 70px;
  bottom: 20px;
  z-index: 10;
  width: 260px;
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
}

/* 统计条在窄屏换行成两行时给侧栏让位，避免压住面板头 */
@media (max-width: 900px) {
  .panel {
    top: 132px;
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

/* 标题与两个按钮同行：260px 面板宽已贴近上限，标题不设 nowrap 会被挤成两行 */
.panel-head .panel-title {
  margin: 0;
  flex: none;
  white-space: nowrap;
}

.panel-title {
  margin: 0 0 8px;
  font-size: 14px;
}

.feed-list {
  flex: 1;
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feed-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-md);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--tv-dur-fast) var(--tv-ease), background var(--tv-dur-fast) var(--tv-ease);
}

.feed-item:hover {
  border-color: var(--tv-primary);
}

.feed-item.active {
  border-color: var(--tv-primary);
  background: color-mix(in srgb, var(--tv-primary) 14%, transparent);
}

.level-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}

.feed-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.feed-title {
  font-size: 12px;
  font-weight: 600;
}

.feed-sub {
  font-size: 10px;
  opacity: 0.6;
  /* 真实数据的 place 是长英文地名，必须截断而不是撑破 260px 面板 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--tv-radius-full);
  border: 1px solid var(--tv-outline-variant);
  background: transparent;
  color: var(--tv-on-surface-variant);
  white-space: nowrap;
  flex: none;
}

/* 状态点用伪元素绘制（不产生文本节点，测试对徽标做精确文本断言） */
.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tv-on-surface-variant);
  flex: none;
}

.status-badge[data-status='open']::before {
  background: var(--tv-error);
}

.status-badge[data-status='open'] {
  border-color: color-mix(in srgb, var(--tv-error) 45%, transparent);
  color: var(--tv-error);
}

.status-badge[data-status='processing']::before {
  background: var(--tv-primary);
}

.status-badge[data-status='processing'] {
  border-color: color-mix(in srgb, var(--tv-primary) 45%, transparent);
  color: var(--tv-primary);
}

.status-badge[data-status='resolved']::before {
  background: var(--tv-success);
}

.status-badge[data-status='resolved'] {
  color: var(--tv-on-surface-variant);
}

.status-badge.big {
  font-size: var(--tv-fs-xs);
}

.metrics {
  margin: 0;
}

.metric {
  display: flex;
  justify-content: space-between;
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
}

.place-line {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--tv-on-surface-variant);
  overflow-wrap: anywhere;
}

.place-line a {
  color: var(--tv-primary);
  margin-left: 4px;
  white-space: nowrap;
}

.stat.source {
  font-size: var(--tv-fs-xs);
  padding: 2px 9px;
  border-radius: var(--tv-radius-full);
  border: 1px solid var(--tv-outline-variant);
  color: var(--tv-on-surface-variant);
}

.stat.source[data-mode='snapshot'] {
  border-color: color-mix(in srgb, var(--tv-warning) 55%, transparent);
  color: var(--tv-warning);
}

.group-label {
  margin: 12px 0 6px;
  font-size: 11px;
  opacity: 0.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 11px;
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-md);
  background: transparent;
  color: var(--tv-on-surface);
  font-size: var(--tv-fs-xs);
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--tv-dur-fast) var(--tv-ease), background var(--tv-dur-fast) var(--tv-ease),
    color var(--tv-dur-fast) var(--tv-ease);
}

.mini-btn:hover:not(:disabled) {
  border-color: var(--tv-primary);
  color: var(--tv-primary);
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.mini-btn.primary {
  background: var(--tv-primary);
  border-color: transparent;
  color: var(--tv-on-primary);
  font-weight: 600;
}

.mini-btn.icon-only {
  padding: 6px 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 12px;
  margin-top: 8px;
  text-align: center;
  border: 1px dashed var(--tv-outline-variant);
  border-radius: var(--tv-radius-lg);
}

.empty-icon {
  color: var(--tv-on-surface-variant);
  opacity: 0.7;
}

.empty-state-title {
  font-size: var(--tv-fs-sm);
  font-weight: 600;
  color: var(--tv-on-surface);
}

.empty-tip {
  font-size: var(--tv-fs-xs);
  opacity: 0.7;
  line-height: 1.6;
}

.list-meta {
  margin: 8px 0 0;
  font-size: 10px;
  opacity: 0.5;
}

.link-btn {
  border: none;
  padding: 0;
  background: transparent;
  color: var(--tv-primary, #4f8ef7);
  font-size: 10px;
  cursor: pointer;
  text-decoration: underline;
}

.link-btn:hover {
  opacity: 0.8;
}

.tour-caption {
  position: absolute;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 11;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  max-width: min(560px, calc(100vw - 32px));
  padding: 10px 22px;
  border-radius: var(--tv-radius-lg);
  text-align: center;
  pointer-events: none;
}

.tour-caption b {
  font-size: var(--tv-fs-md);
  font-weight: 700;
  color: var(--tv-on-surface);
}

.tour-caption span {
  font-size: var(--tv-fs-xs);
  color: var(--tv-on-surface-variant);
}
</style>
