/**
 * 地图工具箱交互控制器。
 *
 * 架构（2026-09 重构）：采集交互层委托给 @cesium-extends/drawer（左键落点、
 * 实时预览线、断点标记、鼠标去重），本类保留产物登记/撤销/清空/持久化/
 * GeoJSON 导入导出/编辑（顶点拖拽）职责；面积用 @turf/area 测地算法，
 * 距离仍用 EllipsoidGeodesic 测地线累加。
 *
 * 刻意不使用 Drawer 的 END/CANCEL 事件通道：
 *   1. 其 END 事件有「首次点击后 100ms 内不响应」的门控，右击快速收尾会丢事件；
 *   2. POLYGON 类型收尾会先 _cancel 移除一个顶点（依赖双击产生的重复点补偿），
 *      右击收尾会丢最后一个真实顶点。
 * 因此所有面状/线状采集统一走 POLYLINE 通道，右击/双击/Esc 仍由本类自己
 * 的处理器收尾，产物实体仍由 _buildResult 统一构建（与 localStorage 恢复/
 * GeoJSON 导入同路径）。库的成品实体通过不触发 _complete 而不会进入场景。
 *
 * ⚠ 落点真值由本类自己的 LEFT_CLICK 采集（this.points），不取 Drawer 的
 * onPointsChange 快照：其数组是「已落点 + 1 个尾随鼠标位」，且尾随位受
 * 「首次点击后 100ms 内不刷新」门控，快速连点会得到陈旧槽位（实测把
 * 两点距离算成 0 m）。Drawer 在此只承担视觉层（预览线/断点标记/十字光标），
 * 时序缺陷最多造成预览短暂 stale，不影响产物与量测数值。
 *
 * ⚠ 不引入 @cesium-extends/measure：其 turf 依赖链（polygon-clipping UMD）在
 * dev 裸伺服（optimizeDeps.exclude）下没有 ESM 导出，页面直接报错（实测）。
 */
import turfArea from '@turf/area'
import { polygon as turfPolygon } from '@turf/helpers'

const TOOL_COLORS = {
  distance: '#4fc3f7',
  area: '#aed581',
  point: '#ff8a65',
  line: '#ba68c8',
  polygon: '#ffd54f',
}

/** 各 kind 完成一次产物所需的最少顶点数(不足则不登记,导出 GeoJSON 才合法) */
const MIN_POINTS = { point: 1, line: 2, distance: 2, area: 3, polygon: 3 }

/** 由 Drawer 采集落点的工具（point 即放即成不走采集,右键/双击收尾） */
const DRAW_TOOLS = ['line', 'distance', 'area', 'polygon']

/** 达到落点数即自动收尾的工具（两点成形的面状工具） */
const AUTO_FINISH = {}

const STORAGE_KEY = 'tv-map-annotations'

/** Drawer 只在此懒加载:模块求值时依赖 window.Cesium(cesium-interop shim),必须晚于 loadCesium() */
let drawerPromise = null
function ensureDrawer() {
  if (!drawerPromise) {
    drawerPromise = import('@cesium-extends/drawer').then((m) => m.default)
  }
  return drawerPromise
}

