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

  // 这里 https://github.com/z2586300277/3d-file-server 是我存放离线地图瓦片资源的仓库 
  
  // 瓦片下载 - 可通过多种方式 例如 望远网 地图资源下载
  
  // 这里我只下载了 3 - 5 级的瓦片    
  
  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.UrlTemplateImageryProvider({
  
          url: FILE_HOST + 'map/Gaode/tiles/{z}/{x}/{y}.png',
  
          maximumLevel: 5,
  
          minimumLevel: 3,
  
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
