<template>
  <div class="earth-container">
    <canvas
      ref="canvasRef"
      class="earth-canvas"
    />
    <div
      ref="labelContainer"
      class="label-container"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { useScene } from '../composables/useScene.js'
import { useRenderLoop } from '../composables/useRenderLoop.js'
import { useOrbitControls } from '../composables/useOrbitControls.js'
import { useRaycaster } from '../composables/useRaycaster.js'
import { useLabels } from '../composables/useLabels.js'
import { createHtmlMarkers, updateHtmlMarkersVisibility } from '../three/objects/HtmlMarkers.js'
import { disposeObject3D } from '../three/gc.js'
import { useCameraFlight } from '../composables/useCameraFlight.js'
import { createEarth } from '../three/objects/EarthSphere.js'
import { createAtmosphereGlow } from '../three/objects/AtmosphereGlow.js'
import { createGraticules } from '../three/objects/Graticules.js'
import { createTileEngine, updateTileEnginePOV, disposeTileEngine } from '../three/objects/TileEngine.js'
import { createCloudLayer } from '../three/objects/CloudLayer.js'
import { createStormParticles, updateStormParticles } from '../three/objects/ParticleField.js'
import { lon2xyz } from '../three/geo/coord.js'
import * as TWEEN from '@tweenjs/tween.js'
import { buildEarthFromData, buildSearchIndex, loadWorldData } from '../three/data/DataLoader.js'
import { VisualizationLayer } from '../three/layers/VisualizationLayer.js'
import { useEarthStore } from '../stores/useEarthStore.js'
import { useInteractionStore } from '../stores/useInteractionStore.js'
import { useLayerStore } from '../stores/useLayerStore.js'
import { useTimelineStore } from '../stores/useTimelineStore.js'

const R = 100
const canvasRef = ref(null)
const labelContainer = ref(null)

const earthStore = useEarthStore()
const interactionStore = useInteractionStore()
const layerStore = useLayerStore()
const timelineStore = useTimelineStore()

const raycasterCtx = useRaycaster()
const renderLoop = useRenderLoop()
const { intersect, clearSelection, selectMesh } = raycasterCtx

let scene, camera, renderer, controls, disposeOrbit, disposeScene, stopLoop, disposeLabels
let labelManager, flyToFn, cancelFlight, earth, overlayGroup
let canvasEl = null
let visualizationLayer
let htmlMarkersGroup = null
let atmosphere, cloudLayer, stormPoints, sphereMesh // sphereMesh保存地球球体引用
let composer, bloomPass // post-processing
let originalGdpColors = {} // 保存GDP原始颜色用于恢复
let pillarGroup = null // GDP柱状动画组
let pillarMeshes = [] // [{mesh, name}]
let isAnimatingIn = false // 入场动画期间暂停自转
let tweenGroup = null // 图层共享 Tween 组
let graticulesMesh = null // 经纬网格
let tileEngine = null // 瓦片引擎
let tileEngineBaseSphereVisible = true // 瓦片激活前记录地球本体可见性
let isRealisticEarth = false // 是否使用真实地球贴图
let proceduralTexture = null // 程序生成的地球纹理备份
let countryMeshStates = [] // 国家 Mesh 的原始材质状态备份
let realisticHighlightMesh = null // 真实地球模式下高亮的国家 Mesh

