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

  setFaceCollection(viewer, (faceCollection: any, lineCollection: any) => {
  
      for (var i = 0; i < 10000; i++) {
  
          var longitude = Math.random() * 360 - 180;
  
          var latitude = Math.random() * 180 - 90;
  
          var positions = [longitude, latitude, longitude + Math.random(), latitude, longitude, latitude + Math.random()];
  
          faceCollection.add({ positions, color: i % 2 == 0 ? 'red' : 'green', id: 'face' + i, opacity: 1 })
  
          lineCollection.add({ positions, color: '#fff', id: 'line' + i, width: 1.0, opacity: 0.5 })
  
      }
  
  })
  
  // 创建大量面和线段
  function setFaceCollection(viewer: any, callback: any) {
  
      const lineCollection = {
  
          instances: [] as any[],
  
          add({ positions, color = '#fff', id = '', width = 1.0, opacity = 1 }: any) {
  
              if (!positions) return
  
              this.instances.push(new Cesium.GeometryInstance({
  
                  geometry: new Cesium.PolylineGeometry({
  
                      positions: Cesium.Cartesian3.fromDegreesArray(positions),
  
                      width: width * 3,
  
                      vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
  
                  }),
  
                  attributes: {
  
                      color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(color).withAlpha(opacity))
  
                  },
  
                  id
  
              }))
  
          }
  
      }
  
      const faceCollection = {
  
          instances: [] as any[],
  
          add({ positions, color = '#fff', id = '', opacity = 1 }: any) {
  
              if (!positions) return
  
              this.instances.push(new Cesium.GeometryInstance({
  
                  geometry: new Cesium.PolygonGeometry({
  
                      polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(positions)),
  
                      height: 0,
  
                      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
  
                  }),
  
                  attributes: {
  
                      color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(color).withAlpha(opacity))
  
                  },
  
                  id
  
              }))
  
          }
  
      }
  
      if (callback) callback(faceCollection, lineCollection)
  
      // 增加面集合到场景中
      viewer.scene.primitives.add(
  
          new Cesium.Primitive({
  
              geometryInstances: faceCollection.instances,
  
              appearance: new Cesium.PerInstanceColorAppearance({
  
                  closed: true
  
              })
  
          })
  
      )
  
      // 增加线集合到场景中
      viewer.scene.primitives.add(new Cesium.Primitive({
  
          geometryInstances: lineCollection.instances,
  
          appearance: new Cesium.PolylineColorAppearance()
  
      }))
  
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
