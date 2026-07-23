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

async function onReady(ctx) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url) => FILE_HOST + url,
    ElMessage: (msg) => console.log('[ElMessage]', msg)
  }

  const url = GLOBAL_CONFIG.getLayerUrl()
   
  const layer = Cesium.ImageryLayer.fromProviderAsync(
  
      Cesium.ArcGisMapServerImageryProvider.fromUrl(url)
  
  )
  
  viewer.imageryLayers.add(layer)
  
  
  // 加载geojson数据
  const dataSource = setGeoPolygon(viewer, '/external-examples/3d-file-server/files/json/guangdong.json')
  
  // 看向geojson数据
  viewer.flyTo(dataSource)
  
  // 点击变色
  viewer.screenSpaceEventHandler.setInputAction((event) => {
  
      const pickedObject = viewer.scene.pick(event.position)
  
      if (Cesium.defined(pickedObject) && pickedObject.id) {
  
          pickedObject.id.polygon.material = Cesium.Color.fromCssColorString('yellow').withAlpha(0.5)
  
      }
  
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  
  // 创建 面
  async function setGeoPolygon(viewer, source, params = {}) {
  
      const dataSource = await Cesium.GeoJsonDataSource.load(source, {
  
          stroke: Cesium.Color.fromCssColorString(params.strokeColor || 'red').withAlpha(params.strokeOpacity || 0.5), // 边界
  
          fill: Cesium.Color.fromCssColorString(params.fillColor || 'blue').withAlpha(params.fillOpacity || 0.5), // 填充
  
          strokeWidth: params.strokeWidth || 3,
  
          markerSymbol: '?',
  
          ...params
  
      })
  
      dataSource.changeMaterial = (params) => dataSource.entities.values.forEach(entity => {
  
          entity.polygon.material = Cesium.Color.fromCssColorString(params.fillColor || 'blue').withAlpha(params.fillOpacity || 0.5)
  
          entity.polygon.outlineColor = Cesium.Color.fromCssColorString(params.strokeColor || 'red').withAlpha(params.strokeOpacity || 0.5)
  
          entity.polygon.outlineWidth = params.strokeWidth || 3
  
      })
  
      viewer.dataSources.add(dataSource)
  
      return dataSource
  
  }
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
