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
let radar: any = null

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

class RadarSolidScan {
  viewer: any
  Cesium: any
  id: any
  position: any
  longitude: any
  latitude: any
  shortwaveRange: any
  positionArr: any
  heading: any
  tickListener: any
  entity: any
  constructor(options: any) {
    this.viewer = options.viewer
    this.Cesium = options.Cesium
    this.id = options.id || 'radar'
    this.position = options.Cesium.Cartesian3.fromDegrees(...options.position, 0)
    this.longitude = options.position[0]
    this.latitude = options.position[1]
    this.shortwaveRange = options.shortwaveRange || 50000
    this.positionArr = []
    this.heading = 0
    this.tickListener = null
    this.addEntities()
    this.addPostRender()
  }

  addEntities() {
    const Cesium = this.Cesium
    this.entity = this.viewer.entities.add({
      id: this.id,
      position: this.position,
      wall: {
        positions: new Cesium.CallbackProperty(() => {
          return Cesium.Cartesian3.fromDegreesArrayHeights(this.positionArr)
        }, false),
        material: Cesium.Color.fromCssColorString('#00dcff82'),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10.5e6),
      },
      ellipsoid: {
        radii: new Cesium.Cartesian3(this.shortwaveRange, this.shortwaveRange, this.shortwaveRange),
        maximumCone: Cesium.Math.toRadians(90),
        material: Cesium.Color.fromCssColorString('#00dcff82'),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#00dcff82'),
        outlineWidth: 1,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10.5e6),
      },
    })
  }

  addPostRender() {
    const Cesium = this.Cesium
    this.tickListener = this.viewer.clock.onTick.addEventListener(() => {
      this.heading += 1.0
      if (this.heading >= 360) this.heading = 0
      this.positionArr = this.calcPoints(this.longitude, this.latitude, this.shortwaveRange, this.heading)
    })
  }

  calcPoints(x1: any, y1: any, radius: any, heading: any) {
    const Cesium = this.Cesium
    const m = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(x1, y1))
    const rad = Cesium.Math.toRadians(heading)
    const rx = radius * Math.cos(rad)
    const ry = radius * Math.sin(rad)
    const translation = Cesium.Cartesian3.fromElements(rx, ry, 0)
    const d = Cesium.Matrix4.multiplyByPoint(m, translation, new Cesium.Cartesian3())
    const c = Cesium.Cartographic.fromCartesian(d)
    const x2 = Cesium.Math.toDegrees(c.longitude)
    const y2 = Cesium.Math.toDegrees(c.latitude)
    return this.computeCirclularFlight(x1, y1, x2, y2, 0, 90)
  }

  computeCirclularFlight(x1: any, y1: any, x2: any, y2: any, fx: any, angle: any) {
    const Cesium = this.Cesium
    const positionArr: any[] = []
    positionArr.push(x1, y1, 0)
    const radius = Cesium.Cartesian3.distance(
      Cesium.Cartesian3.fromDegrees(x1, y1),
      Cesium.Cartesian3.fromDegrees(x2, y2)
    )
    for (let i = fx; i <= fx + angle; i++) {
      const rad = Cesium.Math.toRadians(i)
      const h = radius * Math.sin(rad)
      const r = Math.cos(rad)
      const x = (x2 - x1) * r + x1
      const y = (y2 - y1) * r + y1
      positionArr.push(x, y, h)
    }
    return positionArr
  }

  clear() {
    if (this.tickListener) {
      this.tickListener()
      this.tickListener = null
    }
    if (this.viewer && this.id) {
      const entity = this.viewer.entities.getById(this.id)
      if (entity) {
        this.viewer.entities.remove(entity)
      }
    }
    this.positionArr = []
    this.heading = 0
  }

  destroy() {
    this.clear()
    this.viewer = null
    this.Cesium = null
  }
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

  radar = new RadarSolidScan({
    viewer,
    Cesium,
    id: 'radar1',
    position: [120, 36],
    shortwaveRange: 50000,
  })

  viewer.flyTo(radar.entity)
}

function onBeforeDispose() {
  if (radar) {
    radar.destroy()
    radar = null
  }
  Cesium = null
  viewer = null
}
</script>
