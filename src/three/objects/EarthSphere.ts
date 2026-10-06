import * as THREE from 'three'
import type { CountryGdpMesh } from '../layers/BaseLayer'

/**
 * 生成程序化地球纹理
 */
function generateEarthTexture(size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size / 2
  const ctx = canvas.getContext('2d')!

  // 海洋底色 - 深蓝
  ctx.fillStyle = '#0a1628'
  ctx.fillRect(0, 0, size, size / 2)

  // 随机生成大陆块
  const continents = [
    { x: 0.10, y: 0.30, rx: 0.25, ry: 0.20 }, // 美洲
    { x: 0.45, y: 0.25, rx: 0.12, ry: 0.18 }, // 欧洲
    { x: 0.48, y: 0.50, rx: 0.10, ry: 0.15 }, // 非洲
    { x: 0.65, y: 0.35, rx: 0.18, ry: 0.22 }, // 亚洲
    { x: 0.82, y: 0.65, rx: 0.06, ry: 0.08 }, // 澳洲
    { x: 0.15, y: 0.70, rx: 0.08, ry: 0.08 }, // 南美
    { x: 0.60, y: 0.70, rx: 0.05, ry: 0.06 }, // 东南亚
    { x: 0.75, y: 0.20, rx: 0.06, ry: 0.05 }, // 东亚
  ]

  continents.forEach(c => {
    const cx = c.x * size, cy = c.y * (size / 2)
    const rx = c.rx * size, ry = c.ry * (size / 2)
    // 陆地渐变
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
    grad.addColorStop(0, '#2d5a27')  // 深绿
    grad.addColorStop(0.4, '#3a7d32') // 绿
    grad.addColorStop(0.7, '#5a9e4b') // 浅绿
    grad.addColorStop(0.9, '#1a3a1a') // 边缘深绿
    grad.addColorStop(1, '#0a1628')   // 海洋
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  })

  // 极地冰盖
  const iceGradTop = ctx.createLinearGradient(0, 0, 0, size * 0.08)
  iceGradTop.addColorStop(0, '#e8f0f8')
  iceGradTop.addColorStop(1, '#0a1628')
  ctx.fillStyle = iceGradTop
  ctx.fillRect(0, 0, size, size * 0.08)

  const iceGradBot = ctx.createLinearGradient(0, size / 2, 0, size * 0.44)
  iceGradBot.addColorStop(0, '#e8f0f8')
  iceGradBot.addColorStop(1, '#0a1628')
  ctx.fillStyle = iceGradBot
  ctx.fillRect(0, size * 0.44, size, size * 0.06)

  return new THREE.CanvasTexture(canvas)
}

function createBaseSphereGeometry(R: number, curvatureResolution = 64): THREE.SphereGeometry {
  return new THREE.SphereGeometry(R, curvatureResolution, curvatureResolution)
}

function createBaseMaterial(mapTexture: THREE.Texture): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    map: mapTexture,
    color: 0xffffff,
    specular: 0x222244,
    shininess: 5,
    emissive: 0x000022,
    emissiveIntensity: 0.1
  })
}

export function createSphereMesh(R: number, options: { curvatureResolution?: number } = {}): THREE.Mesh {
  const { curvatureResolution = 64 } = options
  const geometry = createBaseSphereGeometry(R, curvatureResolution)
  const texture = generateEarthTexture()
  const material = createBaseMaterial(texture)
  return new THREE.Mesh(geometry, material)
}

export interface TexturedEarthOptions {
  /** 地表纹理 URL（等距圆柱投影） */
  globeImageUrl?: string
  /** 凹凸贴图 URL */
  bumpImageUrl?: string
  /** 自定义材质覆盖 */
  globeMaterial?: THREE.Material
  /** 纹理加载完成回调 (earthGroup, sphereMesh) => {} */
  onReady?: (earthGroup: THREE.Group, sphereMesh: THREE.Mesh) => void
  /** 可选共享 Tween 组（当前未使用，预留） */
  tweenGroup?: unknown
  /** 球体几何细分段数 */
  curvatureResolution?: number
}

