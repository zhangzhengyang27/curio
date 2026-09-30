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
/* viewer/entity/Cesium 命名空间为预编译 Build 产物，无类型可依 */
import turfArea from '@turf/area'
import { polygon as turfPolygon } from '@turf/helpers'
import { getArcgisTerrainSampler } from '../terrainSampler'

/** 工具种类（含旧称呼 distance/surfaceDistance 两个量距类） */
export type ToolKind = 'distance' | 'area' | 'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | 'surfaceDistance'

/** 单个已登记产物（主体实体 + 附属 + 可编辑几何与量测记录） */
export interface MapEntry {
  id: string
  kind: ToolKind
  entity: any
  /** 标注名(M10,列表展示/重命名) */
  name: string
  /** 附属实体（面积填充/距离标签），随主体一起撤销/清空 */
  extras: any[]
  /** 拖拽顶点用的笛卡尔坐标序列(M2) */
  positions: any[]
  /** GeoJSON 导出用的经纬度环（度） */
  coords: Array<[number, number]>
  /** 编辑面板记录的样式(M2) */
  style: { colorCss: string; width: number }
  createdAt: number
  /** 量测记录(M5) */
  record?: { kind: string; text: string; at: number }
  /** 贴地距离的高程剖面(M11) */
  profile?: Array<{ d: number; h: number }>
}

export type MapResult = { kind: string; text: string }

export interface MapToolsCallbacks {
  onStatus?: (s: {
    hint?: string
    result?: MapResult | null
    coords?: { lon: number; lat: number; height: number } | null
  }) => void
  onRegistryChange?: (registry: MapEntry[]) => void
  onToolChange?: (tool: ToolKind | null) => void
  onEditChange?: (entry: MapEntry | null) => void
}

const TOOL_COLORS: Record<ToolKind, string> = {
  distance: '#4fc3f7',
  area: '#aed581',
  point: '#ff8a65',
  line: '#ba68c8',
  polygon: '#ffd54f',
  rectangle: '#4db6ac',
  circle: '#f06292',
  surfaceDistance: '#80deea',
}

/** 各 kind 完成一次产物所需的最少顶点数(不足则不登记,导出 GeoJSON 才合法) */
const MIN_POINTS: Partial<Record<ToolKind, number>> = { point: 1, line: 2, distance: 2, area: 3, polygon: 3, rectangle: 2, circle: 2, surfaceDistance: 2 }

/** 闭合多边形类产物(描边要闭环,GeoJSON 导出为 Polygon) */
const CLOSED_KINDS: ToolKind[] = ['area', 'polygon', 'rectangle', 'circle']

/** 编辑态删点下限:GeoJSON Polygon 环至少 3 点,LineString 至少 2 点 */
const REMOVE_FLOOR: Partial<Record<ToolKind, number>> = { line: 2, distance: 2, area: 3, polygon: 3, rectangle: 3, circle: 3, surfaceDistance: 2 }

/** 点到线段(屏幕坐标)的距离 */
function distToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** 由 Drawer 采集落点的工具（point 即放即成不走采集,右键/双击收尾） */
const DRAW_TOOLS: ToolKind[] = ['line', 'distance', 'area', 'polygon', 'rectangle', 'circle', 'surfaceDistance']

/** 异步收尾的工具(高程采样完成才登记产物) */
const ASYNC_TOOLS: ToolKind[] = ['surfaceDistance']

/** 达到落点数即自动收尾的工具（两点成形的面状工具） */
const AUTO_FINISH: Partial<Record<ToolKind, number>> = { rectangle: 2, circle: 2 }

/** Drawer 预览图形类型（rectangle/circle 有原生预览,其余统一折线） */
const DRAWER_TYPE: Partial<Record<ToolKind, string>> = {
  line: 'POLYLINE',
  distance: 'POLYLINE',
  area: 'POLYLINE',
  polygon: 'POLYLINE',
  rectangle: 'RECTANGLE',
  circle: 'CIRCLE',
  surfaceDistance: 'POLYLINE',
}

const STORAGE_KEY = 'cu-map-annotations'
/** 2026-09-30 M4 前的旧键;首次读取时一次性迁移 */
const LEGACY_ANNOTATIONS = 'tv-map-annotations';

function readStorage(): string | null {
  try {
    const cur = localStorage.getItem(STORAGE_KEY);
    if (cur !== null) return cur
    const legacy = localStorage.getItem(LEGACY_ANNOTATIONS);
    if (legacy !== null) {
      localStorage.setItem(STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_ANNOTATIONS)
    }
    return legacy
  } catch { return null }
}

