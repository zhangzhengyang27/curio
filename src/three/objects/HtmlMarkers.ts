import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { lon2xyz } from '../geo/coord'

/**
 * 创建单个 HTML DOM 标记（CSS2DObject）
 * @param content - HTML 字符串或 DOM 节点
 */
export function createHtmlMarker(
  content: string | HTMLElement | null | undefined,
  options: {
    className?: string
    lat?: number
    lon?: number
    R?: number
    /** 离地高度 */
    offset?: number
    /** 直接指定位置（优先于 lat/lon/R） */
    position?: THREE.Vector3
    [key: string]: unknown
  } = {}
): CSS2DObject {
  const {
    className = '',
    lat,
    lon,
    R,
    offset = 0,
    position
  } = options

  const div = document.createElement('div')
  div.className = 'earth-html-marker ' + className
  div.style.pointerEvents = 'none'
  div.style.position = 'absolute'
  div.style.whiteSpace = 'nowrap'

  if (content instanceof HTMLElement) {
    div.appendChild(content)
  } else if (content != null) {
    div.innerHTML = String(content)
  }

  const marker = new CSS2DObject(div)

  if (position instanceof THREE.Vector3) {
    marker.position.copy(position)
  } else if (R != null && lat != null && lon != null) {
    const radius = Number(R) + Number(offset || 0)
    const pos = lon2xyz(radius, lon, lat)
    marker.position.set(pos.x, pos.y, pos.z)
  }

  marker.userData.isHtmlMarker = true
  return marker
}

/**
 * 批量创建 HTML DOM 标记
 * @param data - { lat, lon, html|content, offset?, className?, style? }
 * @param R
 */
export function createHtmlMarkers(
  data: Array<Record<string, any>> | null | undefined,
  R: number,
  options: Record<string, any> = {}
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'HtmlMarkers'

  const items = Array.isArray(data) ? data : []
  items.forEach(item => {
    if (!item) return
    const content = item.html ?? item.content ?? item.text ?? ''
    const itemOptions: Record<string, any> = { ...options, R }
    ;['lat', 'lon', 'offset', 'className', 'position'].forEach(key => {
      if (item[key] !== undefined) itemOptions[key] = item[key]
    })
    if (item.style && typeof item.style === 'object') {
      Object.assign(itemOptions, item.style)
    }

    const marker = createHtmlMarker(content, itemOptions)
    group.add(marker)
  })

  return group
}

/**
 * 根据相机位置隐藏地球背面的 HTML 标记
 * @param markersGroup
 * @param camera
 * @param _R - 地球半径（未使用，保留兼容）
 */
export function updateHtmlMarkersVisibility(
  markersGroup: THREE.Group | null | undefined,
  camera: THREE.Camera | null | undefined,
  _R?: number
): void {
  if (!markersGroup || !camera) return

  const camPos = new THREE.Vector3()
  camera.getWorldPosition(camPos)

  const temp = new THREE.Vector3()
  markersGroup.traverse(child => {
    if (!child.userData.isHtmlMarker) return
    child.getWorldPosition(temp)

    const toMarker = new THREE.Vector3().copy(temp).normalize()
    const toCam = new THREE.Vector3().copy(camPos).normalize()
    const visible = toMarker.dot(toCam) >= 0

    const marker = child as CSS2DObject
    if (marker.element) {
      marker.element.style.visibility = visible ? 'visible' : 'hidden'
    }
  })
}
