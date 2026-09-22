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
    <div
      v-if="glError"
      class="gl-error"
      role="alert"
      data-testid="gl-error"
    >
      {{ glError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { useScene } from '../composables/useScene'
import { useRenderLoop } from '../composables/useRenderLoop'
import { useOrbitControls } from '../composables/useOrbitControls'
import { useRaycaster } from '../composables/useRaycaster'
import { useLabels } from '../composables/useLabels'
import { createHtmlMarkers, updateHtmlMarkersVisibility } from '../three/objects/HtmlMarkers'
import { disposeObject3D } from '../three/gc'
import { useCameraFlight } from '../composables/useCameraFlight'
import { createEarth } from '../three/objects/EarthSphere'
import { createAtmosphereGlow } from '../three/objects/AtmosphereGlow'
import { createGraticules } from '../three/objects/Graticules'
import { createTileEngine, updateTileEnginePOV, disposeTileEngine } from '../three/objects/TileEngine'
import { createCloudLayer } from '../three/objects/CloudLayer'
import { createStormParticles, updateStormParticles } from '../three/objects/ParticleField'
import { lon2xyz } from '../three/geo/coord'
import * as TWEEN from '@tweenjs/tween.js'
import { buildEarthFromData, buildSearchIndex, loadWorldData } from '../three/data/DataLoader'
import { VisualizationLayer } from '../three/layers/VisualizationLayer'
import type { CountryGdpMesh, EarthGroupWithMeshes } from '../three/layers/BaseLayer'
import type { TexturedEarthGroup } from '../three/objects/EarthSphere'
import type { GdpColorEntry } from '../three/data/DataLoader'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type SlippyMapGlobe from 'three-slippy-map-globe'
import { useEarthStore } from '../stores/useEarthStore'
import { useInteractionStore } from '../stores/useInteractionStore'
import { useLayerStore } from '../stores/useLayerStore'
import { useTimelineStore } from '../stores/useTimelineStore'

/**
 * primary=false 用于双屏对比：全局 store 描述的是「那一个地球」，
 * 两块画布抢写同一份 earthGroup / layerChildren 会让后挂的赢、
 * 先卸载的把幸存的那块也清成 null。
 */
const props = withDefaults(defineProps<{ primary?: boolean }>(), { primary: true })

const R = 100
const canvasRef = ref<HTMLCanvasElement | null>(null)
const labelContainer = ref<HTMLElement | null>(null)
// WebGL 起不来 / 上下文丢失时给一句人话，而不是留一片安静的黑
const glError = ref<string | null>(null)

const earthStore = useEarthStore()
const interactionStore = useInteractionStore()
const layerStore = useLayerStore()
const timelineStore = useTimelineStore()

const raycasterCtx = useRaycaster()
const renderLoop = useRenderLoop()
const { intersect, clearSelection, selectMesh } = raycasterCtx

let scene: THREE.Scene
let camera: THREE.Camera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let disposeOrbit: () => void
let disposeScene: () => void
let stopLoop: () => void
let disposeLabels: () => void
let labelManager: ReturnType<typeof useLabels> & { mainLabel?: CSS2DObject }
let flyToFn: (lon: number, lat: number, duration?: number) => void
// 渲染循环里那个 renderFn 的引用，供「取一帧」用（见 captureFrame）
let renderFrameFn: (() => void) | null = null
let cancelFlight: () => void
let earth: TexturedEarthGroup
let overlayGroup: THREE.Group | null
let canvasEl: HTMLCanvasElement | null = null
let visualizationLayer: VisualizationLayer
let htmlMarkersGroup: THREE.Group | null = null
let atmosphere: THREE.Mesh
let cloudLayer: THREE.Mesh
let stormPoints: THREE.Points | THREE.Group | null
let sphereMesh: THREE.Mesh // sphereMesh保存地球球体引用
let composer: EffectComposer | null = null
let bloomPass: UnrealBloomPass | null = null // post-processing，按需创建（见 ensureComposer）
let originalGdpColors: Record<string, { color: THREE.Color; gdp?: number }> = {} // 保存GDP原始颜色用于恢复
let pillarGroup: THREE.Group | null = null // GDP柱状动画组
interface PillarEntry {
  bar: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial & { color: THREE.Color; emissive: THREE.Color }>
  dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial & { color: THREE.Color }>
  name: string
  height: number
  targetHeight: number
  growth: number
  base: THREE.Vector3
  dir: THREE.Vector3
  tweening?: boolean
}
let pillarMeshes: PillarEntry[] = [] // [{mesh, name}]
let isAnimatingIn = false // 入场动画期间暂停自转
let tweenGroup: TWEEN.Group | null = null // 图层共享 Tween 组
let graticulesMesh: THREE.LineSegments | null = null // 经纬网格
let tileEngine: SlippyMapGlobe | null = null // 瓦片引擎
let tileEngineBaseSphereVisible = true // 瓦片激活前记录地球本体可见性
let isRealisticEarth = false // 是否使用真实地球贴图
let proceduralTexture: THREE.Texture | null = null // 程序生成的地球纹理备份
let countryMeshStates: Array<{ mesh: CountryGdpMesh; opacity: number; transparent: boolean }> = [] // 国家 Mesh 的原始材质状态备份
let realisticHighlightMesh: CountryGdpMesh | null = null // 真实地球模式下高亮的国家 Mesh
// onMounted 是 async（要等 worldData / timeline 两个网络请求），期间切走路由会先跑
// onUnmounted；此时 stopLoop 仍为 undefined，续跑会把 rAF 启动在已 dispose 的场景上，
// 既永不退出又整体泄漏。所有 await 之后都要用这个标志早退。
let disposed = false

onMounted(async () => {
  try {
    if (!canvasRef.value) return
    canvasEl = canvasRef.value
    const sceneCtx = useScene(canvasEl)
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
    labelContainer.value!.appendChild(labelManager.labelRenderer.domElement)
    const { label } = labelManager.createLabelEl('GDP')
    scene.add(label); labelManager.mainLabel = label; disposeLabels = labelManager.dispose

    // 标签层与画布同尺寸，否则 CSS2D 投影点与实际命中点错位
    const labelHost = canvasEl.parentElement
    const sizeLabels = (w?: number, h?: number) =>
      labelManager?.resize(w || labelHost?.clientWidth, h || labelHost?.clientHeight)
    sizeLabels()
    addResizeCallback((w, h) => {
      sizeLabels(w, h)
      // composer 的 RT 尺寸不会跟着 renderer 变，漏掉这步会让 Bloom 在 resize 后
      // 按旧尺寸渲染（EffectComposer 不会自己监听尺寸）
      composer?.setSize(w, h)
    })

    earth = createEarth(R, { tweenGroup })
    if (props.primary) earthStore.setEarthGroup(earth)
    scene.add(earth)

    // 云层
    cloudLayer = createCloudLayer(R, { opacity: 0.2 })
    scene.add(cloudLayer)

    overlayGroup = new THREE.Group(); scene.add(overlayGroup)

    // Post-processing 延迟到首次开启 Bloom 时再建（见 ensureComposer）：
    // UnrealBloomPass 一建就是 11 个 HalfFloat 渲染目标 + 4 个材质，
    // 而 Bloom 默认是关的，每次挂载白建一遍、卸载还漏（EffectComposer.dispose
    // 只释放 renderTarget1/2 和 copyPass，不会替 pass 收尾）。

    // 保存球体引用(buildEarthFromData会clear整个earthGroup)
    sphereMesh = earth.children[0] as THREE.Mesh
    proceduralTexture = (sphereMesh.material as THREE.MeshPhongMaterial).map ?? null

    const { world, gdpColorMap } = await loadWorldData()
    if (disposed) return
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
      earthGroup: earth as unknown as EarthGroupWithMeshes,
      R,
      parent: overlayGroup,
      flyToFn,
      originalGdpColors: originalGdpColors as Record<string, GdpColorEntry>,
      earthStore,
      tweenGroup: tweenGroup!
    })

    // 应用初始化空窗期间排队的可视化切换请求（来自用户，须带 fromUser 语义）
    if (pendingVizMode) {
      const queued = pendingVizMode
      pendingVizMode = null
      switchVisualization(queued, true)
    }

    // 加载时序GDP数据
    try {
      const tlData = await fetch('/data/mock/gdp-timeline.json').then(r => r.json())
      timelineStore.setYearlyData(tlData)
      // 默认不自动显示GDP柱状图，保持页面干净
    } catch (_e) { /* timeline data optional */ }
    if (disposed) return

    const borderKids: THREE.Object3D[] = [], meshKids: THREE.Object3D[] = []
    earth.traverse(child => {
      if (child.isLineLoop) borderKids.push(child)
      if (child.isMesh && child !== sphereMesh) meshKids.push(child)
    })
    if (props.primary) {
      layerStore.setLayerChildren('borders', borderKids)
      layerStore.setLayerChildren('countries', meshKids)
    }

    // 默认状态：真实地球、云层关闭、边界线关闭、无数据图例
    cloudLayer.visible = false
    toggleRealisticEarth()
    layerStore.setVisible('borders', false)
    // 初始化落在「无数据图例」的干净状态；启动期用户已点过可视化模式时，
    // 以用户的选择为准（此后到达的点击由 switchVisualization 正常处理）
    if (!userVizLocked) switchVisualization('default')

    const renderFn = () => {
      if (earthStore.isRotating && !isAnimatingIn) earth.rotateY(earthStore.rotationSpeed)
      // 同步 overlayGroup 旋转，使柱状图/圆柱散点与地球表面保持一致
      overlayGroup!.rotation.copy(earth.rotation)
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
          new TWEEN.Tween(pm, tweenGroup!)
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
      tweenGroup!.update(nowMs) // 图层共享 Tween 组，TWEEN 使用毫秒时间
      updateTileEnginePOV(tileEngine, camera)
      // Bloom 关闭时直接渲染，跳过 EffectComposer 的 pass 管线开销
      if (composer && bloomPass?.enabled) {
        composer.render()
      } else {
        renderer.render(scene, camera)
      }
      if (htmlMarkersGroup) {
        updateHtmlMarkersVisibility(htmlMarkersGroup, camera, R)
      }
      labelManager.labelRenderer.render(scene, camera)
    }
    renderFrameFn = renderFn
    renderLoop.setRenderFn(renderFn); renderLoop.start(); stopLoop = renderLoop.stop

    // 上下文丢失时 useScene 已经拦下默认行为，但渲染循环若继续跑就是对着
    // 已死的上下文出帧 —— 用户看到的是一个「冻住」的画布且没有任何提示。
    sceneCtx.onContextLostOnce(() => {
      renderLoop.stop()
      glError.value = 'WebGL 上下文已丢失（通常是 GPU 资源被系统回收），正在等待浏览器恢复…'
    })
    sceneCtx.onContextRestoredOnce(() => {
      glError.value = null
      renderLoop.start()
    })

    canvasEl.addEventListener('click', onCanvasClick)
    canvasEl.addEventListener('contextmenu', onContextMenu)
  } catch (err) {
    console.error('EarthCanvas init error:', err)
    // 建不出 WebGL 上下文时以前只有一行 console.error：页面一片黑、面板都在，
    // 用户无从知道是渲染层坏了还是数据没到
    glError.value = '地球 3D 渲染初始化失败，请检查浏览器是否启用 WebGL 或硬件加速。'
  }
})

