<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium: any = null
let viewer: any = null
let rafId: any = null
let renderer: any = null
let pickHandler: any = null

const CENTER_WGS84 = [115.73, 40.55]
const TERRAIN_FOLLOW = { scale: 120, offset: 5, intervalMs: 1500 }
const FUSION_CONFIG = {
  pulse: { speed: 1.8, min: 0.7, max: 1.35 },
  ring: { radius: 14, speed: 0.9 },
  rotate: 0.35,
  fly: { speed: 0.22, radius: 0.22 }
}

const viewerOptions = {
  baseLayerPicker: false,
  imageryProvider: false,
  infoBox: false,
  animation: false,
  timeline: false,
  useDefaultRenderLoop: false
}

async function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"

  const Y_UP_TO_Z_UP = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromRotationX(Cesium.Math.PI_OVER_TWO)
  )

  const url = 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
  const layer = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.ArcGisMapServerImageryProvider.fromUrl(url)
  )
  viewer.imageryLayers.add(layer)

  viewer.terrainProvider = await Cesium.createWorldTerrainAsync({
    requestWaterMask: true,
    requestVertexNormals: true
  })

  const centerCartesian = Cesium.Cartesian3.fromDegrees(CENTER_WGS84[0], CENTER_WGS84[1], 2500)

  viewer.fusionEntities = {
    anchor: viewer.entities.add({
      id: 'fusion-anchor',
      position: centerCartesian,
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString('#58d5ff'),
        outlineColor: Cesium.Color.fromCssColorString('#0a2238'),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: 'Fusion Core',
        fillColor: Cesium.Color.fromCssColorString('#7fe7ff'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        scale: 0.75,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    }),
    orbit: viewer.entities.add({
      id: 'fusion-orbit',
      position: new Cesium.CallbackProperty((time: any, result: any) => {
        const seconds = Cesium.JulianDate.secondsDifference(time, viewer.clock.startTime)
        const angle = seconds * 0.34
        const lon = CENTER_WGS84[0] + Math.cos(angle) * 0.18
        const lat = CENTER_WGS84[1] + Math.sin(angle) * 0.12
        return Cesium.Cartesian3.fromDegrees(lon, lat, 4200, Cesium.Ellipsoid.WGS84, result)
      }, false),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#ffbe4d'),
        outlineColor: Cesium.Color.fromCssColorString('#5b2e00'),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })
  }

  viewer.scene.globe.depthTestAgainstTerrain = true
  viewer.scene.globe.enableLighting = true
  viewer.scene.highDynamicRange = true
  viewer.scene.fxaa = true
  viewer.scene.postProcessStages.fxaa.enabled = true
  viewer.scene.skyAtmosphere.show = true
  viewer.scene.fog.enabled = true
  viewer.clock.shouldAnimate = true
  viewer.clock.multiplier = 1

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(CENTER_WGS84[0], CENTER_WGS84[1] - 0.22, 42000),
    orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-60), roll: Cesium.Math.toRadians(0) }
  })

  initThree(viewer, FILE_HOST, Y_UP_TO_Z_UP)
}