/** 挂载了 setTexture/setBumpMap 的地球 Group（meshArr 由 DataLoader 维护，含 GDP 着色自定义字段） */
export type TexturedEarthGroup = THREE.Group & {
  meshArr: CountryGdpMesh[]
  setTexture: (url: string) => void
  setBumpMap: (url: string) => void
}

/**
 * 创建支持外部纹理/凹凸贴图的地球
 * @param R - 地球半径
 * @returns 包含 sphereMesh 的 Group，挂载 setTexture/setBumpMap 方法
 */
export function createTexturedEarth(R: number, options: TexturedEarthOptions = {}): TexturedEarthGroup {
  const {
    globeImageUrl,
    bumpImageUrl,
    globeMaterial,
    onReady,
    tweenGroup = null,
    curvatureResolution = 64
  } = options

  const earthGroup = new THREE.Group() as TexturedEarthGroup
  earthGroup.userData.tweenGroup = tweenGroup
  earthGroup.userData.curvatureResolution = curvatureResolution
  const geometry = createBaseSphereGeometry(R, curvatureResolution)

  // 默认使用程序化纹理作为 fallback
  const fallbackTexture = generateEarthTexture()
  const material = globeMaterial
    ? (globeMaterial.clone ? globeMaterial.clone() : globeMaterial)
    : createBaseMaterial(fallbackTexture)

  const sphere = new THREE.Mesh(geometry, material) as unknown as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> & {
    setTexture: (url: string) => void
    setBumpMap: (url: string) => void
  }
  earthGroup.add(sphere)
  earthGroup.meshArr = []

  // 追踪由本模块加载的纹理，便于安全释放
  const loadedTextures = new Set<THREE.Texture>()
  if (!globeMaterial && (material as THREE.MeshBasicMaterial).map === fallbackTexture) {
    loadedTextures.add(fallbackTexture)
  }

  const textureLoader = new THREE.TextureLoader()
  let pending = 0
  let loaded = 0

  function checkReady(): void {
    if (pending === loaded && typeof onReady === 'function') {
      onReady(earthGroup, sphere)
    }
  }

  function loadTexture(url: string | undefined, isColorMap: boolean, apply: (texture: THREE.Texture) => void): void {
    if (!url) return
    pending++
    textureLoader.load(
      url,
      (texture) => {
        if (isColorMap) texture.colorSpace = THREE.SRGBColorSpace
        loadedTextures.add(texture)
        apply(texture)
        loaded++
        checkReady()
      },
      undefined,
      (err) => {
        console.error('Earth texture load error:', url, err)
        loaded++
        checkReady()
      }
    )
  }

  function setTexture(url: string): void {
    loadTexture(url, true, (texture) => {
      const sphereMat = sphere.material as unknown as THREE.MeshPhongMaterial
      const oldMap = sphereMat.map
      sphereMat.map = texture
      sphereMat.needsUpdate = true
      if (oldMap && loadedTextures.has(oldMap)) {
        oldMap.dispose()
        loadedTextures.delete(oldMap)
      }
    })
  }

  function setBumpMap(url: string): void {
    loadTexture(url, false, (texture) => {
      const sphereMat = sphere.material as unknown as THREE.MeshPhongMaterial
      const oldBump = sphereMat.bumpMap
      sphereMat.bumpMap = texture
      sphereMat.needsUpdate = true
      if (oldBump && loadedTextures.has(oldBump)) {
        oldBump.dispose()
        loadedTextures.delete(oldBump)
      }
    })
  }

  sphere.setTexture = setTexture
  sphere.setBumpMap = setBumpMap
  earthGroup.setTexture = setTexture
  earthGroup.setBumpMap = setBumpMap

  if (globeImageUrl) setTexture(globeImageUrl)
  if (bumpImageUrl) setBumpMap(bumpImageUrl)

  checkReady()

  return earthGroup
}

/**
 * 默认程序化地球（向后兼容）
 * 内部复用 createTexturedEarth，因此同样支持 setTexture/setBumpMap
 * @param R - 地球半径
 */
export function createEarth(R: number, options: TexturedEarthOptions = {}): TexturedEarthGroup {
  return createTexturedEarth(R, options)
}
