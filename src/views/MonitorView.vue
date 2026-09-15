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
        @click="toggleTour"
      >
        {{ tourStatus === 'playing' ? '⏸ 停止巡游' : '▶ 巡游大屏' }}
      </button>
      <button
        class="mini-btn"
        data-testid="tour-step"
        title="步进到下一个未处置事件"
        @click="stepTour"
      >
        ⏭
      </button>
      <button
        class="mini-btn"
        data-testid="replay-btn"
        @click="toggleReplay"
      >
        {{ replaying ? '⏹ 停止回放' : '⏪ 时间回放' }}
      </button>
    </header>

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
          class="mini-btn"
          data-testid="stream-toggle"
          :title="streaming ? '停止自动推送' : '开启自动推送（每 7 秒一条）'"
          @click="toggleStream"
        >
          {{ streaming ? '⏸ 停止推送' : '▶ 开启推送' }}
        </button>
        <button
          class="mini-btn"
          data-testid="simulate-btn"
          :disabled="pendingCount === 0"
          title="模拟一条新事件推送"
          @click="onSimulate"
        >
          + 模拟
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
          @click="selectEvent(e)"
        >
          <span
            class="level-dot"
            :style="{ background: LEVELS[e.level].color }"
          />
          <span class="feed-main">
            <span class="feed-title">M{{ e.mag }} · {{ LEVELS[e.level].label }}</span>
            <span class="feed-sub">{{ e.date }} · 深度 {{ e.depth }}km</span>
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
          暂无事件，点击「+ 模拟」推送一条。
        </p>
      </div>
      <p class="list-meta">
        已接收 {{ arrivedEvents.length }} / 数据池 {{ events.length }} 条 ·
        {{ streaming ? `每 ${streamIntervalMs / 1000}s 自动推送` : '自动推送已停' }} ·
        <button
          class="link-btn"
          data-testid="reset-drill"
          title="清空处置记录，全部回到未处理"
          @click="onResetDrill"
        >
          重置演练
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
              M{{ selected.mag }}（{{ LEVELS[selected.level].label }}）
            </dd>
          </div>
          <div class="metric">
            <dt>发震时刻</dt>
            <dd>{{ selected.date }}</dd>
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
      <p
        v-else
        class="empty-tip"
      >
        点击左侧事件流或地球上的标记查看详情并处置。
      </p>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { loadCesium } from '../map/cesiumLoader.js'
import { createMapViewer } from '../map/createViewer.js'
import { useEarthquakeFeed, LEVELS, STATUS_LABEL } from '../map/monitor/useEarthquakeFeed.js'
import { useTourEngine } from '../composables/useTourEngine.js'

const containerRef = ref(null)
const ready = ref(false)
const loadError = ref('')
const selected = ref(null)
const streaming = ref(!new URLSearchParams(window.location.search).has('nostream'))
const streamIntervalMs = 7000
const pendingCount = computed(() => feedPool.value)

const {
  events,
  feed,
  arrivedEvents,
  stats,
  pendingPool,
  threshold,
  setThreshold,
  replaying,
  startReplay,
  stopReplay,
  load,
  simulateOne,
  startStream,
  stopStream,
  setStatus: setEventStatus,
  resetDrill,
} = useEarthquakeFeed({ initialCount: 10, streamIntervalMs })
const feedPool = ref(0)

// 巡游大屏(K3)复用全局巡游引擎(X1):未处置事件序列 → 纯相机分镜
const tour = useTourEngine({
  flyTo: (lon, lat, durationMs = 1400) => {
    viewer?.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(lon, lat, 450_000),
      duration: durationMs / 1000,
    })
  },
})
const tourStatus = tour.status

