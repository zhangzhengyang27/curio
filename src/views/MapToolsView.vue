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

      <!-- 地名搜索(M1):天地图搜索 V2.0,失败静默降级为提示 -->
      <div class="place-search">
        <input
          v-model="placeQuery"
          class="place-input"
          data-testid="place-search"
          placeholder="搜索地名,回车定位…"
          @keyup.enter="searchPlace"
        >
        <ul
          v-if="placeResults.length"
          class="place-list"
          data-testid="place-results"
        >
          <li
            v-for="(p, i) in placeResults"
            :key="i"
            class="place-item"
            :data-testid="`place-item-${i}`"
            :title="p.displayName || p.name"
            @click="flyToPlace(p)"
          >
            {{ p.name }}
          </li>
        </ul>
        <p
          v-if="placeHint"
          class="place-hint"
          data-testid="place-hint"
        >
          {{ placeHint }}
        </p>
      </div>

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

      <!-- 编辑面板(M2):选中已绘产物后出现 -->
      <template v-if="editingEntry">
        <p class="group-label">
          编辑:{{ editingEntry.kind }}
        </p>
        <div
          class="edit-panel"
          data-testid="edit-panel"
        >
          <div class="color-row">
            <button
              v-for="c in EDIT_COLORS"
              :key="c"
              class="color-swatch"
              :data-testid="`edit-color-${c}`"
              :style="{ background: c }"
              :title="c"
              @click="applyStyle({ colorCss: c })"
            />
          </div>
          <label class="width-row">
            线宽
            <input
              type="range"
              min="1"
              max="8"
              :value="editingEntry.style?.width ?? 3"
              data-testid="edit-width"
              @input="applyStyle({ width: Number($event.target.value) })"
            >
          </label>
          <button
            class="mini-btn danger"
            data-testid="edit-delete"
            @click="deleteSelected"
          >
            删除此标注
          </button>
          <p class="place-hint">
            拖拽白色顶点调整形状,Esc 或点空白退出编辑
          </p>
        </div>
      </template>

      <!-- 量测记录(M5):随撤销/删除自动同步 -->
      <template v-if="records.length">
        <p class="group-label">
          量测记录({{ records.length }})
        </p>
        <ul
          class="measure-list"
          data-testid="measure-records"
        >
          <li
            v-for="(r, i) in records"
            :key="i"
            class="measure-item"
          >
            <span>{{ r.kind === 'distance' ? '📏' : '⬛' }}</span>
            <span class="measure-text">{{ r.text }}</span>
          </li>
        </ul>
        <div class="tool-actions">
          <button
            class="mini-btn"
            data-testid="export-records"
            @click="exportRecordsCsv"
          >
            记录 → CSV
          </button>
        </div>
      </template>
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
          <template v-if="renamingId === bm.id">
            <input
              v-model="renameText"
              class="place-input"
              :data-testid="`rename-input-${bm.id}`"
              @keyup.enter="commitRename(bm.id)"
              @blur="commitRename(bm.id)"
            >
          </template>
          <template v-else>
            <button
              class="bookmark-goto"
              :title="`${bm.lat}, ${bm.lon} · ${bm.height}m`"
              @click="gotoBookmark(bm)"
            >
              {{ bm.name }}
            </button>
            <button
              class="bookmark-del"
              title="重命名"
              data-testid="bookmark-rename"
              @click="startRename(bm)"
            >
              ✎
            </button>
            <button
              class="bookmark-del"
              title="删除"
              @click="deleteBookmark(bm.id)"
            >
              ×
            </button>
          </template>
        </div>
      </div>
      <p
        v-else
        class="empty-tip"
      >
        暂无书签。调整视角后点「保存当前视角」。
      </p>

      <!-- 书签导出/导入(M4) -->
      <div class="tool-actions">
        <button
          class="mini-btn"
          data-testid="export-bookmarks"
          :disabled="bookmarks.length === 0"
          @click="exportBmJson"
        >
          书签 → JSON
        </button>
        <button
          class="mini-btn"
          data-testid="import-bookmarks"
          @click="bmInputRef?.click()"
        >
          导入书签
        </button>
        <input
          ref="bmInputRef"
          class="import-input"
          type="file"
          accept=".json,application/json"
          data-testid="import-bookmarks-input"
          @change="onImportBookmarks"
        >
      </div>

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
          data-testid="import-geojson"
          @click="importInputRef?.click()"
        >
          导入 GeoJSON
        </button>
        <button
          class="mini-btn"
          data-testid="export-png"
          @click="exportPNG"
        >
          地图截图
        </button>
        <input
          ref="importInputRef"
          class="import-input"
          type="file"
          accept=".geojson,.json,application/geo+json"
          data-testid="import-geojson-input"
          @change="onImportFile"
        >
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
import { loadBookmarks, addBookmark, removeBookmark, renameBookmark, exportBookmarks, importBookmarks, flyToBookmark } from '../map/bookmarks.js'

