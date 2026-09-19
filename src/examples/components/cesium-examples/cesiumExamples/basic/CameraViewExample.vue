<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import { GUI } from 'lil-gui'

const FILE_HOST = '/external-examples/3d-file-server/'

let Cesium: any = null
let viewer: any = null
let camera: any = null
let gui: any = null
let currentModel: any = null
let storage: any = null

const viewerOptions = {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  baseLayer: false,
}

function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer
  camera = viewer.camera

  viewer.imageryLayers.add(
    Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
      )
    )
  )

  try {
    storage = JSON.parse(sessionStorage.getItem('TCE_savedView') as string)
  } catch {
    storage = null
  }
  if (!storage) {
    storage = {
      url: FILE_HOST + '/examples/coffeeMug/coffeeMug.glb',
      view: null,
    }
  }

  if (storage.view) {
    const view = storage.view
    camera.positionWC.x = view.position.x
    camera.positionWC.y = view.position.y
    camera.positionWC.z = view.position.z
    camera.directionWC.x = view.direction.x
    camera.directionWC.y = view.direction.y
    camera.directionWC.z = view.direction.z
    camera.upWC.x = view.up.x
    camera.upWC.y = view.up.y
    camera.upWC.z = view.up.z
    camera.frustum.fov = view.frustum.fov
    camera.frustum.near = view.frustum.near
    camera.frustum.far = view.frustum.far

    if (storage.url) {
      loadModel(storage.url)
    }
  }

  gui = new GUI()

  gui.add(
    {
      '保存视角': () => {
        storage.view = saveView()
        sessionStorage.setItem('TCE_savedView', JSON.stringify(storage))
        alert('视角已保存')
      },
    },
    '保存视角'
  )

  gui.add(
    {
      '恢复保存视角': () => {
        const s = JSON.parse(sessionStorage.getItem('TCE_savedView') as string)
        if (s && s.view) loadView(s.view)
        else alert('没有保存的视角数据')
      },
    },
    '恢复保存视角'
  )

  gui.add(storage, 'url')
  gui.add(
    {
      '加载模型': () => {
        loadModel(storage.url)
      },
    },
    '加载模型'
  )
}

function cartesian3ToDegrees(cartesian3: any) {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian3)
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height,
  }
}

function saveView() {
  return {
    positionDegrees: cartesian3ToDegrees(camera.positionWC),
    position: camera.positionWC,
    direction: camera.directionWC,
    up: camera.upWC,
    frustum: {
      fov: camera.frustum.fov,
      near: camera.frustum.near,
      far: camera.frustum.far,
    },
    heading: camera.heading,
    pitch: camera.pitch,
    roll: camera.roll,
  }
}

function loadView(view: any) {
  if (!view) {
    alert('没有保存的视角数据')
    return
  }
  if (Math.random() > 0.5) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        view.positionDegrees.longitude,
        view.positionDegrees.latitude,
        view.positionDegrees.height
      ),
      orientation: {
        heading: view.heading,
        pitch: view.pitch,
        roll: view.roll,
      },
    })
  } else {
    camera.setView({
      destination: view.position,
      orientation: {
        heading: view.heading,
        pitch: view.pitch,
        roll: view.roll,
      },
    })
  }
}

function loadModel(url: string) {
  if (currentModel) {
    viewer.scene.primitives.remove(currentModel)
    currentModel = null
  }
  Cesium.Model.fromGltfAsync({
    url,
    minimumPixelSize: 128,
    maximumScale: 200,
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(139.767052, 35.681167, 0)
    ),
  }).then((model: any) => {
    currentModel = model
    viewer.scene.primitives.add(model)
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(139.767052, 35.681167, 500),
    })
  })
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    if (currentModel) {
      viewer.scene.primitives.remove(currentModel)
      currentModel = null
    }
  }
  if (gui) {
    gui.destroy()
    gui = null
  }
  Cesium = null
  viewer = null
  camera = null
}
</script>
