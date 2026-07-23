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
import { GUI } from 'lil-gui'

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

    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')),

    fullscreenButton: false,//是否显示全屏按钮，右下角全屏选择按钮

    timeline: false,//是否显示时间轴    

    infoBox: false,//是否显示信息框   

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

  let primitives = [];
  
  viewer.scene.camera.setView({
      destination: {
          x: -2264713.773444937,
          y: 4437097.6365463445,
          z: 4052169.8549779626,
      },
      orientation: {
          heading: 5.625615618387119,
          pitch: -0.5513619022102629,
          roll: 0.00001297575603054213,
      },
  });
  loadLinesData();
  
  //加载数据
  function loadLinesData() {
      let url = FILE_HOST + "files/json/jiaotong.json";
      Cesium.Resource.fetchJson(url).then((data) => {
          var busLines = [];
          data.map(function (busLine, idx) {
              var prevPt;
              var points = [];
              for (var i = 0; i < busLine.length; i += 2) {
                  var pt = [busLine[i], busLine[i + 1]];
                  if (i > 0) {
                      pt = [prevPt[0] + pt[0], prevPt[1] + pt[1]];
                  }
                  prevPt = pt;
  
                  var longitude = pt[0] / 1e4;
                  var latitude = pt[1] / 1e4;
                  points.push(longitude);
                  points.push(latitude);
              }
  
              busLines.push({
                  positions: points,
                  color: new Cesium.Color(
                      Math.random() * 0.5 + 0.5,
                      Math.random() * 0.8 + 0.2,
                      0.0,
                      1.0
                  ),
                  width: 2.0,
              });
          });
          addLineDatasPrimitive(busLines);
  
      });
  }
  
  // 预定义颜色主题
  const colorThemes = [
      {
          name: '黄绿色系', colors: [
              new Cesium.Color(0.8, 1.0, 0.0, 0.9),
              new Cesium.Color(0.6, 0.8, 0.2, 0.9),
              new Cesium.Color(0.4, 0.7, 0.4, 0.9),
              new Cesium.Color(0.2, 0.6, 0.6, 0.9)
          ]
      },
      {
          name: '蓝色系', colors: [
              new Cesium.Color(0.0, 0.5, 1.0, 0.8),
              new Cesium.Color(0.0, 0.7, 1.0, 0.8),
              new Cesium.Color(0.1, 0.6, 0.9, 0.8),
              new Cesium.Color(0.2, 0.5, 0.8, 0.8)
          ]
      },
      {
          name: '红色系', colors: [
              new Cesium.Color(1.0, 0.2, 0.2, 0.8),
              new Cesium.Color(0.9, 0.3, 0.1, 0.8),
              new Cesium.Color(0.8, 0.2, 0.2, 0.8),
              new Cesium.Color(1.0, 0.4, 0.3, 0.8)
          ]
      },
      {
          name: '绿色系', colors: [
              new Cesium.Color(0.1, 0.8, 0.4, 0.8),
              new Cesium.Color(0.2, 0.7, 0.5, 0.8),
              new Cesium.Color(0.0, 0.6, 0.3, 0.8),
              new Cesium.Color(0.3, 0.8, 0.3, 0.8)
          ]
      },
      {
          name: '彩虹系', colors: [
              new Cesium.Color(1.0, 0.0, 0.0, 0.8),
              new Cesium.Color(1.0, 0.7, 0.0, 0.8),
              new Cesium.Color(0.0, 0.7, 0.2, 0.8),
              new Cesium.Color(0.0, 0.5, 1.0, 0.8),
              new Cesium.Color(0.6, 0.0, 0.8, 0.8)
          ]
      },
  
  ];
  
  //添加到场景 Primitive 方式
  function addLineDatasPrimitive(busLines) {
      let scene = viewer.scene;
  
      // 创建GUI控制面板
      gui = new GUI();
  
      // 效果控制参数
      const effectControls = {
          colorTheme: '黄绿色系',
          speed: 5.0,
          percent: 0.15,
          gradient: 0.4,
          width: 3.0,
          opacity: 0.8,
          applyChanges: function () {
              updateLines();
          }
      };
  
      // 添加控制选项
      gui.add(effectControls, 'colorTheme', colorThemes.map(theme => theme.name)).onChange(updateLines)
          .name('颜色主题');
      gui.add(effectControls, 'speed', 1, 20).name('流动速度');
      gui.add(effectControls, 'percent', 0.05, 0.5).name('流动长度');
      gui.add(effectControls, 'gradient', 0.1, 1.0).name('渐变效果');
      gui.add(effectControls, 'width', 1, 10).name('线条宽度');
      gui.add(effectControls, 'opacity', 0, 1).name('透明度');
      gui.add(effectControls, 'applyChanges').name('应用更改');
  
      // 更新或创建所有线条
      function updateLines() {
          // 清除现有线条
          primitives.forEach(p => scene.primitives.remove(p));
          primitives = [];
  
          // 获取当前颜色主题
          const currentTheme = colorThemes.find(t => t.name === effectControls.colorTheme);
          const colors = currentTheme.colors;
  
          // 为每条线创建材质
          busLines.forEach((line, index) => {
              // 从主题中循环选择颜色
              const colorIndex = index % colors.length;
              const lineColor = colors[colorIndex].clone();
              lineColor.alpha = effectControls.opacity;
  
              // 创建流动线材质
              const material = Cesium.Material.fromType(Cesium.Material.PolylineFlowType, {
                  color: lineColor,
                  speed: effectControls.speed,
                  percent: effectControls.percent,
                  gradient: effectControls.gradient
              });
  
              // 创建线条
              const primitive = new Cesium.Primitive({
                  appearance: new Cesium.PolylineMaterialAppearance({
                      material: material
                  }),
                  geometryInstances: new Cesium.GeometryInstance({
                      geometry: new Cesium.PolylineGeometry({
                          positions: Cesium.Cartesian3.fromDegreesArray(line.positions),
                          width: effectControls.width,
                          vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
                      })
                  })
              });
  
              primitives.push(scene.primitives.add(primitive));
          });
      }
  
      // 初始化线条
      updateLines();
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

onUnmounted(() => {
  gui?.destroy()
})
</script>
