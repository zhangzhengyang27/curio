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

  viewer._cesiumWidget._creditContainer.style.display = "none"
  
  viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 18000000) }) // 设置视角
  
  const citys = await fetch('/external-examples/3d-file-server/files/other/city.json').then(res => res.json()) // 获取城市数据
  
  const points = Object.values(citys).map((val: any, k) => ({ type: 'Feature', pid: k + '-' + val[0] + '-' + val[1], geometry: { coordinates: val } }))
  
  // 建立聚合
  setClusterCollection(viewer, points, (billboards: any, data: any) => {
  
      const [longitude, latitude] = data.geometry.coordinates
  
      const { pid } = data
  
      billboards.add({
  
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
  
          image: '/external-examples/3d-file-server/files/other/site.png',
  
          scale: 0.05,
  
          eyeOffset: new Cesium.Cartesian3(0, 0, 150), // 偏移高度
  
          id: pid
  
      })
  
  })
  
  /* 聚合方法 */
  function setClusterCollection(viewer: any, points: any, callback: any = () => { }, options: any = {}) {
  
      // 创建聚合
      const Supercluster = (globalThis as any).Supercluster
      const supercluster = new Supercluster({ radius: 40, extent: 512, minZoom: 0, maxZoom: 16, ...options }) // 密集程度 radius, 切片大小 extent, 最小层级 minZoom, 最大层级 maxZoom
  
      supercluster.load(points)
  
      // 初始化聚合
      const clusters = supercluster.getClusters([-180, -85, 180, 85], 2)
  
      // 获取当前视角的边界
      const getBounds = () => {
  
          const bbox = viewer.camera.computeViewRectangle()
  
          return [bbox.west, bbox.south, bbox.east, bbox.north].map(i => Cesium.Math.toDegrees(i))  // minx, miny, maxx, maxy westLng, southLat, eastLng, northLat
  
      }
  
      // 获取当前视角的层级
      const getLevel = () => {
  
          var tileRender = viewer.scene.globe._surface._tilesToRender;
  
          if (tileRender && tileRender.length > 0) {
  
              return tileRender[0]._level
  
          }
  
      }
  
      // 创建billboard集合对象
      const billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection())
  
      const setBillboards = (arr: any) => arr.forEach((cluster: any) => {
  
          let returnCluster = cluster
  
          // 判断聚合点
          if (cluster?.properties?.cluster) {
  
              const clusterId = cluster.properties.cluster_id
  
              const clusterCoordinates = cluster.geometry.coordinates
  
              const leaves = supercluster.getLeaves(clusterId, Infinity, 0)
  
              // 初始化最小距离和最接近的点
              let minDistance = Infinity
  
              let closestPoint: any = null
  
              // 遍历所有原始点
              for (const leaf of leaves) {
  
                  // 计算原始点与聚合点的距离
                  const leafCoordinates = leaf.geometry.coordinates
  
                  const distance = Cesium.Cartesian3.distance(
  
                      Cesium.Cartesian3.fromDegrees(...clusterCoordinates),
  
                      Cesium.Cartesian3.fromDegrees(...leafCoordinates)
  
                  )
  
                  // 如果这个距离小于当前的最小距离，更新最小距离和最接近的点
                  if (distance < minDistance) {
  
                      minDistance = distance
  
                      closestPoint = leaf
  
                  }
  
              }
  
              returnCluster = closestPoint
  
          }
  
          callback(billboards, returnCluster)
  
      })
  
      setBillboards(clusters)
  
      // 动态更新聚合
      viewer.camera.changed.addEventListener(function () {
  
          const level = getLevel()
  
          if (!level) return
  
          const clusters = supercluster.getClusters(getBounds(), level);
  
          billboards.removeAll()
  
          setBillboards(clusters)
  
      })
  
      return supercluster
  
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
