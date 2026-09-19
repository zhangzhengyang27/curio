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

    baseLayer: false, // 不显示默认图层

}
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

  viewer.imageryLayers.addImageryProvider(
  
      new Cesium.UrlTemplateImageryProvider({
  
          url: 'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=2&style=8&x={x}&y={y}&z={z}',
  
          maximumLevel: 18
  
      })
  
  )
  
  setViewerTheme(viewer) // 设置主题
  
  function setViewerTheme(viewer: any, options: any = {}) {
  
      const baseLayer = viewer.imageryLayers.get(0)
  
      if (!baseLayer) return
  
      baseLayer.brightness = options.brightness ?? 0.6
  
      baseLayer.contrast = options.contrast ?? 1.8
  
      baseLayer.gamma = options.gamma ?? 0.3
  
      baseLayer.hue = options.hue ?? 1
  
      baseLayer.saturation = options.saturation || 0
  
      const baseFragShader = (viewer.scene.globe)._surfaceShaderSet.baseFragmentShaderSource.sources
  
      for (let i = 0; i < baseFragShader.length; i++) {
  
          const strS = 'color = czm_saturation(color, textureSaturation);\n#endif\n'
  
          let strT = 'color = czm_saturation(color, textureSaturation);\n#endif\n'
  
          if (!options.invertColor) {
  
              strT += `
                  color.r = 1.0 - color.r;
                  color.g = 1.0 - color.g;
                  color.b = 1.0 - color.b;
              `
              
          }
  
          strT += `
              color.r = color.r * ${options.filterRGB_R ?? 100}.0/255.0;
              color.g = color.g * ${options.filterRGB_G ?? 138}.0/255.0;
              color.b = color.b * ${options.filterRGB_B ?? 230}.0/255.0;
          `
  
          baseFragShader[i] = baseFragShader[i].replace(strS, strT)
  
      }
  
      viewer.scene.requestRender();
  
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
