<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import { GUI } from 'dat.gui'

let Cesium = null
let viewer = null
let gui = null
let globalHandler = null
let lineEntities = []
let tempLineEntity = null
let drawLinePositions = []
let distanceLabelEntity = null

const CONFIG = {
  point: {
    pixelSize: 10,
    color: null,
    outlineColor: null,
    outlineWidth: 1,
  },
  label: {
    font: '14px sans-serif',
    fillColor: null,
    outlineColor: null,
    outlineWidth: 2,
    style: null,
    verticalOrigin: null,
  },
  line: {
    width: 5,
    material: null,
    clampToGround: true,
  },
  tempLine: {
    width: 3,
    material: null,
    clampToGround: true,
  },
}

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

function onReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  CONFIG.point.color = Cesium.Color.YELLOW
  CONFIG.point.outlineColor = Cesium.Color.BLACK
  CONFIG.label.fillColor = Cesium.Color.WHITE
  CONFIG.label.outlineColor = Cesium.Color.BLACK
  CONFIG.label.style = Cesium.LabelStyle.FILL_AND_OUTLINE
  CONFIG.label.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
  CONFIG.line.material = Cesium.Color.RED.withAlpha(1)
  CONFIG.tempLine.material = Cesium.Color.RED.withAlpha(0.5)

  viewer.imageryLayers.add(
    Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
      )
    )
  )

  viewer.camera.flyTo({
    duration: 2,
    destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  })

  gui = new GUI()
  const obj = {
    '绘制线': () => {
      clearLineEntities()
      initLineDrawing()
    },
  }
  for (const key in obj) gui.add(obj, key)
}

function clearLineEntities() {
  lineEntities.forEach((entity) => {
    viewer.entities.remove(entity)
  })
  lineEntities = []
  drawLinePositions.length = 0
  if (tempLineEntity) {
    viewer.entities.remove(tempLineEntity)
    tempLineEntity = null
  }
  if (distanceLabelEntity) {
    viewer.entities.remove(distanceLabelEntity)
    distanceLabelEntity = null
  }
  if (globalHandler) {
    globalHandler.destroy()
    globalHandler = null
  }
}

function initLineDrawing() {
  globalHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)

  globalHandler.setInputAction(function (movement) {
    const cartesian = viewer.scene.pickPosition(movement.position)
    if (cartesian) {
      drawLinePositions.push(cartesian)
      const pointEntity = viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: CONFIG.point.pixelSize,
          color: CONFIG.point.color,
          outlineColor: CONFIG.point.outlineColor,
          outlineWidth: CONFIG.point.outlineWidth,
        },
        billboard: {
          image: customLabel(`${drawLinePositions.length}`, '#4ecb52', 'white'),
          pixelOffset: new Cesium.Cartesian2(0, -20),
        },
      })
      lineEntities.push(pointEntity)

      if (drawLinePositions.length >= 2) {
        const lineEntity = viewer.entities.add({
          polyline: {
            positions: [
              drawLinePositions[drawLinePositions.length - 2],
              drawLinePositions[drawLinePositions.length - 1],
            ],
            width: CONFIG.line.width,
            material: CONFIG.line.material,
            clampToGround: CONFIG.line.clampToGround,
          },
        })
        lineEntities.push(lineEntity)
        calculateAndDisplayDistance(
          drawLinePositions[drawLinePositions.length - 2],
          drawLinePositions[drawLinePositions.length - 1],
          drawLinePositions.length - 1
        )
      }
    } else {
      alert('点击位置不在地球表面')
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  globalHandler.setInputAction(function () {
    if (tempLineEntity) {
      viewer.entities.remove(tempLineEntity)
      tempLineEntity = null
    }
    if (distanceLabelEntity) {
      viewer.entities.remove(distanceLabelEntity)
      distanceLabelEntity = null
    }
    drawLinePositions = []
    if (globalHandler) {
      globalHandler.destroy()
      globalHandler = null
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

  globalHandler.setInputAction(function (movement) {
    const cartesian = viewer.scene.pickPosition(movement.endPosition)
    if (cartesian && drawLinePositions.length > 0) {
      if (tempLineEntity) {
        tempLineEntity.polyline.positions = [
          drawLinePositions[drawLinePositions.length - 1],
          cartesian,
        ]
      } else {
        tempLineEntity = viewer.entities.add({
          polyline: {
            positions: [
              drawLinePositions[drawLinePositions.length - 1],
              cartesian,
            ],
            width: CONFIG.tempLine.width,
            material: CONFIG.tempLine.material,
            clampToGround: CONFIG.tempLine.clampToGround,
          },
        })
      }
      updateRealTimeDistance(drawLinePositions[drawLinePositions.length - 1], cartesian)
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

function calculateAndDisplayDistance(point1, point2, index) {
  const distance = Cesium.Cartesian3.distance(point1, point2)
  const midPoint = Cesium.Cartesian3.midpoint(point1, point2, new Cesium.Cartesian3())
  const distanceEntity = viewer.entities.add({
    position: midPoint,
    billboard: {
      image: customLabel(`${distance.toFixed(2)} 米`, '#d22629', 'white'),
      pixelOffset: new Cesium.Cartesian2(0, -20),
    },
  })
  lineEntities.push(distanceEntity)
}

function updateRealTimeDistance(point1, point2) {
  const distance = Cesium.Cartesian3.distance(point1, point2)
  const midPoint = Cesium.Cartesian3.midpoint(point1, point2, new Cesium.Cartesian3())
  if (distanceLabelEntity) {
    distanceLabelEntity.position = midPoint
    distanceLabelEntity.label.text = `${distance.toFixed(2)} 米`
  } else {
    distanceLabelEntity = viewer.entities.add({
      position: midPoint,
      label: {
        text: `${distance.toFixed(2)} 米`,
        font: CONFIG.label.font,
        outlineColor: CONFIG.label.outlineColor,
        outlineWidth: CONFIG.label.outlineWidth,
        style: CONFIG.label.style,
        verticalOrigin: CONFIG.label.verticalOrigin,
        pixelOffset: new Cesium.Cartesian2(0, -15),
        scale: 1.1,
      },
    })
  }
}

function customLabel(text, bgColor, fontColor) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const textWidth = ctx.measureText(text).width
  canvas.width = textWidth + 20
  canvas.height = 20
  ctx.beginPath()
  ctx.roundRect(0, 0, canvas.width, canvas.height, 10)
  ctx.fillStyle = bgColor
  ctx.fill()
  ctx.font = '12px sans-serif'
  ctx.fillStyle = fontColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  return canvas.toDataURL()
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    clearLineEntities()
    viewer.entities.remove(distanceLabelEntity)
    distanceLabelEntity = null
  }
  if (gui) {
    gui.destroy()
    gui = null
  }
  Cesium = null
  viewer = null
}
</script>
