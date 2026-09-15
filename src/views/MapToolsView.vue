<template>
  <div class="tools-view">
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

    <!-- 左侧：工具箱 -->
    <aside
      v-if="ready"
      class="panel panel-left tv-glass-panel"
    >
      <h3 class="panel-title">
        地图工具箱
      </h3>

      <p class="group-label">
        量测
      </p>
      <div class="tool-grid">
        <button
          v-for="tool in measureTools"
          :key="tool.key"
          class="tool-item"
          :class="{ active: activeTool === tool.key }"
          :data-tool="tool.key"
          :title="tool.desc"
          @click="toggleTool(tool.key)"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span>{{ tool.label }}</span>
        </button>
      </div>

      <p class="group-label">
        标绘
      </p>
      <div class="tool-grid">
        <button
          v-for="tool in drawTools"
          :key="tool.key"
          class="tool-item"
          :class="{ active: activeTool === tool.key }"
          :data-tool="tool.key"
          :title="tool.desc"
          @click="toggleTool(tool.key)"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span>{{ tool.label }}</span>
        </button>
      </div>

      <div class="tool-actions">
        <button
          class="mini-btn"
          data-testid="undo-btn"
          :disabled="registryCount === 0"
          @click="controller?.undoLast()"
        >
          撤销
        </button>
        <button
          class="mini-btn danger"
          data-testid="clear-btn"
          :disabled="registryCount === 0"
          @click="controller?.clearAll()"
        >
          清空标注（{{ registryCount }}）
        </button>
      </div>
    </aside>

    <!-- 右侧：书签与导出 -->
    <aside
      v-if="ready"
      class="panel panel-right tv-glass-panel"
    >
      <h3 class="panel-title">
        书签与导出
      </h3>

      <button
        class="mini-btn primary"
        data-testid="bookmark-add"
        @click="saveBookmark"
      >
        ★ 保存当前视角
      </button>

      <div
        v-if="bookmarks.length"
        class="bookmark-list"
        data-testid="bookmark-list"
      >
        <div
          v-for="bm in bookmarks"
          :key="bm.id"
          class="bookmark-item"
        >
          <button
            class="bookmark-goto"
            :title="`${bm.lat}, ${bm.lon} · ${bm.height}m`"
            @click="gotoBookmark(bm)"
          >
            {{ bm.name }}
          </button>
          <button
            class="bookmark-del"
            title="删除"
            @click="deleteBookmark(bm.id)"
          >
            ×
          </button>
        </div>
      </div>
      <p
        v-else
        class="empty-tip"
      >
        暂无书签。调整视角后点「保存当前视角」。
      </p>

      <p class="group-label">
        底图
      </p>
      <div class="tool-actions">
        <button
          class="mini-btn"
          :class="{ primary: baseType === 'img' }"
          data-testid="base-img"
          @click="setBase('img')"
        >
          卫星影像
        </button>
        <button
          class="mini-btn"
          :class="{ primary: baseType === 'vec' }"
          data-testid="base-vec"
          @click="setBase('vec')"
        >
          矢量地图
        </button>
      </div>

      <p class="group-label">
        导出
      </p>
      <div class="tool-actions">
        <button
          class="mini-btn"
          data-testid="export-geojson"
          :disabled="registryCount === 0"
          @click="exportGeoJSON"
        >
          标注 → GeoJSON
        </button>
        <button
          class="mini-btn"
          data-testid="export-png"
          @click="exportPNG"
        >
          地图截图
        </button>
      </div>
    </aside>

    <!-- 底部状态栏 -->
    <footer
      v-if="ready"
      class="status-bar tv-glass-panel"
    >
      <span
        class="status-coords"
        data-testid="status-coords"
      >
        {{ coordsText }}
      </span>
      <span
        class="status-main"
        data-testid="status-result"
      >{{ resultText }}</span>
      <span
        class="status-hint"
        data-testid="status-hint"
      >{{ hintText }}</span>
    </footer>

    <!-- 调试角标（?debug=1） -->
    <div
      v-if="debug && ready"
      class="debug-hud"
      data-testid="debug-hud"
    >
      DEBUG · 相机高度 {{ debugInfo.height }}m · 瓦片队列 {{ debugInfo.pending }} · 图层
      {{ debugInfo.layers }} · 底图 {{ baseType }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { loadCesium } from '../map/cesiumLoader.js'
import { createMapViewer, applyTdtStack } from '../map/createViewer.js'
import { MapToolsController } from '../map/tools/mapToolsController.js'
import { loadBookmarks, addBookmark, removeBookmark, flyToBookmark } from '../map/bookmarks.js'

const containerRef = ref(null)
const ready = ref(false)
const loadError = ref('')
const activeTool = ref(null)
const registryCount = ref(0)
const bookmarks = ref(loadBookmarks())
const status = ref({ coords: null, hint: '', result: null })

const measureTools = [
  { key: 'distance', label: '量距离', icon: '📏', desc: '测地线距离' },
  { key: 'area', label: '量面积', icon: '⬛', desc: '多边形面积' },
]
const drawTools = [
  { key: 'point', label: '标点', icon: '📍', desc: '放置标注点' },
  { key: 'line', label: '标线', icon: '〰️', desc: '绘制折线' },
  { key: 'polygon', label: '标面', icon: '⬟', desc: '绘制多边形' },
]

let viewer = null
let controller = null
const baseType = ref('vec')
// ?debug=1 时的自诊断角标：让页面自己报告相机高度/瓦片队列/图层状态，
// 用于远程排查「用户浏览器里地图不可见」类问题
const debug = ref(new URLSearchParams(window.location.search).has('debug'))
const debugInfo = ref({ height: 0, pending: 0, layers: 0 })
let debugTimer = null

function setBase(type) {
  if (!viewer || baseType.value === type) return
  applyTdtStack(viewer, type)
  baseType.value = type
  // applyTdtStack 会整组重建图层 provider,瓦片错误监听须对新 provider 重挂
  if (debug.value) attachTileErrorWatch()
}

/**
 * 瓦片错误计数挂到每个 imagery provider 的 errorEvent 上。
 * ⚠ 不能用 Cesium.TileProviderError.addEventListener——1.142 里它是类而非
 * 事件(无 addEventListener),调用即 TypeError,曾静默中断整个 debug 块,
 * HUD 恒显 0 且无任何报错(2026-09-15 审查 P1)。
 */
function attachTileErrorWatch() {
  if (!viewer || !window.__tvMapDebug) return
  const n = viewer.imageryLayers.length
  for (let i = 0; i < n; i++) {
    const prov = viewer.imageryLayers.get(i).imageryProvider
    prov.errorEvent?.addEventListener((err) => {
      window.__tvMapDebug.tileErrors = (window.__tvMapDebug.tileErrors || 0) + 1
      window.__tvMapDebug.lastTileError = String(err?.message || err).slice(0, 200)
    })
  }
}

const coordsText = computed(() => {
  const c = status.value.coords
  return c ? `${c.lat.toFixed(4)}, ${c.lon.toFixed(4)} · ${Math.max(0, c.height).toFixed(0)}m` : '移动鼠标查看坐标'
})
const hintText = computed(() => status.value.hint || '')
const resultText = computed(() => status.value.result?.text || '')

// 按钮高亮以 controller 广播为准(单一事实源):工具结束/Esc 取消时
// controller 侧状态归 null,若 View 另持一份 ref 会出现高亮脱钩(审查 P1)
function toggleTool(key) {
  if (!controller) return
  controller.setTool(controller.activeTool === key ? null : key)
}

function saveBookmark() {
  if (!viewer) return
  const bm = addBookmark(viewer.camera)
  bookmarks.value = loadBookmarks()
  status.value = { ...status.value, result: { text: `已保存「${bm.name}」` } }
}

function deleteBookmark(id) {
  bookmarks.value = removeBookmark(id)
}

function gotoBookmark(bm) {
  if (viewer) flyToBookmark(viewer.camera, bm)
}

function exportGeoJSON() {
  if (!controller || registryCount.value === 0) return
  download(
    JSON.stringify(controller.toGeoJSON(), null, 2),
    `terra-map-${Date.now()}.geojson`,
    'application/geo+json'
  )
}

function exportPNG() {
  if (!viewer) return
  viewer.render()
  viewer.canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    download(null, `terra-map-${Date.now()}.png`, 'image/png', url)
    URL.revokeObjectURL(url)
  })
}