export class MapToolsController {
  /** @param {Cesium.Viewer} viewer */
  constructor(Cesium, viewer, { onStatus, onRegistryChange, onToolChange, onEditChange } = {}) {
    this.Cesium = Cesium
    this.viewer = viewer
    this.activeTool = null
    /** @type {Cesium.Cartesian3[]} 当前采集中(落点真值,不依赖 Drawer 快照) */
    this.points = []
    /** @type {{id: string, kind: string, entity: object}[]} 已完成产物 */
    this.registry = []
    /** 量测的累计结果（米/平方米,由 _buildResult 写入） */
    this.lastResult = null
    this.onStatus = onStatus || (() => {})
    this.onRegistryChange = onRegistryChange || (() => {})
    /**
     * 工具激活状态变化的单一事实源广播。View 层的按钮高亮必须跟随它,
     * 不能另持一份 ref——曾因双状态源出现「结束后/取消后按钮仍高亮,
     * 用户再点画布却无任何反馈」的脱钩(2026-09-15 审查 P1)。
     */
    this.onToolChange = onToolChange || (() => {})
    /** 编辑态广播(M2):entry 或 null */
    this.onEditChange = onEditChange || (() => {})
    /** 当前编辑中的产物(M2) */
    this.selectedEntry = null
    /** @type {object[]} 编辑态顶点拖拽把手实体 */
    this.vertexHandles = []
    /** 正在拖拽的顶点序号(M2),null 表示未拖拽 */
    this.dragIndex = null

    this.drawer = null
    this._destroyed = false
    this._ready = ensureDrawer()
      .then((Drawer) => {
        if (this._destroyed) return null
        // CANCEL/END 指到不可达的 MIDDLE 事件:收尾/取消全部由本类的
        // RIGHT_CLICK/双击/Esc 处理器负责(原因见文件头注释)
        this.drawer = new Drawer(viewer, {
          sameStyle: false,
          operateType: { START: 'LEFT_CLICK', MOVING: 'MOUSE_MOVE', CANCEL: 'MIDDLE_DOWN', END: 'MIDDLE_UP' },
        })
        return this.drawer
      })
      .catch((e) => {
        console.error('[map-tools] 标绘库加载失败,采点类工具不可用', e)
        return null
      })

    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.handler.setInputAction((e) => this._onClick(e), Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.handler.setInputAction((e) => this._onMove(e), Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.handler.setInputAction(() => this._finish(), Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    this.handler.setInputAction(() => this._finish(), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    this.handler.setInputAction((e) => this._onLeftDown(e), Cesium.ScreenSpaceEventType.LEFT_DOWN)
    this.handler.setInputAction(() => this._onLeftUp(), Cesium.ScreenSpaceEventType.LEFT_UP)

    this._keyHandler = (e) => {
      if (e.key === 'Escape') {
        if (this.selectedEntry) this._exitEdit()
        else this._cancel()
      }
    }
    window.addEventListener('keydown', this._keyHandler)
  }

  setTool(tool) {
    if (this.activeTool === tool) return
    this._exitEdit()
    this._cancel()
    this.activeTool = tool
    this.onToolChange(tool)
    this.onStatus({ hint: this._hintFor(tool) })
    if (DRAW_TOOLS.includes(tool)) {
      // 库尚未就绪的窗口期点击画布不会有反馈(百毫秒级),hint 已提示可采点
      this._ready.then(() => this._startDrawer(tool))
    }
  }

  _hintFor(tool) {
    switch (tool) {
      case 'distance': return '左键依次点击采点，右键/双击结束，Esc 取消'
      case 'area': return '左键依次点击多边形顶点，右键/双击闭合，Esc 取消'
      case 'point': return '左键点击放置标注点，可连续放置'
      case 'line': return '左键依次点击折线顶点，右键/双击结束'
      case 'polygon': return '左键依次点击多边形顶点，右键/双击闭合'
      default: return ''
    }
  }

  /** 启动 Drawer 采集(库就绪后调用;工具已被切走时静默放弃) */
  _startDrawer(tool) {
    if (this._destroyed || !this.drawer || this.activeTool !== tool) return
    const color = this.Cesium.Color.fromCssColorString(TOOL_COLORS[tool] || '#4fc3f7')
    this.drawer.reset()
    this.drawer.start({
      type: 'POLYLINE',
      // sameStyle=false → 采集预览用 dynamicOptions;成品实体不经过库(_finish 自建)
      dynamicOptions: {
        clampToGround: true,
        width: 2,
        material: color.withAlpha(0.6),
      },
    })
  }

  _resetDrawer() {
    if (this.drawer && this.drawer.status !== 'INIT' && this.drawer.status !== 'DESTROY') {
      this.drawer.reset()
    }
  }

  _onClick(e) {
    // 编辑态:点击空白退出编辑,点击其它产物切换选中;不采点
    if (this.selectedEntry) {
      const entry = this._pickEntry(e.position)
      if (entry && entry !== this.selectedEntry) this._enterEdit(entry)
      else if (!entry) this._exitEdit()
      return
    }
    // 无激活工具时尝试选中已绘产物(M2);不得采点:曾静默积累坐标
    if (!this.activeTool) {
      const entry = this._pickEntry(e.position)
      if (entry) this._enterEdit(entry)
      return
    }
    if (this.activeTool === 'point') {
      const carto = this._pickCartographic(e.position)
      if (!carto) return
      const position = this.Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude)
      this._buildResult('point', [position])
      this.onStatus({ result: this.lastResult })
      this.onRegistryChange(this.registry)
      this._persist()
      return
    }
    if (DRAW_TOOLS.includes(this.activeTool)) {
      // 落点真值自采(Drawer 只管视觉层,原因见文件头注释);与上一点同位时
      // 去重——双击收尾会先触发一次同位 LEFT_CLICK
      const carto = this._pickCartographic(e.position)
      if (!carto) return
      const position = this.Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude)
      const last = this.points[this.points.length - 1]
      if (last && this.Cesium.Cartesian3.distance(last, position) < 0.01) return
      this.points.push(position)
      const need = AUTO_FINISH[this.activeTool]
      if (need && this.points.length >= need) this._finish()
    }
  }

  _onMove(e) {
    // 拖拽顶点时优先更新几何(M2)
    if (this.dragIndex != null && this.selectedEntry) {
      this._dragVertexTo(e.endPosition)
      return
    }
    const carto = this._pickCartographic(e.endPosition)
    this.onStatus({
      coords: carto
        ? {
            lon: this.Cesium.Math.toDegrees(carto.longitude),
            lat: this.Cesium.Math.toDegrees(carto.latitude),
            height: carto.height,
          }
        : null,
    })
  }

  /**
   * 点击命中产物:几何最近匹配(屏幕距离阈值 28px)。
   * ⚠ 不用 scene.pick——细线/半透明实体在 headless 与低端 GPU 上拾取极不可靠
   * (实测宽 14 不透明线也命不中),几何匹配只依赖投影坐标,完全确定。
   */
  _pickEntry(windowPos) {
    let best = null
    let bestDist = 28
    for (const entry of this.registry) {
      if (!entry.positions) continue
      for (const p of entry.positions) {
        const px = this.viewer.scene.cartesianToCanvasCoordinates(p)
        if (!px) continue
        const d = Math.hypot(px.x - windowPos.x, px.y - windowPos.y)
        if (d < bestDist) {
          bestDist = d
          best = entry
        }
      }
    }
    return best
  }

  // ---- 标绘编辑(M2):选中 → 样式/顶点拖拽/单删 ----

  _enterEdit(entry) {
    this._exitEdit()
    this.selectedEntry = entry
    if (entry.positions && entry.kind !== 'point') {
      // 顶点拖拽把手
      const Cesium = this.Cesium
      entry.positions.forEach((pos, i) => {
        const handle = this.viewer.entities.add({
          id: `vtx_${entry.id}_${i}`,
          position: pos,
          point: {
            pixelSize: 11,
            color: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString(entry.style?.colorCss || '#4fc3f7'),
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          __vertexHandle: true,
        })
        this.vertexHandles.push(handle)
      })
    }
    this.onEditChange(entry)
  }

  _exitEdit() {
    this.dragIndex = null
    this.vertexHandles.forEach((h) => this.viewer.entities.remove(h))
    this.vertexHandles = []
    if (this.selectedEntry) {
      this.selectedEntry = null
      this.onEditChange(null)
    }
  }

  _onLeftDown(e) {
    if (!this.selectedEntry || this.dragIndex != null) return
    // 顶点命中同样用几何匹配(scene.pick 对 point 实体同样不可靠)
    let bestIdx = null
    let bestDist = 16
    this.selectedEntry.positions.forEach((p, idx) => {
      const px = this.viewer.scene.cartesianToCanvasCoordinates(p)
      if (!px) return
      const d = Math.hypot(px.x - e.position.x, px.y - e.position.y)
      if (d < bestDist) {
        bestDist = d
        bestIdx = idx
      }
    })
    if (bestIdx != null) {
      this.dragIndex = bestIdx
      // 拖拽期间禁用左键旋转,避免相机同时转动
      this.viewer.scene.screenSpaceCameraController.enableRotate = false
    }
  }

  _onLeftUp() {
    if (this.dragIndex != null) {
      this.dragIndex = null
      this.viewer.scene.screenSpaceCameraController.enableRotate = true
      this._persist()
    }
  }

  _dragVertexTo(windowPos) {
    const entry = this.selectedEntry
    const cartesian = this.viewer.camera.pickEllipsoid(windowPos, this.Cesium.Ellipsoid.WGS84)
    if (!cartesian || !entry?.positions) return
    const positions = [...entry.positions]
    positions[this.dragIndex] = cartesian
    entry.positions = positions
    // 同步几何:主体、附属与拾取代理的线都要跟着顶点走
    if (entry.entity.polyline) entry.entity.polyline.positions.setValue(positions)
    if (entry.entity.polygon) entry.entity.polygon.hierarchy.setValue(positions)
    for (const x of entry.extras) {
      if (x.polyline) x.polyline.positions.setValue(positions)
      if (x.polygon) x.polygon.hierarchy.setValue(positions)
    }
    const handle = this.viewer.entities.getById(`vtx_${entry.id}_${this.dragIndex}`)
    if (handle) handle.position = cartesian
    entry.coords = positions.map((p) => this._toDegrees(p))
  }

  /** 编辑态改样式:主体线宽/颜色,面的填充与描边同步 */
  setSelectedStyle({ colorCss, width }) {
    const entry = this.selectedEntry
    if (!entry) return
    const Cesium = this.Cesium
    const color = Cesium.Color.fromCssColorString(colorCss || entry.style?.colorCss || '#4fc3f7')
    entry.style = {
      colorCss: colorCss || entry.style?.colorCss,
      width: width ?? entry.style?.width ?? 3,
    }
    const w = entry.style.width
    if (entry.entity.polyline) {
      entry.entity.polyline.material = color
      entry.entity.polyline.width = w
    }
    if (entry.entity.polygon) {
      entry.entity.polygon.material = color.withAlpha(0.3)
    }
    if (entry.entity.point) entry.entity.point.color = color
    const fill = entry.extras.find((x) => x.polygon)
    if (fill) fill.polygon.material = color.withAlpha(0.3)
  }

  /** 编辑态删除当前产物(主体+附属) */
  deleteSelected() {
    const entry = this.selectedEntry
    if (!entry) return
    this.viewer.entities.remove(entry.entity)
    entry.extras.forEach((x) => this.viewer.entities.remove(x))
    this.registry = this.registry.filter((en) => en.id !== entry.id)
    this._exitEdit()
    this.onRegistryChange(this.registry)
    this._persist()
  }

  _pickCartographic(windowPos) {
    const Cesium = this.Cesium
    const cartesian = this.viewer.camera.pickEllipsoid(windowPos, Cesium.Ellipsoid.WGS84)
    if (!cartesian) return null
    return Cesium.Cartographic.fromCartesian(cartesian)
  }

  /** 右键/双击/两点自动成形共用的收尾 */
  _finish() {
    const tool = this.activeTool
    if (!tool || !DRAW_TOOLS.includes(tool)) {
      this._cancel()
      return
    }
    if (this.points.length === 0) {
      this._cancel()
      return
    }
    // 顶点不足不登记(曾可产出 1 点 LineString / 2 点 Polygon 等无效 GeoJSON)
    if (this.points.length < (MIN_POINTS[tool] || 1)) {
      this.onStatus({ hint: `至少需要 ${MIN_POINTS[tool]} 个顶点，继续采集或 Esc 取消` })
      return
    }
    const positions = [...this.points]
    const kind = this._buildResult(tool, positions)
    this._resetDrawer()
    this.points = []
    if (kind) {
      this.onStatus({ result: this.lastResult })
      this.onRegistryChange(this.registry)
      this._persist()
    }
    // 采点类工具单次收尾即退出(高亮回归:自然结束后按钮退激活)
    this.activeTool = null
    this.onToolChange(null)
    this.onStatus({ hint: '' })
  }

  _cancel() {
    this._resetDrawer()
    this.points = []
    if (this.activeTool !== null) {
      this.activeTool = null
      this.onToolChange(null)
    }
    this.onStatus({ hint: '' })
  }

  _buildResult(tool, positions) {
    const Cesium = this.Cesium
    const color = Cesium.Color.fromCssColorString(TOOL_COLORS[tool] || '#4fc3f7')

    if (tool === 'point') {
      this._addRegistry('point', positions[0], {
        point: { pixelSize: 10, color, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      })
      this.lastResult = { kind: 'point', text: '已放置标注点' }
      return 'point'
    }

    if (tool === 'line') {
      // ⚠ 必须走 _registerEntity 直传 positions 数组：曾误用 _addRegistry
      //（期望单点），把数组当单个 Cartesian 转经纬度得到 NaN，导出
      // GeoJSON 的坐标全部序列化为 null
      const line = this.viewer.entities.add({
        polyline: { positions, width: 3, material: color },
      })
      this._registerEntity('line', line, positions)
      this.lastResult = { kind: 'line', text: `折线 · ${positions.length} 个顶点` }
      return 'line'
    }

    // 量面积（area）与标面（polygon）共用多边形绘制逻辑；登记 kind 用 tool
    // 本身以便图例/导出区分，GeoJSON 中两者都导出为 Polygon
    if (tool === 'area' || tool === 'polygon') {
      const fill = this.viewer.entities.add({
        polygon: {
          hierarchy: positions,
          material: color.withAlpha(0.3),
          classificationType: Cesium.ClassificationType.BOTH,
        },
      })
      const outline = this.viewer.entities.add({
        polyline: { positions: [...positions, positions[0]], width: 3, material: color },
      })
      this._registerEntity(tool, outline, positions, [fill])
      const area = this._computeArea(positions)
      this.registry[this.registry.length - 1].record = {
        kind: 'area',
        text: `面积 ${formatArea(area)}`,
        at: Date.now(),
      }
      this.lastResult = { kind: 'area', text: `面积 ${formatArea(area)}` }
      return 'area'
    }

    if (tool === 'distance') {
      const total = this._computeDistance(positions)
      const line = this.viewer.entities.add({
        polyline: { positions, width: 3, material: color, clampToGround: true },
      })
      const mid = positions[Math.floor(positions.length / 2)]
      const label = this.viewer.entities.add({
        position: mid,
        label: {
          text: `总距离 ${formatDistance(total)}`,
          font: '13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(25,25,25,0.75)'),
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      this._registerEntity('distance', line, positions, [label])
      this.registry[this.registry.length - 1].record = {
        kind: 'distance',
        text: `总距离 ${formatDistance(total)}`,
        at: Date.now(),
      }
      this.lastResult = { kind: 'distance', text: `总距离 ${formatDistance(total)}` }
      return 'distance'
    }
    return null
  }

  _addRegistry(kind, position, props) {
    const entity = this.viewer.entities.add({ position, ...props })
    this._registerEntity(kind, entity, [position])
  }

  _registerEntity(kind, entity, positions, extras = []) {
    const entry = {
      id: entity.id,
      kind,
      entity,
      /** 附属实体（面积填充/距离标签），随主体一起撤销/清空 */
      extras,
      /** 拖拽顶点用的笛卡尔坐标序列(M2) */
      positions,
      /** GeoJSON 导出用的经纬度环（度） */
      coords: positions.map((p) => this._toDegrees(p)),
      /** 编辑面板记录的样式(M2) */
      style: {
        colorCss: TOOL_COLORS[kind] || '#4fc3f7',
        width: entity.polyline?.width ?? 3,
      },
      createdAt: Date.now(),
    }
    this.registry.push(entry)
    this.onRegistryChange(this.registry)
  }

  _toDegrees(cartesian) {
    const carto = this.Cesium.Cartographic.fromCartesian(cartesian)
    return [
      +this.Cesium.Math.toDegrees(carto.longitude).toFixed(6),
      +this.Cesium.Math.toDegrees(carto.latitude).toFixed(6),
    ]
  }

  /** 测地线距离累加（米）。EllipsoidGeodesic 入参是 Cartographic（弧度），传 Cartesian3 会得到 NaN */
  _computeDistance(positions) {
    const Cesium = this.Cesium
    let total = 0
    for (let i = 1; i < positions.length; i++) {
      const start = Cesium.Cartographic.fromCartesian(positions[i - 1])
      const end = Cesium.Cartographic.fromCartesian(positions[i])
      total += new Cesium.EllipsoidGeodesic(start, end).surfaceDistance
    }
    return total
  }

  /** 面积（平方米）：turf 测地面积，任意大小多边形都稳定 */
  _computeArea(positions) {
    const Cesium = this.Cesium
    const ring = positions.map((p) => {
      const c = Cesium.Cartographic.fromCartesian(p)
      return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)]
    })
    return turfArea(turfPolygon([[...ring, ring[0]]]))
  }

  undoLast() {
    const last = this.registry.pop()
    if (!last) return
    if (this.selectedEntry === last) this._exitEdit()
    this.viewer.entities.remove(last.entity)
    last.extras.forEach((e) => this.viewer.entities.remove(e))
    this.onRegistryChange(this.registry)
    this._persist()
  }

  clearAll() {
    this._exitEdit()
    this.registry.forEach((e) => {
      this.viewer.entities.remove(e.entity)
      e.extras.forEach((x) => this.viewer.entities.remove(x))
    })
    this.registry = []
    this.lastResult = null
    this._cancel()
    this.onRegistryChange(this.registry)
    this.onStatus({ result: null })
    this._persist()
  }

  // ---- 持久化与导入(M3):存储与 GeoJSON 同源的 {kind, coords, createdAt} ----

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize()))
    } catch {
      // 存储失败(隐私模式/超限)不阻断功能,当前会话内仍可用
    }
  }