function initThree(viewerInstance: any, FILE_HOST: any, Y_UP_TO_Z_UP: any) {
  const canvas = viewerInstance.scene.canvas
  const gl = viewerInstance.scene.context._gl
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 1, 100000000)
  renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true })
  renderer.autoClear = false
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

  const clock = new THREE.Clock()
  const raycaster = new THREE.Raycaster()
  const pointerNdc = new THREE.Vector2()
  pickHandler = new Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas)
  const scratchThreeCartesian = new Cesium.Cartesian3()
  const pickState = { activeThree: null, activeCesium: null, previousCesiumColor: null, previousCesiumPixelSize: null }

  const worldRoot = new THREE.Group()
  placeObjectOnEarth(worldRoot, CENTER_WGS84[0], CENTER_WGS84[1], 3200, TERRAIN_FOLLOW.scale, Y_UP_TO_Z_UP)
  scene.add(worldRoot)

  startTerrainFollow(viewerInstance, worldRoot, CENTER_WGS84[0], CENTER_WGS84[1], TERRAIN_FOLLOW, Y_UP_TO_Z_UP)
  loadFusionModel(worldRoot, FILE_HOST)

  const box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshStandardMaterial({
    color: 0x66ccff, emissive: 0x0f3d55, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.35
  }))
  box.userData.label = 'three-box-1'
  box.userData.pickable = true
  box.position.y = 2
  worldRoot.add(box)

  const box2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 8), new THREE.MeshStandardMaterial({
    color: 0xff4040, emissive: 0x801010, emissiveIntensity: 1.1, metalness: 0.1, roughness: 0.4
  }))
  box2.userData.label = 'three-box-2'
  box2.userData.pickable = true
  box2.position.y = 1
  box2.position.x += 6
  worldRoot.add(box2)

  const scanRing = createScanRing(FUSION_CONFIG.ring.radius)
  scanRing.rotation.x = Math.PI / 2
  scanRing.position.y = 0.15
  worldRoot.add(scanRing)

  const lineA = createFlowLine([
    new THREE.Vector3(-14, 0, -4),
    new THREE.Vector3(-7, 7, 2),
    new THREE.Vector3(3, 4, 0),
    new THREE.Vector3(12, 0, 5)
  ], '#5bd6ff', FUSION_CONFIG.fly.radius)
  lineA.userData.label = 'fusion-flow-a'
  lineA.userData.pickable = true
  worldRoot.add(lineA)

  const lineB = createFlowLine([
    new THREE.Vector3(10, 0, -8),
    new THREE.Vector3(4, 5, -2),
    new THREE.Vector3(-4, 5, 4),
    new THREE.Vector3(-11, 0, 9)
  ], '#ffb66e', FUSION_CONFIG.fly.radius * 0.85)
  lineB.userData.label = 'fusion-flow-b'
  lineB.userData.pickable = true
  worldRoot.add(lineB)

  scene.fog = new THREE.Fog(0x112233, 90000, 360000)

  const keyLight = new THREE.DirectionalLight(0xa8d8ff, 1.2)
  keyLight.position.set(1, 2, 1)
  scene.add(keyLight)

  const fillLight = new THREE.AmbientLight(0x7aa4d6, 0.55)
  scene.add(fillLight)

  pickHandler.setInputAction((movement: any) => {
    const position = movement.position
    const threePick = pickThreeObject(position, renderer, camera, scene, raycaster, pointerNdc)
    const cesiumPick = viewerInstance.scene.pick(position)
    const winner = resolveUnifiedPick(position, threePick, cesiumPick, viewerInstance, scratchThreeCartesian)

    if (winner === 'three' && threePick) {
      setThreeHighlight(threePick.object, pickState)
      setCesiumHighlight(null, pickState)
    } else if (winner === 'cesium') {
      setThreeHighlight(null, pickState)
      setCesiumHighlight(resolvePickedCesiumEntity(cesiumPick), pickState)
    } else {
      setThreeHighlight(null, pickState)
      setCesiumHighlight(null, pickState)
    }

    if (threePick || cesiumPick) {
      const threeName = threePick?.object?.userData?.label || threePick?.object?.name || 'unnamed-three-object'
      const cesiumName = cesiumPick?.id?.id || cesiumPick?.id?.name || cesiumPick?.primitive?.constructor?.name || 'unknown-cesium-target'
      console.log('[UnifiedPick]', { three: threePick ? threeName : null, cesium: cesiumPick ? cesiumName : null, winner })
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  viewerInstance.scene.postRender.addEventListener(() => {
    const elapsed = getFusionTimeSeconds(viewerInstance, clock)
    animateFusion(elapsed, box, box2, scanRing, [lineA, lineB])
    syncCesiumThree(camera, viewerInstance)
    renderer.resetState()
    renderer.render(scene, camera)
  })

  function render() {
    viewerInstance.render()
    rafId = requestAnimationFrame(render)
  }

  function onResize() {
    viewerInstance.resize()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()
  }

  window.addEventListener('resize', onResize)
  render()
}

function loadFusionModel(worldRoot: any, FILE_HOST: any) {
  const dracoLoader = new DRACOLoader().setDecoderPath(FILE_HOST + 'js/three/draco/')
  new GLTFLoader()
    .setDRACOLoader(dracoLoader)
    .load(
      '/external-examples/3d-file-server/files/model/LittlestTokyo.glb',
      (gltf) => {
        const model = gltf.scene
        model.scale.setScalar(0.015)
        model.position.set(0, 0, 0)
        model.rotation.y = Math.PI * 0.35
        model.updateMatrixWorld(true)
        const bounds = new THREE.Box3().setFromObject(model)
        if (Number.isFinite(bounds.min.y)) model.position.y -= bounds.min.y
        model.traverse((obj) => {
          if (!(obj as THREE.Mesh).isMesh) return
          obj.userData.pickable = true
          obj.userData.label = obj.userData.label || obj.name || 'littlest-tokyo'
          obj.castShadow = false
          obj.receiveShadow = false
        })
        worldRoot.add(model)
      },
      undefined,
      (error) => console.error('[LittlestTokyoLoadError]', error)
    )
}

function startTerrainFollow(viewerInstance: any, object3D: any, lon: any, lat: any, options: any, Y_UP_TO_Z_UP: any) {
  let syncing: boolean = false
  let lastSync: number = 0

  const sync = async () => {
    if (syncing) return
    syncing = true
    try {
      const samples = [Cesium.Cartographic.fromDegrees(lon, lat)]
      const [cartographic] = await Cesium.sampleTerrainMostDetailed(viewerInstance.terrainProvider, samples)
      const terrainHeight = Number.isFinite(cartographic?.height) ? cartographic.height : 0
      placeObjectOnEarth(object3D, lon, lat, terrainHeight + options.offset, options.scale, Y_UP_TO_Z_UP)
    } catch (error) {
      console.warn('[TerrainFollowWarn]', error)
    } finally {
      syncing = false
    }
  }

  sync()
  viewerInstance.scene.postRender.addEventListener(() => {
    const now = Date.now()
    if (now - lastSync < options.intervalMs) return
    lastSync = now
    sync()
  })
}

function createScanRing(radius: any) {
  const geometry = new THREE.RingGeometry(radius * 0.6, radius, 96)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#3fd2ff') } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p) * 2.0;
        float wave = abs(sin((d - uTime * ${FUSION_CONFIG.ring.speed.toFixed(1)}) * 18.0));
        float edge = smoothstep(1.0, 0.2, d);
        float alpha = edge * (0.22 + wave * 0.45);
        gl_FragColor = vec4(uColor, alpha);
      }
    `
  })
  return new THREE.Mesh(geometry, material)
}

function createFlowLine(points: any, color: any, radius: any) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, 140, radius, 12, false)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSpeed: { value: FUSION_CONFIG.fly.speed }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSpeed;
      uniform vec3 uColor;
      void main() {
        float head = fract(uTime * uSpeed);
        float distA = abs(vUv.x - head);
        float distB = 1.0 - distA;
        float dist = min(distA, distB);
        float tail = smoothstep(0.26, 0.0, dist);
        float body = 0.12;
        float alpha = max(body, tail) * 0.92;
        gl_FragColor = vec4(uColor, alpha);
      }
    `
  })
  return new THREE.Mesh(geometry, material)
}

