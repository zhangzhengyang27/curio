import * as THREE from 'three'

/**
 * 云层 — 半透明球体 + 独立旋转
 * @param {number} R - 地球半径
 * @param {object} options
 * @returns {THREE.Mesh}
 */
export function createCloudLayer(R, options = {}) {
  const {
    radius = R * 1.04,
    opacity = 0.25,
    speed = 0.3
  } = options

  // 程序化生成云纹理
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // 浅蓝底
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1024, 512)

  // 随机云团
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    const r = 2 + Math.random() * 30
    const alpha = Math.random() * 0.4
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fill()
  }

  // 大块云团
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    const r = 40 + Math.random() * 80
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  const geometry = new THREE.SphereGeometry(radius, 64, 64)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData = { speed, opacity }

  return mesh
}
