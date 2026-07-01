<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import { CesiumHeatmap } from '../../cesiumHeatmap.js'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium = null
let viewer = null
let heatmap = null

function viewerOptions(Cesium) {
  return {
    animation: false,
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
      )
    ),
    fullscreenButton: false,
    timeline: false,
    infoBox: false
  }
}

function onReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  viewer._cesiumWidget._creditContainer.style.display = "none"

  const points = new Array(50).fill('').map(() => {
    return {
      x: 116.46 + Math.random() * 10,
      y: 39.92 + Math.random() * 10,
      value: Math.random()
    }
  })

  heatmap = new CesiumHeatmap(Cesium, viewer, {
    points,
    viewToLayer: true,
    heatmapDataOptions: { max: 1, min: 0 },
    heatmapOptions: {
      radius: 100,
      maxOpacity: 0.5,
      minOpacity: 0
    }
  })
}

function onBeforeDispose() {
  if (heatmap && typeof heatmap.remove === 'function') {
    heatmap.remove()
    heatmap = null
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