function buildTourRoute() {
  const targets = arrivedEvents.value.filter((e) => e.status !== 'resolved')
  return {
    steps: targets.map((e) => ({
      camera: { lon: e.lon, lat: e.lat },
      flyDuration: 1400,
      dwell: 2600,
      caption: { title: `M${e.mag} · ${LEVELS[e.level].label}`, text: `${e.date} · 深度 ${e.depth}km` },
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
    if (step?.eventId != null) {
      const ev = events.value.find((x) => x.id === step.eventId)
      if (ev) selected.value = ev
    }
  }
)

function toggleStream() {
  if (streaming.value) stopStream()
  else startStream()
  streaming.value = !streaming.value
}

function onResetDrill() {
  tour.stop()
  resetDrill()
  syncMarkers()
}

// ---- 阈值告警(K2) ----
function onThresholdChange(e) {
  setThreshold(e.target.value)
  syncMarkers()
}

// ---- 巡游大屏(K3)已迁移至 useTourEngine(X1) ----

// ---- 时间回放(K4):按发震时间升序重放 ----
function toggleReplay() {
  if (replaying.value) {
    stopReplay()
    return
  }
  tour.stop()
  syncMarkers()
  startReplay((e) => {
    selected.value = e
    syncMarkers()
  }, 300)
}

let viewer = null
let markerEntities = new Map() // eventId → Cesium.Entity
let handler = null
let poolTimer = null

const LEVEL_COLORS = { open: null, processing: '#42a5f5', resolved: '#9e9e9e' }

function markerColorFor(e) {
  const Cesium = window.Cesium
  if (e.status === 'resolved') return Cesium.Color.fromCssColorString(LEVEL_COLORS.resolved)
  if (e.status === 'processing') return Cesium.Color.fromCssColorString(LEVEL_COLORS.processing)
  return Cesium.Color.fromCssColorString(LEVELS[e.level].color)
}

function addMarker(e) {
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
      text: `M${e.mag}`,
      font: '12px sans-serif',
      fillColor: Cesium.Color.WHITE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString('rgba(20,20,24,0.75)'),
      pixelOffset: new Cesium.Cartesian2(0, -16),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })
  markerEntities.set(e.id, entity)
}

function refreshMarker(e) {
  const entity = markerEntities.get(e.id)
  if (entity) entity.point.color = markerColorFor(e)
}

function onSimulate() {
  if (simulateOne()) syncMarkers()
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
}

function selectEvent(e) {
  selected.value = e
  viewer.camera.flyTo({
    destination: window.Cesium.Cartesian3.fromDegrees(e.lon, e.lat, 450_000),
    duration: 1.4,
  })
}

function setStatus(id, status) {
  setEventStatus(id, status)
  const e = events.value.find((x) => x.id === id)
  if (e) refreshMarker(e)
}

onMounted(async () => {
  try {
    await load()
    feedPool.value = pendingPool.value.length
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value, {
      mode: 'img',
      view: { lon: 104, lat: 33, height: 7_500_000 },
    })
    for (const e of arrivedEvents.value) addMarker(e)

    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((e) => {
      const picked = viewer.scene.pick(e.position)
      const eqId = picked?.id?.id?.replace(/^eq_/, '')
      if (eqId != null && markerEntities.has(Number(eqId))) {
        const ev = events.value.find((x) => x.id === Number(eqId))
        if (ev) selected.value = ev
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    if (!new URLSearchParams(window.location.search).has('nostream')) startStream()
    poolTimer = setInterval(() => {
      feedPool.value = pendingPool.value.length
      // 数据层池空时会自动 stopStream,流状态文案须跟随(否则显示仍「推送中」)
      if (streaming.value && pendingPool.value.length === 0) streaming.value = false
    }, 1000)
    ready.value = true
  } catch (err) {
    loadError.value = '地图引擎加载失败，请刷新重试。'
    console.error('[monitor] 初始化失败:', err)
  }
})

onUnmounted(() => {
  stopStream()
  if (poolTimer) clearInterval(poolTimer)
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

.stats-bar {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 22px;
  border-radius: var(--tv-radius-full, 999px);
  font-size: 13px;
  white-space: nowrap;
}

.stats-title {
  font-weight: 700;
  margin-right: 6px;
}

.stat b {
  font-size: 16px;
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
}

.stat.warn {
  color: #ef5350;
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

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
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
  padding: 7px 8px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.feed-item:hover {
  border-color: var(--tv-primary, #4f8ef7);
}

.feed-item.active {
  border-color: var(--tv-primary, #4f8ef7);
  background: var(--tv-primary-fixed, rgba(79, 142, 247, 0.14));
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
}

.status-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(128, 128, 128, 0.2);
  white-space: nowrap;
  flex: none;
}

.status-badge[data-status='open'] {
  color: #ef5350;
  background: rgba(239, 83, 80, 0.15);
}

.status-badge[data-status='processing'] {
  color: #42a5f5;
  background: rgba(66, 165, 245, 0.15);
}

.status-badge[data-status='resolved'] {
  color: #9e9e9e;
  background: rgba(158, 158, 158, 0.18);
}

.status-badge.big {
  font-size: 11px;
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
  padding: 6px 10px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.mini-btn:hover:not(:disabled) {
  border-color: var(--tv-primary, #4f8ef7);
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.mini-btn.primary {
  background: var(--tv-primary, #4f8ef7);
  border-color: transparent;
  color: var(--tv-on-primary, #fff);
  font-weight: 600;
}

.empty-tip {
  font-size: 11px;
  opacity: 0.55;
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
</style>
