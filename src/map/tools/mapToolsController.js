/**
 * 地图工具箱交互控制器。
 *
 * 统一管理五种工具（量距/量面/标点/标线/标面）的鼠标交互状态机：
 * LEFT_CLICK 采点，RIGHT_CLICK / LEFT_DOUBLE_CLICK 结束，ESC 取消；
 * 采集中实时预览。所有产物实体登记在册，支持撤销与清空，
 * 并可序列化为 GeoJSON 导出（点/线/面 → Point/LineString/Polygon）。
 *
 * 面积算法：取首点的椭球切平面投影后鞋靴公式，对中小范围区域足够精确。
 */
const TOOL_COLORS = {
  distance: '#4fc3f7',
  area: '#aed581',
  point: '#ff8a65',
  line: '#ba68c8',
  polygon: '#ffd54f',
}

/** 各 kind 完成一次产物所需的最少顶点数(不足则不登记,导出 GeoJSON 才合法) */
const MIN_POINTS = { point: 1, line: 2, distance: 2, area: 3, polygon: 3 }

const STORAGE_KEY = 'tv-map-annotations'

export class MapToolsController {
  /** @param {Cesium.Viewer} viewer */
  constructor(Cesium, viewer, { onStatus, onRegistryChange, onToolChange } = {}) {
    this.Cesium = Cesium
    this.viewer = viewer
    this.activeTool = null
    /** @type {Cesium.Cartesian3[]} 当前采集中 */
    this.points = []
    /** @type {{id: string, kind: string, entity: object}[]} 已完成产物 */
    this.registry = []
    /** 距离量测的累计结果（米） */
    this.lastResult = null
    this.onStatus = onStatus || (() => {})
    this.onRegistryChange = onRegistryChange || (() => {})
    /**
     * 工具激活状态变化的单一事实源广播。View 层的按钮高亮必须跟随它,
     * 不能另持一份 ref——曾因双状态源出现「结束后/取消后按钮仍高亮,
     * 用户再点画布却无任何反馈」的脱钩(2026-09-15 审查 P1)。
     */
    this.onToolChange = onToolChange || (() => {})

    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.handler.setInputAction((e) => this._onClick(e), Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this.handler.setInputAction((e) => this._onMove(e), Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this.handler.setInputAction(() => this._finish(), Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    this.handler.setInputAction(() => this._finish(), Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    this._keyHandler = (e) => {
      if (e.key === 'Escape') this._cancel()
    }
    window.addEventListener('keydown', this._keyHandler)

    this._previewEntity = null
  }

  setTool(tool) {
    if (this.activeTool === tool) return
    this._cancel()
    this.activeTool = tool
    this.onToolChange(tool)
    this.onStatus({ hint: this._hintFor(tool) })
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

  _onClick(e) {
    // 无激活工具时不得采点:曾静默积累坐标,用户看到高亮按钮却无任何反馈
    if (!this.activeTool) return
    const carto = this._pickCartographic(e.position)
    if (!carto) return
    const Cesium = this.Cesium
    this.points.push(Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude))

    // 标点即放即成；其余工具只采点，由右键/双击结束（不限顶点数）
    if (this.activeTool === 'point') {
      this._finish()
      return
    }
    this._updatePreview()
  }

  _onMove(e) {
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
    this._updatePreview(carto)
  }

  _pickCartographic(windowPos) {
    const Cesium = this.Cesium
    const cartesian = this.viewer.camera.pickEllipsoid(windowPos, Cesium.Ellipsoid.WGS84)
    if (!cartesian) return null
    return Cesium.Cartographic.fromCartesian(cartesian)
  }

  _updatePreview(cursorCarto = null) {
    const Cesium = this.Cesium
    this._removePreview()
    if (!this.activeTool || this.points.length === 0) return

    const positions = [...this.points]
    if (cursorCarto && this.activeTool !== 'point') {
      positions.push(Cesium.Cartesian3.fromRadians(cursorCarto.longitude, cursorCarto.latitude))
    }
    const color = Cesium.Color.fromCssColorString(TOOL_COLORS[this.activeTool] || '#4fc3f7')

    if (this.activeTool === 'distance' || this.activeTool === 'line') {
      if (positions.length >= 2) {
        this._previewEntity = this.viewer.entities.add({
          polyline: { positions, width: 2, material: color.withAlpha(0.6) },
        })
      }
    } else if (this.activeTool === 'area' || this.activeTool === 'polygon') {
      if (positions.length >= 2) {
        this._previewEntity = this.viewer.entities.add({
          polyline: { positions: [...positions, positions[0]], width: 2, material: color.withAlpha(0.6) },
        })
      }
    }
    // 采集中每个点落一个临时标记，结束后并入产物
    for (const p of positions) {
      this.viewer.entities.add({
        position: p,
        point: { pixelSize: 6, color, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        __preview: true,
      })
    }
  }

  _removePreview() {
    this.viewer.entities.values
      .filter((e) => e.__preview)
      .forEach((e) => this.viewer.entities.remove(e))
    this._previewEntity = null
  }

  _finish() {
    const tool = this.activeTool
    if (!tool || this.points.length === 0) {
      this._cancel()
      return
    }
    // 顶点不足不登记(曾可产出 1 点 LineString / 2 点 Polygon 等无效 GeoJSON)
    if (this.points.length < (MIN_POINTS[tool] || 1)) {
      this.onStatus({ hint: `至少需要 ${MIN_POINTS[tool]} 个顶点，继续采集或 Esc 取消` })
      return
    }
    const kind = this._buildResult(tool, this.points)
    this._removePreview()
    this.points = []
    if (kind) {
      this.onStatus({ result: this.lastResult })
      this.onRegistryChange(this.registry)
      this._persist()
    }
    if (tool !== 'point') {
      this.activeTool = null
      this.onToolChange(null)
    }
    this.onStatus({ hint: tool === 'point' ? this._hintFor('point') : '' })
  }

  _cancel() {
    this._removePreview()
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
      this.lastResult = { kind: 'area', text: `面积 ${formatArea(area)}` }
      return 'area'
    }

    if (tool === 'distance') {
      let total = 0
      for (let i = 1; i < positions.length; i++) {
        // EllipsoidGeodesic 入参是 Cartographic（经纬度弧度），传 Cartesian3 会得到 NaN
        const start = Cesium.Cartographic.fromCartesian(positions[i - 1])
        const end = Cesium.Cartographic.fromCartesian(positions[i])
        const geodesic = new Cesium.EllipsoidGeodesic(start, end)
        total += geodesic.surfaceDistance
      }
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
      /** GeoJSON 导出用的经纬度环（度） */
      coords: positions.map((p) => this._toDegrees(p)),
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

  /** 切平面投影 + 鞋靴公式（平方米） */
  _computeArea(cartesians) {
    const Cesium = this.Cesium
    const plane = new Cesium.EllipsoidTangentPlane(cartesians[0])
    const pts = plane.projectPointsOntoPlane(cartesians)
    let area = 0
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      area += a.x * b.y - b.x * a.y
    }
    return Math.abs(area) / 2
  }

  undoLast() {
    const last = this.registry.pop()
    if (!last) return
    this.viewer.entities.remove(last.entity)
    last.extras.forEach((e) => this.viewer.entities.remove(e))
    this.onRegistryChange(this.registry)
    this._persist()
  }

  clearAll() {
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
      records = []
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
    window.removeEventListener('keydown', this._keyHandler)
    this.handler.destroy()
  }
}

export function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters.toFixed(0)} m`
}

export function formatArea(sqMeters) {
  return sqMeters >= 1e6 ? `${(sqMeters / 1e6).toFixed(2)} km²` : `${sqMeters.toFixed(0)} m²`
}