function download(content, filename, mime, objectUrl = null) {
  const a = document.createElement('a')
  a.download = filename
  a.href = objectUrl || URL.createObjectURL(new Blob([content], { type: mime }))
  // 必须挂到 DOM 再点击：游离锚点的下载会让部分环境的导航调度器挂起
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (!objectUrl) setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

onMounted(async () => {
  try {
    const Cesium = await loadCesium()
    if (!containerRef.value) return
    viewer = createMapViewer(Cesium, containerRef.value)
    controller = new MapToolsController(Cesium, viewer, {
      onStatus: (patch) => {
        status.value = { ...status.value, ...patch }
      },
      onRegistryChange: (registry) => {
        registryCount.value = registry.length
      },
      onToolChange: (tool) => {
        activeTool.value = tool
      },
    })
    ready.value = true
    loadError.value = ''

    if (debug.value) {
      // 调试钩子:探针可读取渲染器真实状态(画布像素/瓦片错误计数)。
      // 独立 try 包裹:诊断设施自身失效不应伪装成页面初始化失败
      try {
        window.__tvMapDebug = { viewer, Cesium }
        attachTileErrorWatch()
        viewer.scene.globe.tileLoadProgressEvent.addEventListener((queueLen) => {
          debugInfo.value.pending = queueLen
        })
        debugTimer = setInterval(() => {
          const carto = viewer.camera.positionCartographic
          debugInfo.value.height = Math.round(carto.height)
          debugInfo.value.layers = viewer.imageryLayers.length
        }, 500)
      } catch (dbgErr) {
        console.warn('[map-tools] 调试 HUD 初始化失败:', dbgErr)
      }
    }
  } catch (err) {
    loadError.value = '地图引擎加载失败，请刷新重试。'
    console.error('[map-tools] init error:', err)
  }
})

onUnmounted(() => {
  controller?.destroy()
  if (debugTimer) clearInterval(debugTimer)
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
})
</script>

<style scoped>
.tools-view {
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
  width: 210px;
  padding: 14px;
  border-radius: 14px;
  max-height: calc(100% - 110px);
  overflow: auto;
}

.panel-left {
  left: 16px;
}

.panel-right {
  right: 16px;
}

.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
}

