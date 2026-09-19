<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'

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
  const Cesium = ctx.cesium
  ctx.viewer.imageryLayers.add(
    Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
      )
    )
  )
}
</script>