onMounted(async () => {
  try {
    canvasEl = canvasRef.value
    const sceneCtx = useScene(canvasRef.value)
    scene = sceneCtx.scene; camera = sceneCtx.camera; renderer = sceneCtx.renderer; disposeScene = sceneCtx.dispose
    const addResizeCallback = sceneCtx.addResizeCallback

    raycasterCtx.setCamera(camera)

    const orbitCtx = useOrbitControls(camera, renderer.domElement)
    controls = orbitCtx.controls; disposeOrbit = orbitCtx.dispose

    const flightCtx = useCameraFlight(controls, camera, R)
    flyToFn = flightCtx.flyTo
    cancelFlight = flightCtx.cancel

    // 创建图层共享的 Tween 组
    tweenGroup = new TWEEN.Group()

    labelManager = useLabels()
    labelContainer.value.appendChild(labelManager.labelRenderer.domElement)
    const { label } = labelManager.createLabelEl('GDP')
    scene.add(label); labelManager.mainLabel = label; disposeLabels = labelManager.dispose

    addResizeCallback(() => labelManager?.resize())

    earth = createEarth(R, { tweenGroup })
    earthStore.setEarthGroup(earth); scene.add(earth)

    // 云层
    cloudLayer = createCloudLayer(R, { opacity: 0.2 })
    scene.add(cloudLayer)

    overlayGroup = new THREE.Group(); scene.add(overlayGroup)

    // Post-processing
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85)
    bloomPass.enabled = false
    composer.addPass(bloomPass)

    // 保存球体引用(buildEarthFromData会clear整个earthGroup)
    sphereMesh = earth.children[0]
    proceduralTexture = sphereMesh.material.map

    const { world, gdpColorMap } = await loadWorldData()
    buildEarthFromData(earth, R, world, gdpColorMap)
    // 重新添加球体
    earth.add(sphereMesh)

    // 大气光晕挂载到地球组，随地球缩放/旋转
    atmosphere = createAtmosphereGlow(R, { opacity: 0.25 })
    earth.add(atmosphere)

    // 地球与云层入场动画（使用共享 Tween 组）
    isAnimatingIn = true
    earth.scale.set(0, 0, 0)
    earth.rotation.y = -Math.PI / 2
    new TWEEN.Tween(earth.scale, tweenGroup)
      .to({ x: 1, y: 1, z: 1 }, 1200)
      .easing(TWEEN.Easing.Cubic.Out)
      .start()
    new TWEEN.Tween(earth.rotation, tweenGroup)
      .to({ y: 0 }, 1200)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => { isAnimatingIn = false })
      .start()
    if (cloudLayer) {
      cloudLayer.scale.set(0, 0, 0)
      new TWEEN.Tween(cloudLayer.scale, tweenGroup)
        .to({ x: 1, y: 1, z: 1 }, 1200)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
    }

    earthStore.setSearchIndex(buildSearchIndex(world))

    // 保存GDP原始颜色
    earth.meshArr.forEach(m => {
      originalGdpColors[m.name] = { color: m.material.color.clone(), gdp: m.gdp }
    })

    // 备份国家 Mesh 材质状态，用于真实/笔画地球切换
    countryMeshStates = earth.meshArr.map(m => ({
      mesh: m,
      opacity: m.material.opacity,
      transparent: m.material.transparent
    }))

    // 将搜索索引挂载到 earthGroup，方便图层内部访问
    earth.userData.searchIndex = earthStore.searchIndex

    // 初始化可视化图层控制器
    visualizationLayer = new VisualizationLayer({
      scene,
      earthGroup: earth,
      R,
      parent: overlayGroup,
      flyToFn,
      originalGdpColors,
      earthStore,
      tweenGroup
    })

    // 加载时序GDP数据
    try {
      const tlData = await fetch('/data/mock/gdp-timeline.json').then(r => r.json())
      timelineStore.setYearlyData(tlData)
      // 默认不自动显示GDP柱状图，保持页面干净
    } catch (_e) { /* timeline data optional */ }

    const borderKids = [], meshKids = []
    earth.traverse(child => {
      if (child.isLineLoop) borderKids.push(child)
      if (child.isMesh && child !== sphereMesh) meshKids.push(child)
    })
    layerStore.setLayerChildren('borders', borderKids)
    layerStore.setLayerChildren('countries', meshKids)

    // 默认状态：真实地球、云层关闭、边界线关闭、无数据图例
    cloudLayer.visible = false
    toggleRealisticEarth()
    layerStore.setVisible('borders', false)
    visualizationLayer?.switchVisualization('default')

    const renderFn = () => {
      if (earthStore.isRotating && !isAnimatingIn) earth.rotateY(earthStore.rotationSpeed)
      // 同步 overlayGroup 旋转，使柱状图/圆柱散点与地球表面保持一致
      overlayGroup.rotation.copy(earth.rotation)
      controls.update()
      const nowSec = performance.now() / 1000
      const nowMs = performance.now()
      // 大气光晕更新相机位置
      if (atmosphere?.userData?.updateCamera) atmosphere.userData.updateCamera(camera)
      // 云层旋转（仅在可见时）
      if (cloudLayer && cloudLayer.visible) cloudLayer.rotateY(0.0003)
      // 风暴粒子
      if (stormPoints) updateStormParticles(stormPoints, 0.016)
      // GDP柱体高度 Tween 过渡（tweening 标记防止每帧重复创建 Tween）
      pillarMeshes.forEach(pm => {
        if (!pm.tweening && Math.abs(pm.targetHeight - pm.height) > 0.05) {
          pm.tweening = true
          new TWEEN.Tween(pm, tweenGroup)
            .to({ height: pm.targetHeight }, 600)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(obj => {
              obj.bar.position.copy(obj.base).addScaledVector(obj.dir, obj.height / 2)
              obj.bar.scale.set(1, Math.max(obj.height, 0.3), 1)
              obj.dot.position.copy(obj.base).addScaledVector(obj.dir, obj.height + 0.8)
            })
            .onComplete(() => { pm.tweening = false })
            .start()
        }
      })
      visualizationLayer?.update(nowSec)
      tweenGroup.update(nowMs) // 图层共享 Tween 组，TWEEN 使用毫秒时间
      updateTileEnginePOV(tileEngine, camera)
      // Bloom 关闭时直接渲染，跳过 EffectComposer 的 pass 管线开销
      if (bloomPass && bloomPass.enabled) {
        composer.render()
      } else {
        renderer.render(scene, camera)
      }
      if (htmlMarkersGroup) {
        updateHtmlMarkersVisibility(htmlMarkersGroup, camera, R)
      }
      labelManager.labelRenderer.render(scene, camera)
    }
    renderLoop.setRenderFn(renderFn); renderLoop.start(); stopLoop = renderLoop.stop

    canvasEl.addEventListener('click', onCanvasClick)
    canvasEl.addEventListener('contextmenu', onContextMenu)
  } catch (err) {
    console.error('EarthCanvas init error:', err)
  }
})

