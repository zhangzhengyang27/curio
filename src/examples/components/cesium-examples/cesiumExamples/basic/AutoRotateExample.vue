<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'

let Cesium: any = null
let viewer: any = null
let tickListener: any = null

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

  tickListener = viewer.clock.onTick.addEventListener(() => {
    viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.01)
  })
}

function onBeforeDispose() {
  if (tickListener) {
    tickListener()
    tickListener = null
  }
  Cesium = null
  viewer = null
}
</script>