/** Drawer 只在此懒加载:模块求值时依赖 window.Cesium(cesium-interop shim),必须晚于 loadCesium() */
let drawerPromise: Promise<any> | null = null
function ensureDrawer(): Promise<any> {
  if (!drawerPromise) {
    drawerPromise = import('@cesium-extends/drawer').then((m) => m.default)
  }
  return drawerPromise
}

export class MapToolsController {
  Cesium: any
  viewer: any
  activeTool: ToolKind | null
  /** 当前采集中(落点真值,不依赖 Drawer 快照) */
  points: any[]
  /** 已完成产物 */
  registry: MapEntry[]
  /** 量测的累计结果（米/平方米,由 _buildResult 写入） */
  lastResult: MapResult | null
  onStatus: NonNullable<MapToolsCallbacks['onStatus']>
  onRegistryChange: NonNullable<MapToolsCallbacks['onRegistryChange']>
  /**
   * 工具激活状态变化的单一事实源广播。View 层的按钮高亮必须跟随它,
   * 不能另持一份 ref——曾因双状态源出现「结束后/取消后按钮仍高亮,
   * 用户再点画布却无任何反馈」的脱钩(2026-09-15 审查 P1)。
   */
  onToolChange: NonNullable<MapToolsCallbacks['onToolChange']>
  /** 编辑态广播(M2):entry 或 null */
  onEditChange: NonNullable<MapToolsCallbacks['onEditChange']>
  /** 当前编辑中的产物(M2) */
  selectedEntry: MapEntry | null
  /** 编辑态顶点拖拽把手实体 */
  vertexHandles: any[]
  /** 正在拖拽的顶点序号(M2),null 表示未拖拽 */
  dragIndex: number | null

  drawer: any
  private _destroyed = false
  /** 贴地采样数据源开关(M11):true 用真实地形高程, false 用椭球面(高差恒 0) */
  private _terrainOn = false
  private _ready: Promise<any>
  private handler: any
  private _keyHandler: (e: KeyboardEvent) => void