function onCanvasClick(event) {
  if (!camera) return
  const hit = intersect(event, earthStore.earthGroup?.meshArr || [], camera)
  if (hit) {
    const mesh = hit.object; selectMesh(mesh); earthStore.selectCountry(mesh.name)
    if (mesh.gdp) labelManager.showLabel(labelManager.mainLabel, hit.point, mesh.name + ' GDP：' + (mesh.gdp / 1000000000000).toFixed(3) + '万亿美元')
    else labelManager.showLabel(labelManager.mainLabel, hit.point, mesh.name)
    interactionStore.openInfoPanel({ name: mesh.name, gdp: mesh.gdp ? (mesh.gdp / 1000000000000).toFixed(3) + ' 万亿美元' : '数据缺失', lon: mesh.userData?.lon, lat: mesh.userData?.lat })
  } else {
    clearSelection(); earthStore.selectCountry(null); labelManager.hideLabel(labelManager.mainLabel); interactionStore.closeInfoPanel()
  }
}

function onContextMenu(event) {
  event.preventDefault()
  if (!camera) return
  const hit = intersect(event, earthStore.earthGroup?.meshArr || [], camera)
  if (hit) interactionStore.openContextMenu(event.clientX, event.clientY, { name: hit.object.name, gdp: hit.object.gdp, mesh: hit.object, lon: hit.object.userData?.lon, lat: hit.object.userData?.lat })
  else interactionStore.closeContextMenu()
}

async function switchVisualization(mode) {
  if (mode === earthStore.currentVisualization) return
  try {
    await visualizationLayer?.switchVisualization(mode)
  } catch (err) {
    console.error('Viz switch error:', mode, err)
  }
}

function setGlobeTexture(url) {
  earth?.setTexture?.(url)
}

function setGlobeBumpMap(url) {
  earth?.setBumpMap?.(url)
}

function addHtmlMarkers(markersData) {
  if (!scene) return
  clearHtmlMarkers()
  htmlMarkersGroup = createHtmlMarkers(markersData, R, { className: 'earth-canvas-marker' })
  scene.add(htmlMarkersGroup)
}

function clearHtmlMarkers() {
  if (!htmlMarkersGroup) return
  if (htmlMarkersGroup.parent) {
    htmlMarkersGroup.parent.remove(htmlMarkersGroup)
  }
  disposeObject3D(htmlMarkersGroup)
  htmlMarkersGroup = null
}

// === 经纬网格 ===
function showGraticules(options = {}) {
  if (!scene) return
  if (graticulesMesh) {
    graticulesMesh.visible = true
    return
  }
  graticulesMesh = createGraticules(R, options)
  graticulesMesh.name = 'graticules'
  scene.add(graticulesMesh)
}

