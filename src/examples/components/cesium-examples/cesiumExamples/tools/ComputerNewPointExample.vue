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

let Cesium: any = null
let viewer: any = null
let globalHandler: any = null
let entitys: any[] = []
let gui: any = null
let distance: number = 0

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

  viewer.imageryLayers.addImageryProvider(new Cesium.TileCoordinatesImageryProvider())

  gui = new GUI()
  const obj = {
    '绘制原始点': () => setupInteractiveDrawing(),
  }
  for (const key in obj) gui.add(obj, key)

  function setupInteractiveDrawing() {
    viewer.entities.removeAll()
    entitys = []
    if (globalHandler) {
      globalHandler.destroy()
      globalHandler = null
    }
    globalHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    globalHandler.setInputAction(function (movement: any) {
      const ray = viewer.camera.getPickRay(movement.position)
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        const lon = Cesium.Math.toDegrees(cartographic.longitude)
        const lat = Cesium.Math.toDegrees(cartographic.latitude)
        drawPointOnMap([lon, lat], '起点')
        if (globalHandler) {
          globalHandler.destroy()
          globalHandler = null
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  function drawPointOnMap(coordinates: any, name: any) {
    const pointEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(coordinates[0], coordinates[1]),
      point: {
        pixelSize: 15,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
      },
      label: {
        text: `${name}\n[${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`,
        font: '16px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
      },
    })
    entitys.push(pointEntity)

    if (name === '起点') {
      requestAngleAndDistance(coordinates[0], coordinates[1])
    } else {
      viewer.flyTo(entitys, {
        duration: 1,
        offset: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          range: distance * 1.5,
        },
      })
    }
  }

  function requestAngleAndDistance(lon: any, lat: any) {
    setTimeout(() => {
      const value = prompt(
        '请输入方位角&距离(km/>0)\n45&10 表示从正北方向顺时针45度方向,距离10公里',
        '45&10'
      )
      if (value) {
        const splitValue = value.split('&')
        if (splitValue.length === 2) {
          const angle = parseFloat(splitValue[0])
          distance = parseFloat(splitValue[1]) * 1000
          if (!isNaN(angle) && distance > 0) {
            const newCoordinates = newPointByAngleAndDistance(lon, lat, distance, angle)
            drawPointOnMap(newCoordinates, '终点')
          } else {
            alert('输入格式不正确，请输入有效的数字')
            viewer.entities.removeAll()
            entitys = []
          }
        } else {
          alert('输入格式不正确，请按照格式：方位角&距离')
          viewer.entities.removeAll()
          entitys = []
        }
      }
    }, 500)
  }

  function newPointByAngleAndDistance(lon: any, lat: any, dist: any, angle: any) {
    const angleRad = (angle * Math.PI) / 180
    const R = 6378137 - ((6378137 - 6356752) * lat) / 90
    const latRad = (lat * Math.PI) / 180
    const lonRad = (lon * Math.PI) / 180
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(dist / R) +
      Math.cos(latRad) * Math.sin(dist / R) * Math.cos(angleRad)
    )
    const newLon =
      lonRad +
      Math.atan2(
        Math.sin(angleRad) * Math.sin(dist / R) * Math.cos(latRad),
        Math.cos(dist / R) - Math.sin(latRad) * Math.sin(newLat)
      )
    return [(newLon * 180) / Math.PI, (newLat * 180) / Math.PI]
  }
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    if (globalHandler) {
      globalHandler.destroy()
      globalHandler = null
    }
    viewer.entities.removeAll()
    entitys = []
  }
  if (gui) {
    gui.destroy()
    gui = null
  }
  Cesium = null
  viewer = null
}
</script>