function animateFusion(elapsed: any, box: any, box2: any, scanRing: any, flowLines: any) {
  box.rotation.y = elapsed * FUSION_CONFIG.rotate
  box2.rotation.z = elapsed * (FUSION_CONFIG.rotate * 1.35)
  const pulse = (Math.sin(elapsed * FUSION_CONFIG.pulse.speed) + 1) * 0.5
  const emissive = THREE.MathUtils.lerp(FUSION_CONFIG.pulse.min, FUSION_CONFIG.pulse.max, pulse)
  if (box.material?.emissiveIntensity !== undefined) box.material.emissiveIntensity = emissive
  if (box2.material?.emissiveIntensity !== undefined) box2.material.emissiveIntensity = emissive * 1.1
  scanRing.scale.setScalar(0.9 + pulse * 0.25)
  scanRing.material.uniforms.uTime.value = elapsed
  flowLines.forEach((line: any, i: any) => { line.material.uniforms.uTime.value = elapsed + i * 0.8 })
}

function pickThreeObject(position: any, rendererInstance: any, camera: any, scene: any, raycaster: any, pointerNdc: any) {
  const width = rendererInstance.domElement.clientWidth
  const height = rendererInstance.domElement.clientHeight
  pointerNdc.x = position.x / width * 2 - 1
  pointerNdc.y = -(position.y / height) * 2 + 1
  raycaster.setFromCamera(pointerNdc, camera)
  const intersections = raycaster.intersectObjects(scene.children, true)
  return intersections.find((item: any) => item.object.userData.pickable)
}

function resolveUnifiedPick(position: any, threePick: any, cesiumPick: any, viewerInstance: any, scratchThreeCartesian: any) {
  if (!threePick && !cesiumPick) return null
  if (threePick && !cesiumPick) return 'three'
  if (!threePick && cesiumPick) return 'cesium'
  const cameraPos = viewerInstance.camera.positionWC
  scratchThreeCartesian.x = threePick.point.x
  scratchThreeCartesian.y = threePick.point.y
  scratchThreeCartesian.z = threePick.point.z
  const threeDistance = Cesium.Cartesian3.distance(cameraPos, scratchThreeCartesian)
  let cesiumDistance = Number.POSITIVE_INFINITY
  if (viewerInstance.scene.pickPositionSupported) {
    const pickedPosition = viewerInstance.scene.pickPosition(position)
    if (Cesium.defined(pickedPosition)) cesiumDistance = Cesium.Cartesian3.distance(cameraPos, pickedPosition)
  }
  return threeDistance <= cesiumDistance ? 'three' : 'cesium'
}