function onCanvasClick(event: MouseEvent) {
  if (!camera) return
  // 用本实例自己的 earth，而不是全局 store 的 earthGroup：
  // 双屏对比下两块画布抢写同一份 store，从 store 取会拾到对面那块的 Mesh
  const hit = intersect(event, earth?.meshArr || [], camera)
  if (hit) {
    const mesh = hit.object as CountryGdpMesh; selectMesh(mesh); earthStore.selectCountry(mesh.name)
    if (mesh.gdp) labelManager.showLabel(labelManager.mainLabel!, hit.point, mesh.name + ' GDP：' + (mesh.gdp / 1000000000000).toFixed(3) + '万亿美元')
    else labelManager.showLabel(labelManager.mainLabel!, hit.point, mesh.name)
    interactionStore.openInfoPanel({ name: mesh.name, gdp: mesh.gdp ? (mesh.gdp / 1000000000000).toFixed(3) + ' 万亿美元' : '数据缺失', lon: mesh.userData?.lon, lat: mesh.userData?.lat })
  } else {
    clearSelection(); earthStore.selectCountry(null); labelManager.hideLabel(labelManager.mainLabel!); interactionStore.closeInfoPanel()
  }
}

function onContextMenu(event: MouseEvent) {
  event.preventDefault()
  if (!camera) return
  // 用本实例自己的 earth，而不是全局 store 的 earthGroup：
  // 双屏对比下两块画布抢写同一份 store，从 store 取会拾到对面那块的 Mesh
  const hit = intersect(event, earth?.meshArr || [], camera)
  if (hit) {
    const obj = hit.object as CountryGdpMesh
    interactionStore.openContextMenu(event.clientX, event.clientY, { name: obj.name, gdp: obj.gdp, mesh: obj, lon: obj.userData?.lon, lat: obj.userData?.lat })
  }
  else interactionStore.closeContextMenu()
}

