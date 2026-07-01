import * as THREE from 'three'
import { disposeObject3D } from '../three/gc.js'

export function useScene(canvas) {
  const scene = new THREE.Scene()

  const width = window.innerWidth
  const height = window.innerHeight
  const k = width / height
  const s = 120
  const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000)
  camera.position.set(165, 164, -339)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.setClearColor(0x0a0a1a, 1) // 深空蓝黑

  // === 星空背景 ===
  const starsGeo = new THREE.BufferGeometry()
  const starCount = 800
  const starPositions = new Float32Array(starCount * 3)
  const starColors = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const r = 400 + Math.random() * 400
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    starPositions[i * 3 + 2] = r * Math.cos(phi)
    const _brightness = 0.3 + Math.random() * 0.7
    starColors[i * 3] = 0.7 + Math.random() * 0.3
    starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3
    starColors[i * 3 + 2] = 0.8 + Math.random() * 0.2
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
  const starsMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false })
  const stars = new THREE.Points(starsGeo, starsMat)
  scene.add(stars)

  // === 改进的灯光 ===
  const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2)
  keyLight.position.set(300, 200, 200)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x4466aa, 0.4)
  fillLight.position.set(-200, -100, -200)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0x8899cc, 0.5)
  rimLight.position.set(0, 0, 400)
  scene.add(rimLight)

  const ambient = new THREE.AmbientLight(0x334466, 0.7)
  scene.add(ambient)

  function onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const k2 = w / h
    camera.left = -s * k2
    camera.right = s * k2
    camera.top = s
    camera.bottom = -s
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  function dispose() {
    window.removeEventListener('resize', onResize)
    disposeObject3D(scene)
    scene.clear()
    renderer.dispose()
  }

  return { scene, camera, renderer, dispose }
}
