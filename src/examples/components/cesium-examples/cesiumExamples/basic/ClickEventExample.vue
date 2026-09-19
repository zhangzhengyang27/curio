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
let entities: any[] = []

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

  viewer.screenSpaceEventHandler.setInputAction(function (event: any) {
    const object = viewer.scene.pick(event.position)
    const cartesian = viewer.scene.pickPosition(event.position)

    if (Cesium.defined(cartesian)) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      const longitude = Cesium.Math.toDegrees(cartographic.longitude)
      const latitude = Cesium.Math.toDegrees(cartographic.latitude)
      const height = cartographic.height
      console.log('经度：', longitude, '纬度：', latitude, '高度：', height)
    }

    if (Cesium.defined(object) && object.id) {
      alert('点击到的对象：' + object.id.name + '-----id：' + object.id.id)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 10000000),
  })

  const point = viewer.entities.add({
    name: '测试点',
    id: '点-id',
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.9),
    point: {
      pixelSize: 10,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
  })
  entities.push(point)

  const polygon = viewer.entities.add({
    name: '测试多边形',
    id: '多边形-id',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        90.38, 30.91,
        80.38, 30.89,
        100.4, 39.89,
        105.4, 39.91,
      ]),
      material: Cesium.Color.RED.withAlpha(0.5),
    },
  })
  entities.push(polygon)

  const polyline = viewer.entities.add({
    name: '测试线段',
    id: '线段-id',
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        116.41, 36.91,
        100.41, 30.89,
      ]),
      width: 20,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW,
      }),
    },
  })
  entities.push(polyline)
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    entities.forEach((entity) => {
      viewer.entities.remove(entity)
    })
  }
  entities = []
  Cesium = null
  viewer = null
}
</script>
