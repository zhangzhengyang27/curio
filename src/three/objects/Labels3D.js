import * as THREE from 'three'
import { lon2xyz } from '../geo/coord.js'

function toCssColor(input, fallback = '#ffffff') {
  if (!input && input !== 0) return fallback
  if (typeof input === 'string') return input
  try {
    return '#' + new THREE.Color(input).getHexString()
  } catch {
    return fallback
  }
}

/**
 * 绘制圆角矩形路径
 */
function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * 创建单个 3D 文字标签（CanvasTexture Sprite）
 * @param {string} text
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {number} [options.lat=0]
 * @param {number} [options.lon=0]
 * @param {number} [options.fontSize=24]
 * @param {string|number} [options.color='#ffffff']
 * @param {string|number} [options.backgroundColor='rgba(0,0,0,0.6)']
 * @param {number} [options.padding=8]
 * @param {number} [options.borderRadius=6]
 * @param {number} [options.scale=0.12]
 * @param {number} [options.offset=2] - 离地高度
 * @param {number} [options.altitude=0] - 额外的每标签高度（用于柱体上方）
 * @param {boolean} [options.autoHide=true]
 * @returns {THREE.Sprite}
 */
export function create3DLabel(text, R, options = {}) {
  const {
    lat = 0,
    lon = 0,
    fontSize = 24,
    color = '#ffffff',
    backgroundColor = 'rgba(0,0,0,0.6)',
    padding = 8,
    borderRadius = 6,
    scale = 0.12,
    offset = 2,
    altitude = 0,
    autoHide = true
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
  const textMetrics = ctx.measureText(String(text))
  const textWidth = textMetrics.width

  const width = Math.max(Math.ceil(textWidth + padding * 2 + borderRadius * 2), fontSize + padding * 2)
  const height = Math.ceil(fontSize + padding * 2 + borderRadius)

  // 设置真实 canvas 尺寸（向下取整到2的倍数避免某些 GPU 警告）
  canvas.width = width % 2 === 0 ? width : width + 1
  canvas.height = height % 2 === 0 ? height : height + 1

  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const bg = toCssColor(backgroundColor, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = bg
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, borderRadius)
  ctx.fill()

  const fg = toCssColor(color, '#ffffff')
  ctx.fillStyle = fg
  ctx.fillText(String(text), canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true
  })

  const sprite = new THREE.Sprite(material)
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1)
  sprite.renderOrder = 10

  const radius = R + Number(altitude || 0) + Number(offset || 0)
  const pos = lon2xyz(radius, lon, lat)
  sprite.position.set(pos.x, pos.y, pos.z)

  sprite.userData = {
    text,
    autoHide,
    lat,
    lon,
    originalPosition: sprite.position.clone()
  }

  // 自定义 dispose，便于 BaseLayer 释放 CanvasTexture
  sprite.userData.dispose = () => {
    texture.dispose()
    material.dispose()
    canvas.width = 0
    canvas.height = 0
  }

  return sprite
}

/**
 * 批量创建 3D 文字标签
 * @param {Array} data - { lat, lon, text, style?, altitude?, ... }
 * @param {number} R
 * @param {object} options
 * @param {boolean} [options.autoHide=true]
 * @param {Array<number>} [options.visibleRange] - [近距, 远距]，相机距离在此范围内才显示
 * @returns {THREE.Group}
 */
export function create3DLabels(data, R, options = {}) {
  const group = new THREE.Group()
  group.name = 'Labels3D'

  const items = Array.isArray(data) ? data : []
  items.forEach(item => {
    if (!item || item.text == null) return
    const itemOptions = { ...options }
    // 允许 data 项直接携带样式字段
    ;[
      'lat', 'lon', 'text', 'fontSize', 'color', 'backgroundColor',
      'padding', 'borderRadius', 'scale', 'offset', 'altitude', 'autoHide'
    ].forEach(key => {
      if (item[key] !== undefined) itemOptions[key] = item[key]
    })
    if (item.style && typeof item.style === 'object') {
      Object.assign(itemOptions, item.style)
    }

    const label = create3DLabel(item.text, R, itemOptions)
    group.add(label)
  })

  const temp = new THREE.Vector3()
  const camPos = new THREE.Vector3()

  group.userData.updateVisibility = (camera) => {
    if (!camera) return
    camera.getWorldPosition(camPos)
    const range = options.visibleRange
    const hasRange = Array.isArray(range) && range.length >= 2

    group.children.forEach(child => {
      if (!child.isSprite) return
      child.getWorldPosition(temp)

      const toLabel = temp.clone().normalize()
      const toCam = camPos.clone().normalize()
      const facing = toLabel.dot(toCam)
      const isBehind = facing < 0

      if (child.userData.autoHide && isBehind) {
        child.visible = false
        return
      }

      if (hasRange) {
        const dist = camPos.distanceTo(temp)
        child.visible = dist >= range[0] && dist <= range[1]
        return
      }

      child.visible = true
    })
  }

  return group
}