const containerRef = ref(null)
const ready = ref(false)
const loadError = ref('')
const activeTool = ref(null)
const registryCount = ref(0)
const bookmarks = ref(loadBookmarks())
const status = ref({ coords: null, hint: '', result: null })
const importInputRef = ref(null)
const bmInputRef = ref(null)
const records = ref([])
const editingEntry = ref(null)
const renamingId = ref(null)
const renameText = ref('')
// 编辑面板可选颜色(M2)
const EDIT_COLORS = ['#4fc3f7', '#aed581', '#ff8a65', '#ba68c8', '#ffd54f', '#e57373']

const measureTools = [
  { key: 'distance', label: '量距离', icon: '📏', desc: '测地线距离' },
  { key: 'area', label: '量面积', icon: '⬛', desc: '多边形面积' },
]

// ---- 地名搜索(M1):三通道——天地图 V2.0 优先(个人认证暂无权限 404,企业认证后
//      自动恢复)→ 高德 Web 服务兜底(国内可达、CORS 开放、个人免费;返回 GCJ-02
//      坐标,经纠偏转 WGS-84)→ OpenStreetMap Nominatim(免认证最后兜底,当前网络
//      环境不可达,保留通道)。key 只经 env 注入;全部失败时仅提示,不阻塞其它工具。 ----
const TDT_KEY = (import.meta.env.VITE_TDT_TOKEN || '').split(',')[0].trim()
const AMAP_KEY = (import.meta.env.VITE_AMAP_KEY || '').trim()
const placeQuery = ref('')
const placeResults = ref([])
const placeHint = ref('')

async function fetchJson(url, timeoutMs = 8000) {
  // 超时兜底:跨域请求偶发挂起时也能落到降级提示
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`搜索服务响应 ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function searchTdt(q) {
  const postStr = JSON.stringify({
    keyWord: q,
    level: 12,
    mapBound: '73.5,18,135,53.5', // 中国范围
    queryType: 1, // 普通搜索
    start: 0,
    count: 10,
  })
  const data = await fetchJson(
    `https://api.tianditu.gov.cn/search?postStr=${encodeURIComponent(postStr)}&type=query&tk=${TDT_KEY}`
  )
  const pois = Array.isArray(data.pois) ? data.pois : []
  return pois
    .slice(0, 8)
    .map((p) => {
      const [lon, lat] = String(p.lonlat || '').split(',').map(Number)
      return { name: p.name, lon, lat }
    })
    .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
}

/** GCJ-02(高德/火星坐标)→ WGS-84 近似逆变换:误差米级,演示场景足够 */
function gcj02ToWgs84(lon, lat) {
  // 纠偏只对中国大陆范围有意义,境外坐标原样返回
  if (lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271) {
    return { lon, lat }
  }
  const a = 6378245.0
  const ee = 0.006693421622965943 // 克拉索夫斯基椭球第一偏心率平方(double 精度截断)
  const transformLat = (x, y) => {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
    return ret
  }
  const transformLon = (x, y) => {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
    return ret
  }
  const radLat = (lat / 180.0) * Math.PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  let dLat = transformLat(lon - 105.0, lat - 35.0)
  let dLon = transformLon(lon - 105.0, lat - 35.0)
  dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI)
  dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI)
  return { lon: lon - dLon, lat: lat - dLat }
}

async function searchAmap(q) {
  const data = await fetchJson(
    `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(q)}&offset=8&page=1&key=${AMAP_KEY}`
  )
  // INVALID_USER_KEY/配额超限等业务错误按通道失败处理,交给下一个通道
  if (data.status !== '1') throw new Error(String(data.info || 'amap error'))
  const pois = Array.isArray(data.pois) ? data.pois : []
  return pois
    .map((p) => {
      const [gcjLon, gcjLat] = String(p.location || '').split(',').map(Number)
      if (!Number.isFinite(gcjLon) || !Number.isFinite(gcjLat)) return null
      const wgs = gcj02ToWgs84(gcjLon, gcjLat)
      const region = [p.pname, p.cityname === p.pname ? '' : p.cityname, p.adname].filter(Boolean).join(' ')
      return {
        name: p.name,
        displayName: region ? `${p.name}（${region}）` : p.name,
        lon: +wgs.lon.toFixed(6),
        lat: +wgs.lat.toFixed(6),
      }
    })
    .filter(Boolean)
    .slice(0, 8)
}

