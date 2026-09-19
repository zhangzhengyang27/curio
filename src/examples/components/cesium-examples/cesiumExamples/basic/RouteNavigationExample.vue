<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium: any = null
let viewer: any = null

const viewerOptions = {

    animation: false,//是否创建动画小器件，左下角仪表    

    baseLayerPicker: false,//是否显示图层选择器，右上角图层选择按钮

    baseLayer: false, // 不显示默认图层

    fullscreenButton: false,//是否显示全屏按钮，右下角全屏选择按钮

    timeline: false,//是否显示时间轴    

    infoBox: false,//是否显示信息框   

}

function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  const layer = Cesium.ImageryLayer.fromProviderAsync(Cesium.ArcGisMapServerImageryProvider.fromUrl(GLOBAL_CONFIG.getLayerUrl()))
  
  viewer.imageryLayers.add(layer)
  
  const list = [
      {
          "longitude": 116.3877535895933,
          "latitude": 39.917986883763334,
          "height": 5
      },
      {
          "longitude": 116.3879258383737,
          "latitude": 39.91794008705796,
          "height": 5
      },
      {
          "longitude": 116.38861928968578,
          "latitude": 39.91781284391525,
          "height": 5
      },
      {
          "longitude": 116.38869191428421,
          "latitude": 39.91818495388228,
          "height": 5
      }
  ]
  
  const cartesianPoints = list.map(item => {
      const { longitude, latitude, height } = item
      return Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
  })
  
  // CatmullRomSpline 插值
  const catmullRomSpline = new Cesium.CatmullRomSpline({
      points: cartesianPoints,
      times: cartesianPoints.map((_, index) => index / (cartesianPoints.length - 1))
  })
  
  const numPoints = 1000 // 插值点数量
  const interpolatedPoints: any[] = []
  for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      const point = catmullRomSpline.evaluate(t)
      interpolatedPoints.push(point)
  }
  
  viewer.entities.add({
      name: '路线',
      polyline: {
          positions: interpolatedPoints,
          width: 1,
          material: Cesium.Color.RED
      }
  })
  
  // 添加无人机
  const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(list[0].longitude, list[0].latitude, 7),
      model: { uri: FILE_HOST + '/models/uav.glb' },
      viewFrom: new Cesium.Cartesian3(0, -20, 10) // 设置第三人称视角偏移（后方20米，上方10米）
  })
  viewer.trackedEntity = entity // 设置相机跟随飞机
  
  // 动画
  const start = Cesium.JulianDate.fromDate(new Date())   // 设置起始时间
  const speedFactor = 50 // 设置速度因子，值越大速度越快
  let stop = Cesium.JulianDate.addSeconds(start, interpolatedPoints.length / speedFactor, new Cesium.JulianDate())
  
  function setProperty(t1: unknown, t2: unknown) {
      const property = new Cesium.SampledPositionProperty()
      for (let i = 0; i < interpolatedPoints.length; i++)  property.addSample(Cesium.JulianDate.addSeconds(t1, i / speedFactor, new Cesium.JulianDate()), interpolatedPoints[i])
      entity.position = property
      entity.orientation = new Cesium.VelocityOrientationProperty(property)
      entity.availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: t1, stop: t2 })])
  }
  
  setProperty(start, stop)
  
  // 监听飞机的位置属性，当飞机到达终点时重新设置位置属性
  viewer.clock.onTick.addEventListener(function (clock: any) {
      if (Cesium.JulianDate.compare(clock.currentTime, stop) >= 0) {
          const newStart = Cesium.JulianDate.clone(stop);
          stop = Cesium.JulianDate.addSeconds(newStart, interpolatedPoints.length / speedFactor, new Cesium.JulianDate());
          setProperty(newStart, stop)
      }
  })
  
  viewer.clock.shouldAnimate = true // 开始动画
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  Cesium = null
  viewer = null
}
</script>