  constructor(Cesium: any, viewer: any, { onStatus, onRegistryChange, onToolChange, onEditChange }: MapToolsCallbacks = {}) {
    this.Cesium = Cesium
    this.viewer = viewer
    this.activeTool = null
    this.points = []
    this.registry = []
    this.lastResult = null
    this.onStatus = onStatus || (() => {})
    this.onRegistryChange = onRegistryChange || (() => {})
    this.onToolChange = onToolChange || (() => {})
    this.onEditChange = onEditChange || (() => {})
    this.selectedEntry = null
    this.vertexHandles = []
    this.dragIndex = null

    this.drawer = null
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
    this.handler.setInputAction((e: any) => this._onClick(e), Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.handler.setInputAction((e: any) => this._onMove(e), Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.handler.setInputAction((e: any) => this._onRightClick(e), Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    this.handler.setInputAction(() => this._finish(), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    this.handler.setInputAction((e: any) => this._onLeftDown(e), Cesium.ScreenSpaceEventType.LEFT_DOWN)
    this.handler.setInputAction(() => this._onLeftUp(), Cesium.ScreenSpaceEventType.LEFT_UP)

    // 快捷键(Esc/Enter/Delete)。⚠ 忽略来自输入控件的事件:地名搜索/重命名/
    // 坐标转换的输入框里按 Enter 不应触发画布收尾或删除
    this._keyHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape') {
        if (this.selectedEntry) this._exitEdit()
        else this._cancel()
      } else if (e.key === 'Enter') {
        // Enter 结束采集(geojson.io 惯例):无采集进行时保持空闲
        if (!this.selectedEntry && this.activeTool && DRAW_TOOLS.includes(this.activeTool)) {
          this._finish()
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete 删除编辑中的产物
        if (this.selectedEntry) {
          e.preventDefault()
          this.deleteSelected()
        }
      }
    }
    window.addEventListener('keydown', this._keyHandler)
  }

  setTool(tool: ToolKind | null): void {
    if (this.activeTool === tool) return
    this._exitEdit()
    this._cancel()
    this.activeTool = tool
    this.onToolChange(tool)
    this.onStatus({ hint: this._hintFor(tool) })
    if (tool && DRAW_TOOLS.includes(tool)) {
      // 库尚未就绪的窗口期点击画布不会有反馈(百毫秒级),hint 已提示可采点
      this._ready.then(() => this._startDrawer(tool))
    }
  }

  _hintFor(tool: ToolKind | null): string {
    switch (tool) {
      case 'distance': return '左键依次点击采点，右键/双击/Enter 结束，Esc 取消'
      case 'area': return '左键依次点击多边形顶点，右键/双击/Enter 闭合，Esc 取消'
      case 'point': return '左键点击放置标注点，可连续放置'
      case 'line': return '左键依次点击折线顶点，右键/双击/Enter 结束'
      case 'polygon': return '左键依次点击多边形顶点，右键/双击/Enter 闭合'
      case 'rectangle': return '左键点击对角两点，自动成矩形'
      case 'circle': return '左键点圆心，再点半径位置自动闭合'
      case 'surfaceDistance': return '左键依次点击采点，右键/双击/Enter 结束（沿地形采样）'
      default: return ''
    }
  }

  /** 启动 Drawer 采集(库就绪后调用;工具已被切走时静默放弃) */
  _startDrawer(tool: ToolKind): void {
    if (this._destroyed || !this.drawer || this.activeTool !== tool) return
    const color = this.Cesium.Color.fromCssColorString(TOOL_COLORS[tool] || '#4fc3f7')
    const type = DRAWER_TYPE[tool] || 'POLYLINE'
    this.drawer.reset()
    this.drawer.start({
      type,
      // sameStyle=false → 采集预览用 dynamicOptions;成品实体不经过库(_finish 自建)
      dynamicOptions: type === 'POLYLINE'
        ? { clampToGround: true, width: 2, material: color.withAlpha(0.6) }
        : { material: color.withAlpha(0.4) },
    })
  }

  _resetDrawer(): void {
    if (this.drawer && this.drawer.status !== 'INIT' && this.drawer.status !== 'DESTROY') {
      this.drawer.reset()
    }
  }

  _onClick(e: any): void {
    // 编辑态:顶点上的点击属于刚结束的拖拽(DOWN→UP→CLICK 序列),不做事;
    // 点在边上插入顶点(M9);点其它产物切换选中;点空白退出编辑
    if (this.selectedEntry) {
      const entry = this.selectedEntry
      if (this._nearestVertex(entry, e.position, 16) != null) return
      const segIdx = this._hitSegment(entry, e.position, 10)
      if (segIdx != null) {
        this._insertVertex(entry, segIdx, e.position)
        return
      }
      const hit = this._pickEntry(e.position)
      if (hit && hit !== entry) this._enterEdit(hit)
      else if (!hit) this._exitEdit()
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

  _onMove(e: any): void {
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
  _pickEntry(windowPos: { x: number; y: number }): MapEntry | null {
    let best: MapEntry | null = null
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

  /** 编辑态点击命中边(屏幕距离阈值 px):返回线段起点序号(插点位置),未命中返回 null */
  _hitSegment(entry: MapEntry, windowPos: { x: number; y: number }, threshold = 10): number | null {
    const pts = entry.positions || []
    const n = pts.length
    if (n < 2) return null
    const closed = CLOSED_KINDS.includes(entry.kind)
    let best: number | null = null
    let bestDist = threshold
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = this.viewer.scene.cartesianToCanvasCoordinates(pts[i])
      const b = this.viewer.scene.cartesianToCanvasCoordinates(pts[(i + 1) % n])
      if (!a || !b) continue
      const d = distToSegment(windowPos, a, b)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return best
  }

  // ---- 标绘编辑(M2):选中 → 样式/顶点拖拽/增删点/单删 ----

  _enterEdit(entry: MapEntry): void {
    this._exitEdit()
    this.selectedEntry = entry
    this._createHandles(entry)
    this.onEditChange(entry)
  }

  /** 顶点拖拽把手(编辑态白色圆点,id 规则 vtx_{entryId}_{index}) */
  _createHandles(entry: MapEntry): void {
    if (!entry.positions || entry.kind === 'point') return
    const Cesium = this.Cesium
    entry.positions.forEach((pos: any, i: number) => {
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

  /** 增删点后把手全量重建(索引随顶点序列平移,不做增量) */
  _rebuildHandles(entry: MapEntry): void {
    this.vertexHandles.forEach((h) => this.viewer.entities.remove(h))
    this.vertexHandles = []
    this._createHandles(entry)
  }

  _exitEdit(): void {
    this.dragIndex = null
    this.vertexHandles.forEach((h) => this.viewer.entities.remove(h))
    this.vertexHandles = []
    if (this.selectedEntry) {
      this.selectedEntry = null
      this.onEditChange(null)
    }
  }

  /** 顶点命中:几何最近匹配(屏幕距离阈值 px),返回序号或 null(scene.pick 对 point 实体同样不可靠) */
  _nearestVertex(entry: MapEntry, windowPos: { x: number; y: number }, threshold = 16): number | null {
    let bestIdx: number | null = null
    let bestDist = threshold
    ;(entry.positions || []).forEach((p: any, idx: number) => {
      const px = this.viewer.scene.cartesianToCanvasCoordinates(p)
      if (!px) return
      const d = Math.hypot(px.x - windowPos.x, px.y - windowPos.y)
      if (d < bestDist) {
        bestDist = d
        bestIdx = idx
      }
    })
    return bestIdx
  }

  _onLeftDown(e: any): void {
    if (!this.selectedEntry || this.dragIndex != null) return
    const idx = this._nearestVertex(this.selectedEntry, e.position, 16)
    if (idx != null) {
      this.dragIndex = idx
      // 拖拽期间禁用左键旋转,避免相机同时转动
      this.viewer.scene.screenSpaceCameraController.enableRotate = false
    }
  }

  _onLeftUp(): void {
    if (this.dragIndex != null) {
      this.dragIndex = null
      this.viewer.scene.screenSpaceCameraController.enableRotate = true
      this._persist()
    }
  }

  /** 编辑态右键:命中顶点则删点(M9),否则走采点收尾 */
  _onRightClick(e: any): void {
    if (this.selectedEntry) {
      const idx = e.position ? this._nearestVertex(this.selectedEntry, e.position, 12) : null
      if (idx != null) this._removeVertex(this.selectedEntry, idx)
      return
    }
    this._finish()
  }

  /** 编辑态点边插点(M9):segIdx 为线段起点序号,新顶点取点击处的球面位置 */
  _insertVertex(entry: MapEntry, segIdx: number, windowPos: { x: number; y: number }): void {
    const cartesian = this.viewer.camera.pickEllipsoid(windowPos, this.Cesium.Ellipsoid.WGS84)
    if (!cartesian) return
    const positions = [...entry.positions]
    positions.splice(segIdx + 1, 0, cartesian)
    entry.positions = positions
    this._applyGeometry(entry)
    this._rebuildHandles(entry)
    this._persist()
  }

  _removeVertex(entry: MapEntry, idx: number): void {
    const floor = REMOVE_FLOOR[entry.kind] || 2
    if (entry.positions.length <= floor) {
      this.onStatus({ hint: `至少保留 ${floor} 个顶点` })
      return
    }
    const positions = [...entry.positions]
    positions.splice(idx, 1)
    entry.positions = positions
    this._applyGeometry(entry)
    this._rebuildHandles(entry)
    this._persist()
  }

  /**
   * 顶点序列变更(拖拽/插点/删点)后的统一同步:主体、附属与闭合描边。
   * ⚠ hierarchy 必须用 PolygonHierarchy 包装,不能 setValue 裸数组:构造期
   * Cesium 会把数组规范化,运行期 setValue 不做转换,GroundPolygon updater
   * 读到裸数组直接 TypeError → 整个渲染循环停止(实测)。
   * ⚠ 闭合类产物的描边是「顶点+首点闭合」的静态序列,直接 setValue 开序列
   * 会丢掉闭合段(拖拽顶点后描边缺口的存量 bug,2026-09-16 修复)。
   */
  _applyGeometry(entry: MapEntry): void {
    const Cesium = this.Cesium
    const positions = entry.positions
    const closed = CLOSED_KINDS.includes(entry.kind)
    const linePositions = closed ? [...positions, positions[0]] : positions
    if (entry.entity.polyline) entry.entity.polyline.positions.setValue(linePositions)
    if (entry.entity.polygon) entry.entity.polygon.hierarchy.setValue(new Cesium.PolygonHierarchy(positions))
    for (const x of entry.extras) {
      if (x.polyline) x.polyline.positions.setValue(linePositions)
      if (x.polygon) x.polygon.hierarchy.setValue(new Cesium.PolygonHierarchy(positions))
      if (x.label && (entry.kind === 'distance' || entry.kind === 'surfaceDistance')) {
        x.position.setValue(positions[Math.floor(positions.length / 2)])
        if (entry.record) x.label.text = entry.record.text
      }
    }
    entry.coords = positions.map((p: any) => this._toDegrees(p))
    this._refreshRecord(entry)
  }

  /** 量测类产物几何变更后重算记录与标签文案(拖拽/增删点后面积/距离不再失真) */
  _refreshRecord(entry: MapEntry): void {
    if (!entry.record) return
    if (entry.kind === 'surfaceDistance') {
      // ⚠ 必须先于 record.kind==='distance' 分流:贴地距离的 record.kind 也是
      // 'distance',走同步重算会把文案改写成「总距离」且丢掉高差
      this._refreshSurfaceRecord(entry)
      return
    }
    if (entry.record.kind === 'distance') {
      const text = `总距离 ${formatDistance(this._computeDistance(entry.positions))}`
      entry.record.text = text
      const label = entry.extras.find((x) => x.label)
      if (label) label.label.text = text
    } else if (entry.record.kind === 'area') {
      const prefix = entry.kind === 'rectangle' ? '矩形面积 ' : entry.kind === 'circle' ? '圆形面积 ' : '面积 '
      entry.record.text = `${prefix}${formatArea(this._computeArea(entry.positions))}`
    }
  }

  /** 编辑后重算贴地距离(异步,fire-and-forget) */
  async _refreshSurfaceRecord(entry: MapEntry): Promise<void> {
    try {
      const { total, profile } = await this._sampleSurfaceDistance(entry.positions)
      const text = `贴地距离 ${formatDistance(total)}`
      entry.record!.text = text
      entry.profile = profile
      const label = entry.extras.find((x) => x.label)
      if (label) label.label.text = text
      this.onRegistryChange(this.registry)
    } catch {
      // 采样失败保留旧文案
    }
  }

  _dragVertexTo(windowPos: { x: number; y: number }): void {
    const entry = this.selectedEntry
    const cartesian = this.viewer.camera.pickEllipsoid(windowPos, this.Cesium.Ellipsoid.WGS84)
    if (!cartesian || !entry?.positions) return
    const positions = [...entry.positions]
    positions[this.dragIndex!] = cartesian
    entry.positions = positions
    const handle = this.viewer.entities.getById(`vtx_${entry.id}_${this.dragIndex}`)
    if (handle) handle.position = cartesian
    this._applyGeometry(entry)
  }

  /** 编辑态改样式:主体线宽/颜色,面的填充与描边同步 */
  setSelectedStyle({ colorCss, width }: { colorCss?: string; width?: number }): void {
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
  deleteSelected(): void {
    const entry = this.selectedEntry
    if (!entry) return
    this._exitEdit()
    this.removeEntry(entry.id)
  }

  _pickCartographic(windowPos: { x: number; y: number }): any | null {
    const Cesium = this.Cesium
    const cartesian = this.viewer.camera.pickEllipsoid(windowPos, Cesium.Ellipsoid.WGS84)
    if (!cartesian) return null
    return Cesium.Cartographic.fromCartesian(cartesian)
  }

  /** 右键/双击/两点自动成形共用的收尾 */
  _finish(): void {
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
    if (ASYNC_TOOLS.includes(tool)) {
      // 贴地距离:先退出采集并提示采样中,高程就绪后再登记产物(M11)
      this._resetDrawer()
      this.points = []
      this.activeTool = null
      this.onToolChange(null)
      this.onStatus({ hint: '正在采样地形高程…' })
      this._buildSurfaceDistance(positions)
      return
    }
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

  _cancel(): void {
    this._resetDrawer()
    this.points = []
    if (this.activeTool !== null) {
      this.activeTool = null
      this.onToolChange(null)
    }
    this.onStatus({ hint: '' })
  }

  _buildResult(tool: ToolKind, positions: any[]): ToolKind | null {
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

    // 矩形:对角两点取包围盒,产物为四角多边形(与标面同构,可编辑/可导出)
    if (tool === 'rectangle') {
      const rect = Cesium.Rectangle.fromCartesianArray(positions)
      const corners = [
        [rect.north, rect.west],
        [rect.north, rect.east],
        [rect.south, rect.east],
        [rect.south, rect.west],
      ].map(([lat, lon]) => Cesium.Cartesian3.fromRadians(lon, lat))
      const fill = this.viewer.entities.add({
        polygon: {
          hierarchy: corners,
          material: color.withAlpha(0.3),
          classificationType: Cesium.ClassificationType.BOTH,
        },
      })
      const outline = this.viewer.entities.add({
        polyline: { positions: [...corners, corners[0]], width: 3, material: color },
      })
      this._registerEntity('rectangle', outline, corners, [fill])
      const area = this._computeArea(corners)
      this.registry[this.registry.length - 1].record = {
        kind: 'area',
        text: `矩形面积 ${formatArea(area)}`,
        at: Date.now(),
      }
      this.lastResult = { kind: 'area', text: `矩形面积 ${formatArea(area)}` }
      return 'rectangle'
    }

    // 圆:圆心+半径,产物为 64 边正多边形(与标面同构;恢复/导入直接吃环坐标)
    if (tool === 'circle') {
      const ring = positions.length === 2
        ? this._circlePositions(positions[0], Cesium.Cartesian3.distance(positions[0], positions[1]))
        : positions
      const fill = this.viewer.entities.add({
        polygon: {
          hierarchy: ring,
          material: color.withAlpha(0.3),
          classificationType: Cesium.ClassificationType.BOTH,
        },
      })
      const outline = this.viewer.entities.add({
        polyline: { positions: [...ring, ring[0]], width: 3, material: color },
      })
      this._registerEntity('circle', outline, ring, [fill])
      const area = this._computeArea(ring)
      this.registry[this.registry.length - 1].record = {
        kind: 'area',
        text: `圆形面积 ${formatArea(area)}`,
        at: Date.now(),
      }
      this.lastResult = { kind: 'area', text: `圆形面积 ${formatArea(area)}` }
      return 'circle'
    }
    return null
  }

  /** 以 center 为圆心、radius 为半径的正多边形环(中心点切平面 ENU 圆,64 段) */
  _circlePositions(center: any, radius: number, segments = 64): any[] {
    const Cesium = this.Cesium
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center)
    const pts: any[] = []
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * 2 * Math.PI
      pts.push(Cesium.Matrix4.multiplyByPoint(
        enu,
        new Cesium.Cartesian3(Math.cos(a) * radius, Math.sin(a) * radius, 0),
        new Cesium.Cartesian3(),
      ))
    }
    return pts
  }

  _addRegistry(kind: ToolKind, position: any, props: Record<string, any>): void {
    const entity = this.viewer.entities.add({ position, ...props })
    this._registerEntity(kind, entity, [position])
  }

  _registerEntity(kind: ToolKind, entity: any, positions: any[], extras: any[] = []): void {
    const entry: MapEntry = {
      id: entity.id,
      kind,
      entity,
      name: `标注 ${this.registry.length + 1}`,
      extras,
      positions,
      coords: positions.map((p) => this._toDegrees(p)),
      style: {
        colorCss: TOOL_COLORS[kind] || '#4fc3f7',
        width: entity.polyline?.width ?? 3,
      },
      createdAt: Date.now(),
    }
    this.registry.push(entry)
    this.onRegistryChange(this.registry)
  }

  /** 重命名标注(M10);名称为空不改动 */
  renameEntry(id: string, name: string): void {
    const trimmed = String(name || '').trim()
    if (!trimmed) return
    const entry = this.registry.find((e) => e.id === id)
    if (!entry) return
    entry.name = trimmed
    this._persist()
    this.onRegistryChange(this.registry)
  }

  /** 删除指定标注(主体+附属),列表删除按钮与编辑态单删共用 */
  removeEntry(id: string): void {
    const entry = this.registry.find((e) => e.id === id)
    if (!entry) return
    this.viewer.entities.remove(entry.entity)
    entry.extras.forEach((x) => this.viewer.entities.remove(x))
    this.registry = this.registry.filter((en) => en.id !== id)
    this.onRegistryChange(this.registry)
    this._persist()
  }

  /** 相机飞达标注(M10):以顶点包围矩形(外扩约 400m)为目标 */
  flyToEntry(id: string): void {
    const entry = this.registry.find((e) => e.id === id)
    if (!entry?.positions?.length) return
    const Cesium = this.Cesium
    const rect = Cesium.Rectangle.fromCartesianArray(entry.positions)
    const pad = 0.004
    this.viewer.camera.flyTo({
      // ⚠ 必须 new:ES 类不能当函数调用,少 new 会在点击处理里直接 TypeError
      destination: new Cesium.Rectangle(
        rect.west - pad,
        rect.south - pad,
        rect.east + pad,
        rect.north + pad
      ),
      duration: 1.6,
    })
  }

  /** 量测记录定位(M11):按 records 序号飞达对应产物 */
  flyToRecord(index: number): void {
    const entry = this.registry.filter((e) => e.record)[index]
    if (entry) this.flyToEntry(entry.id)
  }

  /** 贴地采样数据源开关(M11):只影响量测采样,不改变场景地形渲染 */
  setTerrainSource(on: boolean): void {
    this._terrainOn = !!on
  }

  _toDegrees(cartesian: any): [number, number] {
    const carto = this.Cesium.Cartographic.fromCartesian(cartesian)
    return [
      +this.Cesium.Math.toDegrees(carto.longitude).toFixed(6),
      +this.Cesium.Math.toDegrees(carto.latitude).toFixed(6),
    ]
  }

  /** 测地线距离累加（米）。EllipsoidGeodesic 入参是 Cartographic（弧度），传 Cartesian3 会得到 NaN */
  _computeDistance(positions: any[]): number {
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
  _computeArea(positions: any[]): number {
    const Cesium = this.Cesium
    const ring: Array<[number, number]> = positions.map((p) => {
      const c = Cesium.Cartographic.fromCartesian(p)
      return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)]
    })
    return turfArea(turfPolygon([[...ring, ring[0]]]))
  }

  /** 贴地距离(M11):沿测地线逐段插值采样高程,段内勾股合成。
   *  返回 {total, profile};地形关闭时高程恒 0,退化为平面测地值(明确标注「贴地」由开关状态决定) */
  async _sampleSurfaceDistance(positions: any[]): Promise<{ total: number; profile: Array<{ d: number; h: number }> }> {
    const Cesium = this.Cesium
    const SEG_SAMPLES = 8
    const SAMPLE_LEVEL = 14
    const cartos: any[] = []
    for (let i = 1; i < positions.length; i++) {
      const geo = new Cesium.EllipsoidGeodesic(
        Cesium.Cartographic.fromCartesian(positions[i - 1]),
        Cesium.Cartographic.fromCartesian(positions[i])
      )
      for (let k = 0; k < SEG_SAMPLES; k++) cartos.push(geo.interpolateUsingFraction(k / SEG_SAMPLES))
      cartos.push(Cesium.Cartographic.fromCartesian(positions[i]))
    }
    // 采样源:开→ArcGIS 真实地形(单例,fromUrl 失败退椭球);关→椭球面(高差恒 0)
    let provider = this.viewer.terrainProvider
    if (this._terrainOn) {
      try {
        provider = await getArcgisTerrainSampler()
      } catch {
        provider = this.viewer.terrainProvider
      }
    }
    // 5s 兜底:sampleTerrain 挂起(服务不可达)时按未采样高程(椭球面 0)合成
    await Promise.race([
      Cesium.sampleTerrain(provider, SAMPLE_LEVEL, cartos),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])
    let total = 0
    let cum = 0
    const profile: Array<{ d: number; h: number }> = []
    for (let i = 1; i < positions.length; i++) {
      const base = (i - 1) * (SEG_SAMPLES + 1)
      let seg = 0
      for (let k = 0; k < SEG_SAMPLES; k++) {
        const a = cartos[base + k]
        const b = cartos[base + k + 1]
        const g = new Cesium.EllipsoidGeodesic(a, b).surfaceDistance
        seg += Math.sqrt(g * g + (b.height - a.height) ** 2)
      }
      total += seg
      for (let k = 0; k < SEG_SAMPLES; k++) {
        const a = cartos[base + k]
        cum += new Cesium.EllipsoidGeodesic(a, cartos[base + k + 1]).surfaceDistance
        profile.push({ d: +cum.toFixed(1), h: +cartos[base + k + 1].height.toFixed(1) })
      }
    }
    return { total, profile }
  }

  /** 贴地距离产物构建(M11):异步采样,完成后登记/广播;编辑后的重算见 _refreshRecord */
  async _buildSurfaceDistance(positions: any[]): Promise<void> {
    const Cesium = this.Cesium
    const color = Cesium.Color.fromCssColorString(TOOL_COLORS.surfaceDistance)
    const line = this.viewer.entities.add({
      polyline: { positions, width: 3, material: color, clampToGround: true },
    })
    const mid = positions[Math.floor(positions.length / 2)]
    const label = this.viewer.entities.add({
      position: mid,
      label: {
        text: '贴地距离 采样中…',
        font: '13px sans-serif',
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(25,25,25,0.75)'),
        pixelOffset: new Cesium.Cartesian2(0, -14),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    this._registerEntity('surfaceDistance', line, positions, [label])
    this.onRegistryChange(this.registry)
    const entry = this.registry[this.registry.length - 1]
    try {
      const { total, profile } = await this._sampleSurfaceDistance(positions)
      const text = `贴地距离 ${formatDistance(total)}`
      entry.record = { kind: 'distance', text, at: Date.now() }
      entry.profile = profile
      label.label.text = text
      this.lastResult = { kind: 'distance', text }
      this.onStatus({ result: this.lastResult, hint: '' })
      this.onRegistryChange(this.registry)
      this._persist()
    } catch {
      label.label.text = '贴地距离 采样失败'
      this.onStatus({ hint: '地形高程采样失败,可改用量距' })
    }
  }

  undoLast(): void {
    const last = this.registry.pop()
    if (!last) return
    if (this.selectedEntry === last) this._exitEdit()
    this.viewer.entities.remove(last.entity)
    last.extras.forEach((e) => this.viewer.entities.remove(e))
    this.onRegistryChange(this.registry)
    this._persist()
  }

  clearAll(): void {
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

  _persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize()))
    } catch {
      // 存储失败(隐私模式/超限)不阻断功能,当前会话内仍可用
    }
  }

  serialize(): Array<{ kind: ToolKind; name: string; coords: Array<[number, number]>; createdAt: number }> {
    return this.registry.map((e) => ({ kind: e.kind, name: e.name, coords: e.coords, createdAt: e.createdAt }))
  }

  /** 恢复 localStorage 里的标注并重建实体;返回恢复条数 */
  restoreSaved(): number {
    let records: any[] = []
    try {
      records = JSON.parse(readStorage() as string) || []
    } catch {
      // 解析失败按空处理(脏数据不阻断页面)
    }
    return this._restoreRecords(records)
  }

  _restoreRecords(records: any[]): number {
    if (!Array.isArray(records)) return 0
    let n = 0
    for (const r of records) {
      if (!r || typeof r.kind !== 'string' || !Array.isArray(r.coords)) continue
      const positions = this._coordsToPositions(r.kind as ToolKind, r.coords)
      if (!positions) continue
      this._buildResult(r.kind as ToolKind, positions)
      // 恢复保持原始时间戳与名称(GeoJSON 导出含两者)
      const entry = this.registry[this.registry.length - 1]
      if (entry && r.createdAt != null) entry.createdAt = r.createdAt
      if (entry && r.name) entry.name = String(r.name)
      n++
    }
    if (n) this.onRegistryChange(this.registry)
    return n
  }

  _coordsToPositions(kind: ToolKind, coords: any): any[] | null {
    const MIN = MIN_POINTS[kind]
    if (!MIN) return null
    // point 的存储形态是 [[lon,lat]](单点包一层数组,与 GeoJSON 导出同构)
    const list = kind === 'point' ? [coords[0]] : coords
    if (list.some((c: any) => !Array.isArray(c) || c.length < 2 || !Number.isFinite(+c[0]) || !Number.isFinite(+c[1]))) {
      return null
    }
    return list.map(([lon, lat]: [number, number]) => this.Cesium.Cartesian3.fromDegrees(+lon, +lat))
  }

  /** 导入 GeoJSON FeatureCollection(与本页导出对称);返回成功导入条数 */
  importGeoJSON(fc: any): number {
    if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) return 0
    const records: any[] = []
    for (const f of fc.features) {
      const g = f?.geometry
      if (!g) continue
      const propsKind = f.properties?.kind
      const propsName = f.properties?.name
      if (g.type === 'Point') {
        records.push({ kind: 'point', name: propsName, coords: [g.coordinates] })
      } else if (g.type === 'LineString') {
        const kind = propsKind === 'distance' ? 'distance' : 'line'
        records.push({ kind, name: propsName, coords: g.coordinates })
      } else if (g.type === 'Polygon') {
        const ring = g.coordinates?.[0] || []
        // 去掉 GeoJSON 闭合环的尾点,回到顶点序列
        const open = ring.length > 1 &&
          ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring
        // rectangle/circle 的产物本就是多边形,恢复时直接吃环坐标
        const kind = ['area', 'polygon', 'rectangle', 'circle'].includes(propsKind) ? propsKind : 'polygon'
        records.push({ kind, name: propsName, coords: open })
      }
    }
    const n = this._restoreRecords(records)
    if (n) this._persist()
    return n
  }

  /** 量测记录(M5):挂在产物上,撤销/删除/导入恢复自动同步 */
  get records(): Array<{ kind: string; text: string; at: number }> {
    return this.registry.filter((e) => e.record).map((e) => e.record!)
  }

  /** 导出全部产物为 GeoJSON FeatureCollection */
  toGeoJSON(): any {
    return {
      type: 'FeatureCollection',
      features: this.registry.map((e) => {
        let geometry: any
        if (e.kind === 'point') geometry = { type: 'Point', coordinates: e.coords[0] }
        else if (e.kind === 'line' || e.kind === 'distance') geometry = { type: 'LineString', coordinates: e.coords }
        else geometry = { type: 'Polygon', coordinates: [[...e.coords, e.coords[0]]] }
        return {
          type: 'Feature',
          properties: { kind: e.kind, name: e.name, createdAt: e.createdAt },
          geometry,
        }
      }),
    }
  }

  destroy(): void {
    this._destroyed = true
    window.removeEventListener('keydown', this._keyHandler)
    this.handler.destroy()
    this._resetDrawer()
    if (this.drawer) this.drawer.destroy()
  }
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`
}

export function formatArea(sqMeters: number): string {
  return sqMeters >= 1e6 ? `${(sqMeters / 1e6).toFixed(2)} km²` : `${sqMeters.toFixed(0)} m²`
}