async function searchNominatim(q) {
  // 公共实例限 1 请求/秒(演示调用频率远低于此);accept-language 优先返回中文名
  const data = await fetchJson(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=8&accept-language=zh-CN`
  )
  if (!Array.isArray(data)) return []
  return data
    .map((r) => ({
      name: r.name || String(r.display_name || '').split(',')[0],
      displayName: r.display_name,
      lon: +r.lon,
      lat: +r.lat,
    }))
    .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
    .slice(0, 8)
}

async function searchPlace() {
  const q = placeQuery.value.trim()
  if (!q) return
  placeResults.value = []
  placeHint.value = ''
  const channels = [
    TDT_KEY && (() => searchTdt(q)),
    AMAP_KEY && (() => searchAmap(q)),
    () => searchNominatim(q),
  ].filter(Boolean)
  let found = []
  let attempted = 0
  let errored = 0
  for (const run of channels) {
    attempted++
    try {
      found = await run()
      if (found.length) break
    } catch {
      errored++
    }
  }
  if (found.length) {
    placeResults.value = found
  } else {
    placeHint.value =
      errored === attempted ? '地名搜索服务不可用，请稍后再试' : `没有找到「${q}」相关地名`
  }
}

function flyToPlace(p) {
  if (!viewer) return
  viewer.camera.flyTo({
    destination: window.Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 80_000),
    duration: 1.6,
  })
}
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

function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // 允许连续导入同一文件
  if (!file || !controller) return
  file
    .text()
    .then((text) => JSON.parse(text))
    .then((gj) => {
      const n = controller.importGeoJSON(gj)
      records.value = controller.records
      status.value = {
        ...status.value,
        result: { text: n > 0 ? `已导入 ${n} 条标注` : '未识别到可导入的标注' },
      }
    })
    .catch(() => {
      status.value = { ...status.value, result: { text: '导入失败：文件不是合法 JSON' } }
    })
}

// ---- 标绘编辑(M2) ----
function applyStyle(patch) {
  controller?.setSelectedStyle(patch)
}

function deleteSelected() {
  controller?.deleteSelected()
  records.value = controller?.records ?? []
}

// ---- 书签增强(M4) ----
function startRename(bm) {
  renamingId.value = bm.id
  renameText.value = bm.name
}

function commitRename(id) {
  if (renamingId.value !== id) return
  bookmarks.value = renameBookmark(id, renameText.value)
  renamingId.value = null
}

function exportBmJson() {
  download(exportBookmarks(), `terra-bookmarks-${Date.now()}.json`, 'application/json')
}

function onImportBookmarks(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  file.text().then((text) => {
    const { list, imported } = importBookmarks(text)
    bookmarks.value = list
    status.value = {
      ...status.value,
      result: { text: imported > 0 ? `已导入 ${imported} 条书签` : '未发现可导入的新书签' },
    }
  })
}

// ---- 量测记录导出(M5) ----
function exportRecordsCsv() {
  const header = ['类型', '结果', '时间']
  const rows = records.value.map((r) => [r.kind === 'distance' ? '量距' : '量面积', r.text, new Date(r.at).toLocaleString('zh-CN')])
  const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  download(csv, `terra-measures-${Date.now()}.csv`, 'text/csv;charset=utf-8')
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
        records.value = controller.records
      },
      onToolChange: (tool) => {
        activeTool.value = tool
      },
      onEditChange: (entry) => {
        editingEntry.value = entry
      },
    })
    // 恢复上次会话的标注(M3):清空/撤销会同步覆写存储
    const restored = controller.restoreSaved()
    records.value = controller.records
    if (restored > 0) {
      status.value = { ...status.value, result: { text: `已恢复 ${restored} 条标注` } }
    }
    ready.value = true
    loadError.value = ''

    if (debug.value) {
      // 调试钩子:探针可读取渲染器真实状态(画布像素/瓦片错误计数)。
      // 独立 try 包裹:诊断设施自身失效不应伪装成页面初始化失败
      try {
        window.__tvMapDebug = { viewer, Cesium, controller }
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

.place-search {
  margin-bottom: 4px;
}

.place-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 12px;
  box-sizing: border-box;
}

.place-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 150px;
  overflow: auto;
}

.place-item {
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.place-item:hover {
  background: rgba(128, 128, 128, 0.15);
}

.place-hint {
  margin: 6px 0 0;
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.5;
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
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.import-input {
  display: none;
}

.edit-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
}

.color-row {
  display: flex;
  gap: 6px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
  padding: 0;
}

.color-swatch:hover {
  border-color: #fff;
}

.width-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  opacity: 0.85;
}

.width-row input {
  flex: 1;
}

.measure-list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 120px;
  overflow: auto;
}

.measure-item {
  display: flex;
  gap: 6px;
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
}

.measure-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
