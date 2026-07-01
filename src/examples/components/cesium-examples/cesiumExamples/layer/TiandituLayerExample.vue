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

function viewerOptions(Cesium) {
  return {

    animation: false,//是否创建动画小器件，左下角仪表    

    baseLayerPicker: false,//是否显示图层选择器，右上角图层选择按钮

    fullscreenButton: false,//是否显示全屏按钮，右下角全屏选择按钮

    geocoder: false,//是否显示geocoder小器件，右上角查询按钮    

    homeButton: false,//是否显示Home按钮，右上角home按钮 

    sceneMode: Cesium.SceneMode.SCENE3D,//初始场景模式

    sceneModePicker: false,//是否显示3D/2D选择器，右上角按钮 

    navigationHelpButton: false,//是否显示右上角的帮助按钮  

    selectionIndicator: false,//是否显示选取指示器组件   

    timeline: false,//是否显示时间轴    

    infoBox: false,//是否显示信息框   

    scene3DOnly: true,//如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源  

    orderIndependentTranslucency: false, //是否启用无序透明

    contextOptions: { webgl: { alpha: true } },

    skyBox: new Cesium.SkyBox({ show: false }),

    requestRenderMode: true, // 是否开启请求渲染模式

}
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

  viewer.scene.sun.show = false
  
  viewer.scene.moon.show = false
  
  viewer.scene.skyBox.show = false
  
  viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0)
  
  viewer._cesiumWidget._creditContainer.style.display = "none"
  
  // 天地图影像图层
  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.WebMapTileServiceImageryProvider({
  
          url: "https://t0.tianditu.gov.cn/img_w/wmts?tk=c4e3a9d54b4a79e885fff9da0fca712a&service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
  
          layer: "tdtImgBasicLayer",
  
          style: "default",
  
          format: "image/jpeg",
  
          tileMatrixSetID: "GoogleMapsCompatible"
  
      })
  
  )
  
  // 天地图注记图层
  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.WebMapTileServiceImageryProvider({
  
          url: "https://t0.tianditu.gov.cn/cva_w/wmts?tk=c4e3a9d54b4a79e885fff9da0fca712a&service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
  
          layer: "tdtAnnoLayer",
  
          style: "default",
  
          format: "image/jpeg",
  
          tileMatrixSetID: "GoogleMapsCompatible"
  
      })
  
  )
  
  // 天地图境界线
  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.WebMapTileServiceImageryProvider({
  
          url: "https://t0.tianditu.gov.cn/ibo_w/wmts?tk=c4e3a9d54b4a79e885fff9da0fca712a&service=wmts&request=GetTile&version=1.0.0&LAYER=ibo&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
  
          layer: "tdtBoundaryLayer",
  
          style: "default",
  
          format: "image/jpeg",
  
          tileMatrixSetID: "GoogleMapsCompatible"
  
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