// 这些模式切数据要走网络/构建，需要加载反馈；gdp/default/landmarks 是同步的
const VIZ_MODES_WITH_DATA = new Set(['population', 'carbon', 'trade', 'flights', 'earthquake', 'nightlights', 'china', 'heatmap'])

// 画布初始化完成前收到的切换请求会排队，就绪后自动应用
let pendingVizMode: string | null = null
// 最近一次真正应用到图层的模式。去重只认它，不认 store：
// 启动期 store 是乐观值（默认 'gdp'），初始化落地 'default' 后两者会脱节，
// 按 store 去重会把启动期点击静默丢弃。
let appliedVizMode: string | null = null
// 启动期用户已明确选过可视化模式；此后初始化不得再用 'default' 覆盖用户的选择
let userVizLocked = false

async function switchVisualization(mode: string, fromUser = false) {
  if (fromUser) userVizLocked = true
  // 画布未就绪时先排队（旧实现直接静默 no-op，用户启动期点击会被无声丢弃）
  if (!visualizationLayer) {
    pendingVizMode = mode
    return
  }
  if (mode === appliedVizMode) return
  appliedVizMode = mode
  earthStore.setVizError(null)
  if (VIZ_MODES_WITH_DATA.has(mode)) earthStore.setVizLoading(mode)
  try {
    await visualizationLayer?.switchVisualization(mode)
  } catch (err) {
    console.error('Viz switch error:', mode, err)
    // 失败必须回滚去重标记：不回滚的话再点同一个模式会被上面那行静默丢弃，
    // 用户看到的是「按钮亮着、画面什么都没有」，只能切到别的模式再切回来。
    appliedVizMode = null
    earthStore.setVizError(mode)
  } finally {
    // 快速连切时 vizLoading 可能已被更新的请求覆盖，只在仍归属本次时清除
    if (earthStore.vizLoading === mode) earthStore.setVizLoading(null)
  }
}

