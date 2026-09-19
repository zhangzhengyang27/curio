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

  // 3dtiles 模型
  const tileset = await Cesium.Cesium3DTileset.fromUrl(FILE_HOST + '3dtiles/test/tileset.json')
  
  viewer.scene.primitives.add(tileset)
  
  adjust3dtilesPosition(tileset)
  
  // 设置视角
  viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0))
  
  // gltf 模型 放到 3dtiles 模型中心
  viewer.entities.add({
  
      name: 'gltf',
  
      position: tileset.boundingSphere.center,
  
      model: {
  
          uri: HOST + '/files/model/car.glb',
  
          minimumPixelSize: 128,
  
          maximumScale: 200,
  
      }
  
  })
  
  // 贴地
  function adjust3dtilesPosition(tileset: any) {
  
      const boundingSphere = tileset.boundingSphere
  
      const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center) // 获取中心点
  
      const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0) // 获取表面点
  
      const offset = Cesium.Cartesian3.subtract(surface, boundingSphere.center, new Cesium.Cartesian3()) // 计算偏移
  
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(offset) // 设置偏移
  
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
