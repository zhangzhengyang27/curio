<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium = null
let viewer = null

const viewerOptions = {

    animation: false,//是否创建动画小器件，左下角仪表    

    baseLayerPicker: false,//是否显示图层选择器，右上角图层选择按钮

    baseLayer: false, // 不显示默认图层

    fullscreenButton: false,//是否显示全屏按钮，右下角全屏选择按钮

    timeline: false,//是否显示时间轴    

    infoBox: false,//是否显示信息框   

}

function onReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url) => FILE_HOST + url,
    ElMessage: (msg) => console.log('[ElMessage]', msg)
  }

  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.UrlTemplateImageryProvider({
  
          //高德卫星影像
          url: 'https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
  
          maximumLevel: 18
  
      })
  
  )
  
  // px => -90, nx => 90, py => 0, ny => 180, pz => 0, nz => 180
  viewer.scene.skyBox = new Cesium.SkyBox({
      sources: {
          positiveX: FILE_HOST + 'files/cesiumSky/px.png', // 右面
          negativeX: FILE_HOST + 'files/cesiumSky/nx.png', // 左面
          positiveY: FILE_HOST + 'files/cesiumSky/pz.png', // 将前面用作上面
          negativeY: FILE_HOST + 'files/cesiumSky/nz.png', // 将后面用作下面
          positiveZ: FILE_HOST + 'files/cesiumSky/py.png', // 将上面用作前面
          negativeZ: FILE_HOST + 'files/cesiumSky/ny.png'  // 将下面用作后面
      }
  });
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
