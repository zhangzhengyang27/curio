<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import * as dat from 'dat.gui';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium = null
let viewer = null

function viewerOptions(Cesium) {
  return {
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    shouldAnimate: true,
    infoBox: false,
    selectionIndicator: false,
    sceneModePicker: false,
    shadows: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')
    ),
}
}

async function onReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url) => FILE_HOST + url,
    ElMessage: (msg) => console.log('[ElMessage]', msg)
  }

  viewer.scene.globe.depthTestAgainstTerrain = true
  
  const tileset = await Cesium.Cesium3DTileset.fromUrl(TILESET_URL)
  viewer.scene.primitives.add(tileset)
  await viewer.flyTo(tileset)
  
  function addPoint(position, color) {
      return viewer.entities.add({
          position,
          point: {
              pixelSize: 20,
              clampToGround: true,
              color,
          },
      })
  }
  
  // 观察点，相机所在的位置
  const observe = Cesium.Cartesian3.fromDegrees(
      121.479933144824,
      29.79248487011,
      104.167
  )
  addPoint(observe, Cesium.Color.GOLD)
  
  // 观察方向终点
  const view = Cesium.Cartesian3.fromDegrees(121.478780989946, 29.789676141017, 2.621)
  addPoint(view, Cesium.Color.RED)
  
  const viewshedOptions = {
      observe,
      viewPosition: view,
      size: 4096,
      near: 1,
      fov: 120,
      aspectRatio: 1.5,
      debug: true,
  }
  
  const viewshed = new ViewShedAnalyser(viewer, viewshedOptions)
  
  viewshed.update()
  
  const far = viewshed.far
  const gui = new dat.GUI()
  const controls = {
      near: viewshedOptions.near,
      far,
      fov: viewshedOptions.fov,
      debug: viewshedOptions.debug,
      xRotation: 0,
      yRotation: 0,
      vAngle: viewshedOptions.fov / viewshedOptions.aspectRatio,
  }
  const rotation = {
      x: 0,
      y: 0,
  }
  
  function updateAspectRatio() {
      viewshed.aspectRatio = controls.fov / controls.vAngle
  }
  
  function rotateByDelta(axis, value, rotate) {
      const delta = value - rotation[axis]
      rotate(delta)
      rotation[axis] = value
  }
  
  gui.add(controls, 'near', 0.5, 2, 0.1).name('近截面').onChange((value) => {
      viewshed.near = value
  })
  
  gui.add(controls, 'far', far - 100, far + 100, 1).name('远截面').onChange((value) => {
      viewshed.far = value
  })
  
  gui.add(controls, 'fov', 60, 120, 1).name('水平夹角').onChange((value) => {
      viewshed.fov = value
      updateAspectRatio()
  })
  
  gui.add(controls, 'vAngle', 30, 90, 1).name('垂直夹角').onChange(updateAspectRatio)
  
  gui.add(controls, 'xRotation', -45, 45, 1).name('水平方向旋转').onChange((value) => {
      rotateByDelta('x', value, (delta) => viewshed.rotateLeft(delta))
  })
  
  gui.add(controls, 'yRotation', -45, 45, 1).name('垂直方向旋转').onChange((value) => {
      rotateByDelta('y', value, (delta) => viewshed.rotateUp(delta))
  })
  
  gui.add(controls, 'debug').name('调试').onChange((value) => {
      viewshed.debug = value
  })
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  Cesium = null
  viewer = null
}
</script>
