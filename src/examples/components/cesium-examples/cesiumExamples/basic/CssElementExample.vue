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

  const url = GLOBAL_CONFIG.getLayerUrl()
  
  const layer = Cesium.ImageryLayer.fromProviderAsync(
  
      Cesium.ArcGisMapServerImageryProvider.fromUrl(url)
  
  )
  
  viewer.imageryLayers.add(layer)
  
  // 创建2dDOM
  const DOM = document.createElement('div')
  
  // 样式 
  Object.assign(DOM.style, {
  
      width: '100px',
  
      height: '30px',
  
      border: '1px solid blue',
  
      color: 'white',
  
      fontSize: '20px',
  
      cursor: 'pointer'
  
  })
  
  DOM.innerHTML = '2dDOM'
  
  setCss2dDom(viewer, DOM, [116.46, 39.92, 0]) // 设置2dDOM 移动
  
  viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(116.46, 39.92), point: { pixelSize: 10 } }) // 创建测试点
  
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(116.46, 39.92, 10000000) }) // 定位
  
  /* 设置2dDOM 移动 */
  function setCss2dDom(viewer: any, DOM: any, position: any) {
  
      if (!position) return
  
      if (!(position instanceof Cesium.Cartesian3)) position = Cesium.Cartesian3.fromDegrees(...position)
  
      Object.assign(DOM.style, {
  
          pointerEvents: 'all',
  
          zIndex: 'auto',
  
      })
  
      const { offsetHeight } = DOM
  
      const { camera, scene } = viewer
  
  // 转换遗留:原 HTML 全局变量
  let css2dContainer: any
      css2dContainer.appendChild(DOM)
  
      const destroy = viewer.scene.postRender.addEventListener(() => {
  
          const windowCoord = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, position)
  
          if (windowCoord) {
  
              DOM.style.transform = `translate(${windowCoord.x}px, ${windowCoord.y - offsetHeight}px)`
  
          }
  
          const maxDistance = scene.globe.ellipsoid.cartesianToCartographic(camera.position).height + scene.globe.ellipsoid.maximumRadius
  
          Cesium.Cartesian3.distance(camera.position, position) > maxDistance ? DOM.style.display = 'none' : DOM.style.display = 'block'
  
      })
  
      return () => {
  
          viewer.css2dContainer.removeChild(DOM)
  
          destroy()
  
      }
  
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