.group-label {
  margin: 12px 0 6px;
  font-size: 11px;
  opacity: 0.6;
}

.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
}

.tool-item:hover {
  border-color: var(--tv-primary, #4f8ef7);
}

.tool-item.active {
  border-color: var(--tv-primary, #4f8ef7);
  background: var(--tv-primary-fixed, rgba(79, 142, 247, 0.12));
}

.tool-icon {
  font-size: 16px;
}

.tool-actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.mini-btn {
  flex: 1;
  padding: 6px 8px;
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
  width: 100%;
  background: var(--tv-primary, #4f8ef7);
  border-color: transparent;
  color: var(--tv-on-primary, #fff);
  font-weight: 600;
}

.mini-btn.danger:hover:not(:disabled) {
  border-color: #e57373;
  color: #e57373;
}

.bookmark-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bookmark-item {
  display: flex;
  gap: 4px;
}

.bookmark-goto {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-goto:hover {
  border-color: var(--tv-primary, #4f8ef7);
}

.bookmark-del {
  border: none;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  font-size: 14px;
}

.bookmark-del:hover {
  opacity: 1;
  color: #e57373;
}

.empty-tip {
  margin: 8px 0 0;
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.5;
}

.status-bar {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 18px;
  max-width: calc(100% - 32px);
  padding: 8px 18px;
  border-radius: var(--tv-radius-full, 999px);
  font-size: 12px;
  white-space: nowrap;
}

.status-coords {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.status-main {
  font-weight: 600;
}

.status-hint {
  opacity: 0.6;
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
