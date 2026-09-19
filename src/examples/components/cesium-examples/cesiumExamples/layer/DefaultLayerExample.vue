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
  imageryProvider: false,
  scene3DOnly: true,
  orderIndependentTranslucency: false,
  contextOptions: { webgl: { alpha: true } },
  skyBox: null,
}

function onReady(ctx: any) {
  const viewer = ctx.viewer
  viewer.scene.sun.show = false
  viewer.scene.moon.show = false
  viewer.scene.skyBox.show = false
  viewer.scene.backgroundColor = new ctx.cesium.Color(0.0, 0.0, 0.0, 0.0)
}
</script>