function resolvePickedCesiumEntity(cesiumPick: any) {
  if (!cesiumPick?.id) return null
  if (!cesiumPick.id.point) return null
  return cesiumPick.id
}

function setThreeHighlight(object: any, state: any) {
  if (state.activeThree?.userData.baseScale) state.activeThree.scale.copy(state.activeThree.userData.baseScale)
  state.activeThree = null
  if (!object) return
  if (!object.userData.baseScale) object.userData.baseScale = object.scale.clone()
  object.scale.copy(object.userData.baseScale).multiplyScalar(1.15)
  state.activeThree = object
}

function setCesiumHighlight(entity: any, state: any) {
  if (state.activeCesium?.point && state.previousCesiumColor && state.previousCesiumPixelSize !== null) {
    state.activeCesium.point.color = new Cesium.ConstantProperty(state.previousCesiumColor)
    state.activeCesium.point.pixelSize = new Cesium.ConstantProperty(state.previousCesiumPixelSize)
  }
  state.activeCesium = null
  state.previousCesiumColor = null
  state.previousCesiumPixelSize = null
  if (!entity?.point) return
  const previousColor = entity.point.color?.getValue(Cesium.JulianDate.now()) || Cesium.Color.WHITE
  const previousSize = entity.point.pixelSize?.getValue(Cesium.JulianDate.now()) || 8
  state.previousCesiumColor = Cesium.Color.clone(previousColor)
  state.previousCesiumPixelSize = previousSize
  state.activeCesium = entity
  entity.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#fff173'))
  entity.point.pixelSize = new Cesium.ConstantProperty(previousSize + 4)
}

function getFusionTimeSeconds(viewerInstance: any, fallbackClock: any) {
  const now = viewerInstance.clock.currentTime
  const start = viewerInstance.clock.startTime
  const seconds = Cesium.JulianDate.secondsDifference(now, start)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds
  return fallbackClock.getElapsedTime()
}

function placeObjectOnEarth(object3D: any, lon: any, lat: any, height = 0, scale = 1, Y_UP_TO_Z_UP: any) {
  const origin = Cesium.Cartesian3.fromDegrees(lon, lat, height)
  const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin)
  const scaleMatrix = Cesium.Matrix4.fromUniformScale(scale)
  const orientedMatrix = Cesium.Matrix4.multiply(enuMatrix, Y_UP_TO_Z_UP, new Cesium.Matrix4())
  const worldMatrix = Cesium.Matrix4.multiply(orientedMatrix, scaleMatrix, new Cesium.Matrix4())
  object3D.matrixAutoUpdate = false
  object3D.matrix.set(
    worldMatrix[0], worldMatrix[4], worldMatrix[8], worldMatrix[12],
    worldMatrix[1], worldMatrix[5], worldMatrix[9], worldMatrix[13],
    worldMatrix[2], worldMatrix[6], worldMatrix[10], worldMatrix[14],
    worldMatrix[3], worldMatrix[7], worldMatrix[11], worldMatrix[15]
  )
}

function syncCesiumThree(camera: any, viewerInstance: any) {
  camera.fov = Cesium.Math.toDegrees(viewerInstance.camera.frustum.fovy)
  camera.matrixAutoUpdate = false
  const cvm = viewerInstance.camera.viewMatrix
  const civm = viewerInstance.camera.inverseViewMatrix
  camera.matrixWorld.set(
    civm[0], civm[4], civm[8], civm[12],
    civm[1], civm[5], civm[9], civm[13],
    civm[2], civm[6], civm[10], civm[14],
    civm[3], civm[7], civm[11], civm[15]
  )
  camera.matrixWorldInverse.set(
    cvm[0], cvm[4], cvm[8], cvm[12],
    cvm[1], cvm[5], cvm[9], cvm[13],
    cvm[2], cvm[6], cvm[10], cvm[14],
    cvm[3], cvm[7], cvm[11], cvm[15]
  )
  camera.updateProjectionMatrix()
}

function onBeforeDispose() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (pickHandler && !pickHandler.isDestroyed()) {
    pickHandler.destroy()
    pickHandler = null
  }
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  if (viewer && !viewer.isDestroyed()) {
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  Cesium = null
  viewer = null
}
</script>
