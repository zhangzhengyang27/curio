<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
// 转换遗留:原 HTML 天地图 token 全局变量,改由 env 注入
const TDT_TOKEN = import.meta.env.VITE_TDT_TOKEN || ''
import { onUnmounted } from 'vue'

let gui: any = null
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import { GUI } from 'lil-gui'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium: any = null
let viewer: any = null

function viewerOptions(Cesium: any) {
  return {

    animation: false,//是否创建动画小器件，左下角仪表    

    baseLayerPicker: false,//是否显示图层选择器，右上角图层选择按钮

    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')),

    fullscreenButton: false,//是否显示全屏按钮，右下角全屏选择按钮

    timeline: false,//是否显示时间轴    

    infoBox: false,//是否显示信息框   

}
}

async function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  // 天地图注记图层
  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.WebMapTileServiceImageryProvider({
  
          url: `https://t0.tianditu.gov.cn/cva_w/wmts?tk=${TDT_TOKEN}&service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles`,
  
          layer: "tdtAnnoLayer",
  
          style: "default",
  
          format: "image/jpeg",
  
          tileMatrixSetID: "GoogleMapsCompatible"
  
      })
  
  )
  
  const tileset = await Cesium.Cesium3DTileset.fromUrl(FILE_HOST + '3dtiles/house/tileset.json')
  
  viewer.scene.primitives.add(tileset)
  
  const entity = viewer.entities.add({
  
      name: 'gltf',
  
      position: Cesium.Cartesian3.fromDegrees(104.0668, 30.5728, 0), // 设置位置
  
      model: {
  
          uri: FILE_HOST + '/models/glb/map_park.glb',
  
      }
  
  })
  
  gui = new GUI()
  
  // viewer.flyTo viewer.zoomTo viewer.trackedEntity view.camera.setView  viewer.camera.lookAt 
  
  const obj = {
  
      '重置最初:setView': () => viewer.camera.flyHome(1),
  
      '经纬度定位:flyTo': () => viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 1000) }),
  
      '实体:flyTo': () => viewer.flyTo(entity),
  
      '实体:zoomTo': () => viewer.zoomTo(entity),
  
      '实体跟随:trackedEntity': () => viewer.trackedEntity = entity,
  
      '取消实体跟随:trackedEntity': () => viewer.trackedEntity = undefined,
  
      '实体:lookAt': () => viewer.camera.lookAt(entity.position.getValue(Cesium.JulianDate.now()), new Cesium.Cartesian3(0, 0, 1000)),
  
      '瓦片:viewBoundingSphere': () => viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0)),
  
      '瓦片:flyToBoundingSphere': () => viewer.camera.flyToBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0)),
  
      '瓦片:zoomTo': () => viewer.zoomTo(tileset),
  
      '瓦片:flyTo': () => viewer.flyTo(tileset),
  
      '瓦片:setView': () => viewer.camera.setView({
          destination: tileset.boundingSphere.center,
          orientation: {
              heading: 0,
              pitch: -Math.PI / 4,
              roll: 0
          }
      }),
  
      '瓦片:lookAt': () => viewer.camera.lookAt(tileset.boundingSphere.center),
  
      '相机:zoomIn 1000': () => viewer.camera.zoomIn(1000),
  
      '相机:zoomOut 1000': () => viewer.camera.zoomOut(1000),
  
  }
  
  for (const key in obj) gui.add(obj, key)
  
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

onUnmounted(() => {
  gui?.destroy()
})
</script>