function hideGraticules() {
  if (graticulesMesh) graticulesMesh.visible = false
}

// === 瓦片引擎 ===
function setTileEngineUrl(urlFn, maxLevel) {
  if (!scene || typeof urlFn !== 'function') return
  clearTileEngine()
  tileEngineBaseSphereVisible = sphereMesh ? sphereMesh.visible : true
  tileEngine = createTileEngine(R, { tileUrl: urlFn, maxLevel })
  tileEngine.name = 'tileEngine'
  scene.add(tileEngine)
  // 隐藏默认地球球体，避免瓦片与程序化纹理深度冲突
  if (sphereMesh) sphereMesh.visible = false
}

function clearTileEngine() {
  if (!tileEngine) return
  disposeTileEngine(tileEngine)
  tileEngine = null
  if (sphereMesh) sphereMesh.visible = tileEngineBaseSphereVisible
}

// === 真实/笔画地球切换 ===
function toggleRealisticEarth() {
  if (!sphereMesh || !earth?.meshArr?.length) return isRealisticEarth

  isRealisticEarth = !isRealisticEarth

  if (isRealisticEarth) {
    // 切换到真实地球：加载蓝大理石纹理 + 地形凹凸贴图
    earth.setTexture('/textures/earth-blue-marble.jpg')
    earth.setBumpMap('/textures/earth-topology.png')
    // 隐藏国家 Mesh 色块，让真实贴图可见
    earth.meshArr.forEach(m => {
      m.material.transparent = true
      m.material.opacity = 0
      m.material.needsUpdate = true
    })
    // 若当前已选中某个国家，立即高亮
    if (earthStore.selectedCountry) {
      highlightRealisticCountry(earthStore.selectedCountry)
    }
  } else {
    // 切换回笔画地球：清除高亮并恢复程序纹理
    clearRealisticHighlight()
    if (proceduralTexture) {
      const oldMap = sphereMesh.material.map
      sphereMesh.material.map = proceduralTexture
      sphereMesh.material.needsUpdate = true
      if (oldMap && oldMap !== proceduralTexture) oldMap.dispose()
    }
    sphereMesh.material.bumpMap = null
    sphereMesh.material.needsUpdate = true
    // 恢复国家 Mesh 透明度
    countryMeshStates.forEach(state => {
      const m = state.mesh
      if (m && m.material) {
        m.material.transparent = state.transparent
        m.material.opacity = state.opacity
        m.material.needsUpdate = true
      }
    })
  }

  return isRealisticEarth
}

function setRealisticEarth(enabled) {
  if (!!enabled === isRealisticEarth) return isRealisticEarth
  return toggleRealisticEarth()
}

// === 真实地球模式下高亮选中的国家 Mesh ===
function highlightRealisticCountry(name) {
  if (!isRealisticEarth || !earth?.meshArr?.length) return
  const mesh = earth.meshArr.find(m => m.name === name)
  if (!mesh || mesh === realisticHighlightMesh) return

  clearRealisticHighlight()

  realisticHighlightMesh = mesh
  if (!realisticHighlightMesh.userData._realisticOriginal) {
    realisticHighlightMesh.userData._realisticOriginal = {
      opacity: realisticHighlightMesh.material.opacity,
      transparent: realisticHighlightMesh.material.transparent,
      emissive: realisticHighlightMesh.material.emissive.clone(),
      emissiveIntensity: realisticHighlightMesh.material.emissiveIntensity
    }
  }

  realisticHighlightMesh.material.transparent = true
  realisticHighlightMesh.material.opacity = 0.6
  realisticHighlightMesh.material.emissive.set(0x00cccc)
  realisticHighlightMesh.material.emissiveIntensity = 0.5
  realisticHighlightMesh.material.needsUpdate = true
}

function clearRealisticHighlight() {
  if (!realisticHighlightMesh || !realisticHighlightMesh.material) return
  const orig = realisticHighlightMesh.userData._realisticOriginal
  if (orig) {
    realisticHighlightMesh.material.transparent = orig.transparent
    realisticHighlightMesh.material.opacity = orig.opacity
    realisticHighlightMesh.material.emissive.copy(orig.emissive)
    realisticHighlightMesh.material.emissiveIntensity = orig.emissiveIntensity
  }
  realisticHighlightMesh.material.needsUpdate = true
  realisticHighlightMesh = null
}