  serialize() {
    return this.registry.map((e) => ({ kind: e.kind, coords: e.coords, createdAt: e.createdAt }))
  }

  /** 恢复 localStorage 里的标注并重建实体;返回恢复条数 */
  restoreSaved() {
    let records = []
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      // 解析失败按空处理(脏数据不阻断页面)
    }
    return this._restoreRecords(records)
  }

  _restoreRecords(records) {
    if (!Array.isArray(records)) return 0
    let n = 0
    for (const r of records) {
      if (!r || typeof r.kind !== 'string' || !Array.isArray(r.coords)) continue
      const positions = this._coordsToPositions(r.kind, r.coords)
      if (!positions) continue
      this._buildResult(r.kind, positions)
      // 恢复保持原始时间戳(GeoJSON 导出含 createdAt)
      const entry = this.registry[this.registry.length - 1]
      if (entry && r.createdAt != null) entry.createdAt = r.createdAt
      n++
    }
    if (n) this.onRegistryChange(this.registry)
    return n
  }

  _coordsToPositions(kind, coords) {
    const MIN = MIN_POINTS[kind]
    if (!MIN) return null
    // point 的存储形态是 [[lon,lat]](单点包一层数组,与 GeoJSON 导出同构)
    const list = kind === 'point' ? [coords[0]] : coords
    if (list.some((c) => !Array.isArray(c) || c.length < 2 || !Number.isFinite(+c[0]) || !Number.isFinite(+c[1]))) {
      return null
    }
    return list.map(([lon, lat]) => this.Cesium.Cartesian3.fromDegrees(+lon, +lat))
  }

  /** 导入 GeoJSON FeatureCollection(与本页导出对称);返回成功导入条数 */
  importGeoJSON(fc) {
    if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) return 0
    const records = []
    for (const f of fc.features) {
      const g = f?.geometry
      if (!g) continue
      const propsKind = f.properties?.kind
      if (g.type === 'Point') {
        records.push({ kind: 'point', coords: [g.coordinates] })
      } else if (g.type === 'LineString') {
        const kind = propsKind === 'distance' ? 'distance' : 'line'
        records.push({ kind, coords: g.coordinates })
      } else if (g.type === 'Polygon') {
        const ring = g.coordinates?.[0] || []
        // 去掉 GeoJSON 闭合环的尾点,回到顶点序列
        const open = ring.length > 1 &&
          ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring
        const kind = propsKind === 'area' ? 'area' : 'polygon'
        records.push({ kind, coords: open })
      }
    }
    const n = this._restoreRecords(records)
    if (n) this._persist()
    return n
  }

  /** 量测记录(M5):挂在产物上,撤销/删除/导入恢复自动同步 */
  get records() {
    return this.registry.filter((e) => e.record).map((e) => e.record)
  }

  /** 导出全部产物为 GeoJSON FeatureCollection */
  toGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: this.registry.map((e) => {
        let geometry
        if (e.kind === 'point') geometry = { type: 'Point', coordinates: e.coords[0] }
        else if (e.kind === 'line' || e.kind === 'distance') geometry = { type: 'LineString', coordinates: e.coords }
        else geometry = { type: 'Polygon', coordinates: [[...e.coords, e.coords[0]]] }
        return {
          type: 'Feature',
          properties: { kind: e.kind, createdAt: e.createdAt },
          geometry,
        }
      }),
    }
  }

  destroy() {
    this._destroyed = true
    window.removeEventListener('keydown', this._keyHandler)
    this.handler.destroy()
    this._resetDrawer()
    if (this.drawer) this.drawer.destroy()
  }
}

export function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`
}

export function formatArea(sqMeters) {
  return sqMeters >= 1e6 ? `${(sqMeters / 1e6).toFixed(2)} km²` : `${sqMeters.toFixed(0)} m²`
}
