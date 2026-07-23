<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'
import { GUI } from 'lil-gui';

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
          maximumLevel: 18,
          tilingScheme: new AmapMercatorTilingScheme()
      })
  )
  
  viewer.entities.add({
  
      name: 'gltf',
  
      position: Cesium.Cartesian3.fromDegrees(116.3975, 39.9085, 0), // 北京的经纬度和高度
  
      model: {
  
          uri: FILE_HOST + '/files/model/LittlestTokyo.glb',
  
          minimumPixelSize: 128,
  
          maximumScale: 200,
  
      }
  
  })
  
  gui = new GUI();
  
  const mapParams = {
      mapType: '纠偏校正', // 默认使用纠偏后的高德地图
      locations: '北京',
  };
  
  // 预定义常用位置
  const locations = {
      '北京': [116.3975, 39.9085, 2000],
      '上海': [121.4737, 31.2304, 2000],
      '广州': [113.2644, 23.1292, 2000],
      '深圳': [114.0579, 22.5431, 2000]
  };
  
  // 飞行到指定位置
  function flyToLocation(name) {
      const position = locations[name];
      if (position) {
          viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]),
              duration: 1.5
          });
      }
  }
  
  // 添加GUI控制
  const mapFolder = gui.addFolder('坐标纠偏对比');
  
  // 添加地图类型选择
  mapFolder.add(mapParams, 'mapType', ['纠偏校正', '未纠正']).name('地图类型').onChange(function (value) {
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(
          new Cesium.UrlTemplateImageryProvider({
              url: 'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=2&style=8&x={x}&y={y}&z={z}',
              maximumLevel: 18,
              tilingScheme: value === '纠偏校正' ? new AmapMercatorTilingScheme() : null
          })
      )
  });
  
  // 添加位置选择
  mapFolder.add(mapParams, 'locations', Object.keys(locations)).name('常用位置')
      .onChange(function (value) {
          flyToLocation(value);
      });
  
  
  // 默认展开文件夹
  mapFolder.open();
  
  flyToLocation(mapParams.locations);
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
