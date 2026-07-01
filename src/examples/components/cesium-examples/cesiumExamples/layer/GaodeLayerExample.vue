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
  
          url: 'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=2&style=8&x={x}&y={y}&z={z}',
  
          maximumLevel: 18
  
      })
  
  )
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