defineExpose({ flyTo: (lon, lat, duration) => flyToFn?.(lon, lat, duration), getRenderer: () => renderer, getControls: () => controls, switchVisualization, toggleCloud, toggleNightMode, createStorm, toggleTerrain, loadCustomScatter, toggleBloom, setGlobeTexture, setGlobeBumpMap, addHtmlMarkers, clearHtmlMarkers, showGraticules, hideGraticules, setTileEngineUrl, clearTileEngine, toggleRealisticEarth, setRealisticEarth })

// === Timeline year watch — GDP柱状动画 ===
const stopWatch = watch(() => timelineStore.currentYear, (year) => {
  if (!earth?.meshArr || !timelineStore.yearlyData) return
  // 切到GDP模式
  if (earthStore.currentVisualization !== 'gdp') {
    visualizationLayer?.switchVisualization('gdp')
  }
  updatePillars(year)
})

// === 真实地球模式下监听国家选中，高亮对应 Mesh ===
const stopWatchSelected = watch(() => earthStore.selectedCountry, (name) => {
  if (!isRealisticEarth) return
  if (name) highlightRealisticCountry(name)
  else clearRealisticHighlight()
})

function updatePillars(year) {
  const data = timelineStore.getPillarData(year)
  if (!data?.pillars?.length) return

  // 只保留在searchIndex中存在的国家(即world.json有对应Mesh的)
  const indexNames = new Set(Object.keys(earthStore.searchIndex))
  const pillars = data.pillars.filter(p => indexNames.has(p.name))

  if (!pillarGroup) {
    pillarGroup = new THREE.Group()
    overlayGroup.add(pillarGroup)
  }

  // 更新/创建柱体
  pillars.forEach(p => {
    const info = earthStore.searchIndex[p.name]
    if (!info) return

    let entry = pillarMeshes.find(pm => pm.name === p.name)
    const pos = lon2xyz(R, info.lon, info.lat)
    const dir = new THREE.Vector3(pos.x, pos.y, pos.z).normalize()
    const base = dir.clone().multiplyScalar(R * 1.01)

    if (!entry) {
      const w = 1.2, h = 1
      const geo = new THREE.BoxGeometry(w, h, w)
      const mat = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.85, emissive: new THREE.Color(0.1, 0.1, 0.1) })
      const bar = new THREE.Mesh(geo, mat)
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      bar.setRotationFromQuaternion(quat)
      bar.position.copy(base).addScaledVector(dir, h / 2)
      pillarGroup.add(bar)

      const dotGeo = new THREE.SphereGeometry(1, 8, 4)
      const dotMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      pillarGroup.add(dot)

      entry = { bar, dot, name: p.name, height: h, targetHeight: h, growth: 0, base, dir }
      pillarMeshes.push(entry)
    }
    entry.targetHeight = Math.max(p.height, 1)
    entry.growth = p.growth
    const c = p.color
    entry.bar.material.color.setRGB(c.r, c.g, c.b)
    entry.bar.material.emissive.setRGB(c.r * 0.3, c.g * 0.3, c.b * 0.3)
    entry.dot.material.color.setRGB(c.r, c.g, c.b)
  })

  // 清除不在top30中的旧柱体
  const currentNames = new Set(pillars.map(p => p.name))
  pillarMeshes = pillarMeshes.filter(pm => {
    if (!currentNames.has(pm.name)) {
      pm.bar.removeFromParent()
      pm.dot.removeFromParent()
      disposeObject3D(pm.bar)
      disposeObject3D(pm.dot)
      return false
    }
    return true
  })
}

