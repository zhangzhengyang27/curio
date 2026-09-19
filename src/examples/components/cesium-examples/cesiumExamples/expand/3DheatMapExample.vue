<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import { create3DHeatmap } from '../../cesiumHeatmap.js'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium: any = null
let viewer: any = null
let heatmap: any = null

function viewerOptions(Cesium: any) {
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

function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  viewer._cesiumWidget._creditContainer.style.display = "none"

  const points = new Array(50).fill("").map(() => {
    return {
      lnglat: [
        116.46 + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1),
        39.92 + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1)
      ],
      value: 1000 * Math.random()
    }
  })

  heatmap = create3DHeatmap(Cesium, viewer, {
    dataPoints: points,
    radius: 15,
    baseElevation: 0,
    primitiveType: "TRIANGLES",
    colorGradient: {
      ".3": "blue",
      ".5": "green",
      ".7": "yellow",
      ".95": "red"
    }
  })

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.46, 39.92, 100000),
    orientation: {},
    duration: 3
  })
}

function onBeforeDispose() {
  if (heatmap && typeof heatmap.destroy === 'function') {
    heatmap.destroy()
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
