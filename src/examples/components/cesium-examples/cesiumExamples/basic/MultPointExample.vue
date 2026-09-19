<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'

const HOST = '/external-examples/three-cesium-examples/'

let Cesium: any = null
let viewer: any = null
let billboards: any = null

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

  viewer.imageryLayers.add(
    Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
      )
    )
  )

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromRadians(2.100117282185777, 0.6195146302793972, 104244.23864046125),
    orientation: {
      direction: new Cesium.Cartesian3(0.5153454276260272, -0.7794098602398831, 0.3562855034741005),
      up: new Cesium.Cartesian3(-0.1511548595883593, 0.326557215595639, 0.9330126437327882),
    },
  })

  viewer.screenSpaceEventHandler.setInputAction(function (event: any) {
    const object = viewer.scene.pick(event.position)
    if (object && object.id) {
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  billboards = new Cesium.BillboardCollection()
  viewer.scene.primitives.add(billboards)

  const color = () => new Cesium.Color(Math.random(), Math.random(), Math.random(), 1)

  for (let longitude = -180; longitude < 180; longitude++) {
    for (let latitude = -90; latitude < 90; latitude++) {
      billboards.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        image: HOST + '/files/author/z2586300277.png',
        scale: 0.1,
        color: color(),
        id: 'billboard' + '-' + longitude + '-' + latitude,
      })
    }
  }
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    if (billboards) {
      viewer.scene.primitives.remove(billboards)
      billboards = null
    }
  }
  Cesium = null
  viewer = null
}
</script>