onUnmounted(() => {
  stopLoop?.()
  stopWatch?.()
  stopWatchSelected?.()
  cancelFlight?.()
  canvasEl?.removeEventListener('click', onCanvasClick)
  canvasEl?.removeEventListener('contextmenu', onContextMenu)
  canvasEl = null
  visualizationLayer?.dispose()
  clearHtmlMarkers()
  // 释放经纬网格
  if (graticulesMesh) {
    if (graticulesMesh.parent) graticulesMesh.parent.remove(graticulesMesh)
    disposeObject3D(graticulesMesh)
    graticulesMesh = null
  }
  // 释放风暴粒子
  if (stormPoints) {
    if (stormPoints.parent) stormPoints.parent.remove(stormPoints)
    disposeObject3D(stormPoints)
    stormPoints = null
  }
  // 释放 GDP 柱体
  if (pillarGroup) {
    disposeObject3D(pillarGroup)
    if (pillarGroup.parent) pillarGroup.parent.remove(pillarGroup)
    pillarGroup = null
  }
  pillarMeshes = []
  // 释放 overlayGroup（含自定义图层对象）
  if (overlayGroup) {
    disposeObject3D(overlayGroup)
    if (overlayGroup.parent) overlayGroup.parent.remove(overlayGroup)
    overlayGroup = null
  }
  // 释放真实地球高亮
  if (realisticHighlightMesh) {
    clearRealisticHighlight()
  }
  // 释放瓦片引擎并恢复地球本体可见性
  if (tileEngine) {
    disposeTileEngine(tileEngine)
    tileEngine = null
    if (sphereMesh) sphereMesh.visible = tileEngineBaseSphereVisible
  }
  // 停止并清理共享 Tween 组
  if (tweenGroup) {
    [...tweenGroup.getAll()].forEach(tween => { try { tween.stop() } catch (_e) { /* ignore */ } })
    tweenGroup.removeAll()
    tweenGroup = null
  }
  // 释放后处理
  composer?.dispose()
  // 清理 store 引用与备份状态
  countryMeshStates = []
  originalGdpColors = {}
  earthStore.setEarthGroup(null)
  disposeLabels?.(); disposeOrbit?.(); disposeScene?.()
})

// === 自定义数据导入 ===
async function loadCustomScatter(points) {
  await visualizationLayer?.switchVisualization('import', points)
}
function toggleCloud() {
  if (!cloudLayer) return
  cloudLayer.visible = !cloudLayer.visible
  return cloudLayer.visible
}

let nightMode = false
function toggleNightMode() {
  nightMode = !nightMode
  if (!sphereMesh) return nightMode
  sphereMesh.material.emissiveIntensity = nightMode ? 0 : 0.1
  sphereMesh.material.emissive.set(nightMode ? 0x112244 : 0x000022)
  return nightMode
}

function createStorm(lon = 139.7, lat = 35.7) {
  if (stormPoints) {
    stormPoints.removeFromParent()
    disposeObject3D(stormPoints)
  }
  stormPoints = createStormParticles(lon, lat, R, { color: 0x4488ff, particleCount: 600 })
  scene.add(stormPoints)
}

// === Bloom 后处理 ===
function toggleBloom() {
  if (!bloomPass) return false
  bloomPass.enabled = !bloomPass.enabled
  return bloomPass.enabled
}
let terrainActive = false
function toggleTerrain() {
  terrainActive = !terrainActive
  if (!earth?.meshArr) return terrainActive

  earth.meshArr.forEach(mesh => {
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    const orig = mesh.geometry.userData?._origPositions
    if (terrainActive) {
      if (!orig) {
        // 第一次：保存原始顶点
        const copy = new Float32Array(pos.array)
        mesh.geometry.userData = { ...mesh.geometry.userData, _origPositions: copy }
      }
      // 沿法线方向位移顶点
      const normals = mesh.geometry.attributes.normal
      for (let i = 0; i < pos.count; i++) {
        if (!normals) break
        const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i)
        const elevation = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * 4
        pos.setXYZ(i,
          mesh.geometry.userData._origPositions[i * 3] + nx * elevation,
          mesh.geometry.userData._origPositions[i * 3 + 1] + ny * elevation,
          mesh.geometry.userData._origPositions[i * 3 + 2] + nz * elevation
        )
      }
      pos.needsUpdate = true
      mesh.geometry.computeVertexNormals()
    } else {
      // 恢复原始顶点
      if (mesh.geometry.userData?._origPositions) {
        pos.array.set(mesh.geometry.userData._origPositions)
        pos.needsUpdate = true
        mesh.geometry.computeVertexNormals()
      }
    }
  })
  return terrainActive
}
</script>

<style scoped>
.earth-container { width: 100vw; height: 100vh; position: relative; overflow: hidden; }
.earth-canvas { display: block; }
.label-container { position: absolute; top: 0; left: 0; pointer-events: none; }
</style>
