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
import { TDT_TOKEN } from '@/examples/components/cesium-examples/cesiumConstants.js'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium: any = null
let viewer: any = null
let threeRenderer: any = null
let rafId: any = null

const minWGS84 = [115.23, 39.55]
const maxWGS84 = [116.23, 41.55]

const viewerOptions = {
  baseLayerPicker: false,
  imageryProvider: false,
  infoBox: false
}

function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  viewer.imageryLayers.addImageryProvider(
    new Cesium.WebMapTileServiceImageryProvider({
      url: `https://t0.tianditu.gov.cn/img_w/wmts?tk=${TDT_TOKEN}`,
      layer: "img",
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w"
    })
  )

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2 - 1, 200000),
    orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-60), roll: Cesium.Math.toRadians(0) }
  })

  initThree(viewer)
}

function initThree(viewerInstance: any) {
  const cesiumBox = viewerInstance.container
  const threeBox = document.createElement('div')
  Object.assign(threeBox.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '1',
    width: '100%',
    height: '100%',
    top: '0',
    left: '0'
  })
  cesiumBox.appendChild(threeBox)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, threeBox.clientWidth / threeBox.clientHeight, 1, 100000000)
  const renderer = new THREE.WebGLRenderer({ alpha: true })
  threeRenderer = renderer
  renderer.setSize(threeBox.clientWidth, threeBox.clientHeight)
  threeBox.appendChild(renderer.domElement)

  const group = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshNormalMaterial())
  group.add(box)

  const box2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
  box2.position.x += 6
  group.add(box2)

  ;(group as any).cesium = { minWGS84, maxWGS84 }
  scene.add(group)
  group.scale.set(15000, 15000, 15000)

  function render() {
    syncCesiumThree(group, camera, viewerInstance)
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(render)
  }

  window.addEventListener('resize', onResize)
  function onResize() {
    renderer.setSize(threeBox.clientWidth, threeBox.clientHeight)
    camera.aspect = threeBox.clientWidth / threeBox.clientHeight
    camera.updateProjectionMatrix()
  }

  render()
}

/* 相机同步 */
function syncCesiumThree(group: any, camera: any, viewerInstance: any) {
  camera.fov = Cesium.Math.toDegrees(viewerInstance.camera.frustum.fovy)
  const cartToVec = (cart: any) => new THREE.Vector3(cart.x, cart.y, cart.z)
  const { minWGS84: min, maxWGS84: max } = group.cesium

  const center = Cesium.Cartesian3.fromDegrees((min[0] + max[0]) / 2, (min[1] + max[1]) / 2)
  const centerHigh = Cesium.Cartesian3.fromDegrees((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, 1)
  const bottomLeft = cartToVec(Cesium.Cartesian3.fromDegrees(min[0], min[1]))
  const topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(min[0], max[1]))
  const latDir = new THREE.Vector3().subVectors(bottomLeft, topLeft).normalize()

  group.position.copy(center)
  group.lookAt(centerHigh.x, centerHigh.y, centerHigh.z)
  group.up.copy(latDir)

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
  if (threeRenderer) {
    threeRenderer.dispose()
    threeRenderer = null
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