function setGlobeTexture(url: string) {
  earth?.setTexture?.(url)
}

function setGlobeBumpMap(url: string) {
  earth?.setBumpMap?.(url)
}

function addHtmlMarkers(markersData: Array<Record<string, any>>) {
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
function showGraticules(options: Record<string, any> = {}) {
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
function setTileEngineUrl(urlFn: (x: number, y: number, level: number) => string, maxLevel: number) {
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
    earth.setTexture('/textures/earth-blue-marble.webp')
    earth.setBumpMap('/textures/earth-topology.webp')
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
      const sphereMat = sphereMesh.material as THREE.MeshPhongMaterial
      const oldMap = sphereMat.map
      sphereMat.map = proceduralTexture
      sphereMat.needsUpdate = true
      if (oldMap && oldMap !== proceduralTexture) oldMap.dispose()
    }
    ;(sphereMesh.material as THREE.MeshPhongMaterial).bumpMap = null
    ;(sphereMesh.material as THREE.MeshPhongMaterial).needsUpdate = true
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

function setRealisticEarth(enabled: boolean) {
  if (!!enabled === isRealisticEarth) return isRealisticEarth
  return toggleRealisticEarth()
}

// === 真实地球模式下高亮选中的国家 Mesh ===
function highlightRealisticCountry(name: string) {
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

// 对外暴露的 switchVisualization 是用户入口（底栏点击 / 巡游 / URL hash），
// 一律视为用户主动选择，启动期可阻断初始化的 'default' 落地覆盖
/**
 * 渲染一帧并立刻取图。render 与 toDataURL 必须在同一次同步任务里：
 * renderer 未开 preserveDrawingBuffer，分开调用只会拿到清屏后的纯黑图
 * （实测旧「截图」按钮产出的 PNG 全帧只有 1 种颜色 0,0,0）。
 */
function captureFrame(): string | null {
  if (!renderFrameFn || !renderer) return null
  renderFrameFn()
  return renderer.domElement.toDataURL('image/png')
}

let captureScratch: HTMLCanvasElement | null = null

/**
 * 渲染一帧并按需降采样取像素，给 GIF 用。
 * 刻意不走 toDataURL + Image.decode：整画布 PNG 单次就有 ~2.7 MB，
 * 每 250ms 编一次会把主线程压死（实测连点两次录制按钮能把一次 JS 往返拖到超时）。
 */
function captureFrameScaled(maxWidth: number): { data: Uint8Array; w: number; h: number } | null {
  if (!renderFrameFn || !renderer) return null
  const src = renderer.domElement
  if (!src.width) return null
  const w = Math.min(maxWidth, src.width)
  const h = Math.max(1, Math.round((src.height / src.width) * w))
  if (!captureScratch) captureScratch = document.createElement('canvas')
  captureScratch.width = w
  captureScratch.height = h
  const ctx = captureScratch.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  renderFrameFn()
  // drawImage 与 render 必须同处一次同步任务，理由同 captureFrame
  ctx.drawImage(src, 0, 0, w, h)
  return { data: new Uint8Array(ctx.getImageData(0, 0, w, h).data.buffer), w, h }
}

defineExpose({ flyTo: (lon: number, lat: number, duration?: number) => flyToFn?.(lon, lat, duration), getRenderer: () => renderer, captureFrame, captureFrameScaled, getControls: () => controls, switchVisualization: (mode: string) => switchVisualization(mode, true), toggleCloud, toggleNightMode, createStorm, toggleTerrain, loadCustomScatter, toggleBloom, setGlobeTexture, setGlobeBumpMap, addHtmlMarkers, clearHtmlMarkers, showGraticules, hideGraticules, setTileEngineUrl, clearTileEngine, toggleRealisticEarth, setRealisticEarth })

// === Timeline year watch — GDP柱状动画 ===
const stopWatch = watch(() => timelineStore.currentYear, (year: number) => {
  if (!earth?.meshArr || !timelineStore.yearlyData) return
  // 切到GDP模式（走包装函数以维护 appliedVizMode，避免重复应用）
  if (earthStore.currentVisualization !== 'gdp') {
    switchVisualization('gdp')
  }
  updatePillars(year)
})

// === 真实地球模式下监听国家选中，高亮对应 Mesh ===
const stopWatchSelected = watch(() => earthStore.selectedCountry, (name) => {
  if (!isRealisticEarth) return
  if (name) highlightRealisticCountry(name)
  else clearRealisticHighlight()
})

function updatePillars(year: number) {
  const data = timelineStore.getPillarData(year)
  if (!data?.pillars?.length) return

  // 只保留在searchIndex中存在的国家(即world.json有对应Mesh的)
  const indexNames = new Set(Object.keys(earthStore.searchIndex))
  const pillars = data.pillars.filter(p => indexNames.has(p.name))

  if (!pillarGroup) {
    pillarGroup = new THREE.Group()
    overlayGroup!.add(pillarGroup)
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
      pillarGroup!.add(bar)

      const dotGeo = new THREE.SphereGeometry(1, 8, 4)
      const dotMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      pillarGroup!.add(dot)

      entry = { bar: bar as PillarEntry['bar'], dot: dot as PillarEntry['dot'], name: p.name, height: h, targetHeight: h, growth: 0, base, dir }
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
  disposed = true
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
  // 释放后处理。EffectComposer.dispose 只管 renderTarget1/2 与 copyPass，
  // 不会替 addPass 进去的 pass 收尾 —— bloomPass 的 11 个渲染目标必须自己释放。
  bloomPass?.dispose()
  bloomPass = null
  composer?.dispose()
  composer = null
  // 清理 store 引用与备份状态。非主画布（双屏对比的两块）从没写过这些，
  // 去清反而会把幸存那块赖以工作的引用抹掉。
  countryMeshStates = []
  originalGdpColors = {}
  if (props.primary) {
    earthStore.setEarthGroup(null)
    // 失败态是终态，跨路由留着会在下次进首页时凭空弹出一个无法解释的提示
    earthStore.setVizError(null)
    // layerStore 里的 children 指向刚被 dispose 的边界/色块 Object3D。
    // 不清的话：Pinia store 比组件活得久，卸载到下次进 / 之间这段时间里，
    // setVisible/setOpacity 会遍历一批已释放对象；已 dispose 的 geometry 也不该再被引用。
    // 注意只清 children，layer.visible / layer.opacity 是刻意跨路由保留的用户偏好。
    layerStore.setLayerChildren('borders', [])
    layerStore.setLayerChildren('countries', [])
  }
  disposeLabels?.(); disposeOrbit?.(); disposeScene?.()
})

// === 自定义数据导入 ===
async function loadCustomScatter(points: Array<Record<string, any>>) {
  await visualizationLayer?.switchVisualization('import', points)
  appliedVizMode = 'import'
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
  const mat = sphereMesh.material as THREE.MeshPhongMaterial & { emissive: THREE.Color }
  mat.emissiveIntensity = nightMode ? 0 : 0.1
  mat.emissive.set(nightMode ? 0x112244 : 0x000022)
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
/** 按画布实际尺寸惰性创建 composer + bloomPass（Bloom 默认关着，不该每次挂载都建） */
function ensureComposer(): EffectComposer | null {
  if (composer) return composer
  if (!renderer || !scene || !camera) return null
  const host = canvasEl?.parentElement
  const w = host?.clientWidth || window.innerWidth
  const h = host?.clientHeight || window.innerHeight
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.4, 0.85)
  // Pass 构造出来就是 enabled 的；不显式关掉的话，下面 toggleBloom 的第一次
  // 取反会把它从 true 翻成 false —— 用户点「辉光」反而看不到辉光。
  bloomPass.enabled = false
  composer.addPass(bloomPass)
  return composer
}

function toggleBloom() {
  if (!ensureComposer() || !bloomPass) return false
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
/* 填满宿主容器：写死 100vh 会在顶栏下方再溢出 56px（底部出屏、拾取与投影一起偏） */
.earth-container { width: 100%; height: 100%; position: relative; overflow: hidden; }
.earth-canvas { display: block; }
.gl-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--tv-gutter, 24px);
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  color: var(--tv-on-surface-variant);
  z-index: 60;
  pointer-events: none;
}
.label-container { position: absolute; top: 0; left: 0; pointer-events: none; }
</style>
