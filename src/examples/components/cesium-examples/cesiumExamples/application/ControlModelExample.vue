<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
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

function viewerOptions(Cesium) {
  return {
    animation: false,             // 是否创建动画小器件，左下角仪表    
    baseLayerPicker: false,       // 是否显示图层选择器，右上角图层选择按钮
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')),
    fullscreenButton: false,      // 是否显示全屏按钮，右下角全屏选择按钮
    timeline: false,              // 是否显示时间轴    
    infoBox: false,               // 是否显示信息框   
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

  // ==================== GUI控制 ====================
  
  /**
   * 显示操作说明
   */
  function showInstructions() {
      const instructions = `
  相机姿态控制：
    W:抬头
    S:低头
    A:左转
    D:右转
    Q:逆时针旋转
    E:顺时针旋转
  速度控制：
    1:加速
    2:减速
  `;
      alert(instructions);
  }
  
  /**
   * 创建GUI控制面板
   * @type {GUI}
   */
  const gui = new GUI();
  
  /** 
   * 定义图形绘制操作对象
   * @namespace obj
   */
  const obj = {
      '开始飞行': () => {
          startFirstRoam({
              startPosition: [116.3, 39.9, 1000],
          });
      },
      '暂停飞行': () => {
          stopFirstRoam();
      },
      '切换视角': () => {
          // 在第一人称和上帝视角之间切换
          if (view === "god") {
              changeRoamView("first");
          } else {
              changeRoamView("god");
          }
      },
      '重置': () => {
          quitFirstRoam();
      },
      '操作说明': () => {
          showInstructions();
      }
  };
  
  // 将操作对象添加到GUI控制面板
  for (const key in obj) gui.add(obj, key)
  
  // 隐藏Cesium Logo
  viewer._cesiumWidget._creditContainer.style.display = "none";
  
  // ==================== 功能操作区域 ====================
  
  /**
   * 第一视角漫游加载方法
   * @description 使用键盘控制第一视角漫游，模型姿态：
   *   W：抬头；S：低头；A：左转；D：右转；
   *   Q：逆时针旋转；E：顺时针旋转；
   *   1：加速；2：减速
   * @param {Object} parameter -第一视角漫游默认配置项
   * @param {Array} parameter.startPosition -模型初始坐标位置[经度, 纬度, 高度]
   * @param {Number} [parameter.minSize=64] -模型的最小显示像素大小
   * @param {Number} [parameter.maxSize=128] -模型的最大显示像素大小
   * @param {Number} [parameter.speed=1] -漫游速度
   * @return {Cesium.Primitive} -返回飞行对象实体
   */
  function startFirstRoam(parameter) {
      // 防止重复添加模型
      if (!firstModel) {
          // 设置模型初始位置，将经纬度坐标转换为笛卡尔坐标
          position = new Cesium.Cartesian3.fromDegrees(...parameter.startPosition);
  
          // 相机飞向模型初始位置
          viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(...parameter.startPosition),
              orientation: {
                  heading: Cesium.Math.toRadians(0),  // 偏航角：正北方向
                  pitch: Cesium.Math.toRadians(-20),   // 俯仰角：向下倾斜20度
                  roll: 0.0,                           // 翻滚角：无翻滚
              },
          });
          // 使用primitive方式加载模型 - 修复 Cesium.Model.fromGltf 错误
          // 异步加载GLTF模型文件，并应用上面计算的变换矩阵
          Cesium.Model.fromGltfAsync({
              url: HOST + 'files/model/Cesium_Air.glb',
          }).then(model => {
              // 将加载完成的模型添加到场景中
              firstModel = viewer.scene.primitives.add(model);
  
              // 设置模型姿态矩阵，将姿态控制对象应用到模型上
              // headingPitchRollToFixedFrame创建一个从姿态角到世界坐标的变换矩阵
              firstModel.modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
                  position,           // 模型位置
                  headingPitchRoll,   // 姿态控制对象
                  Cesium.Ellipsoid.WGS84,  // 使用WGS84椭球体
                  fixedFrameTransform      // 局部坐标系生成器
              );
          });
      }
  
      // 清除已有的事件监听器，防止重复注册
      if (firstDown) {
          document.removeEventListener("keydown", firstDown, false);
      }
  
      // 注册键盘事件监听器
      document.addEventListener("keydown", firstDown = function (e) {
          switch (e.key.toLowerCase()) {
              // 姿态控制
              case "w":    // 抬头 - 增加俯仰角
                  headingPitchRoll.pitch += deltaRadians;
                  break;
              case "s":  // 低头 - 减少俯仰角
                  headingPitchRoll.pitch -= deltaRadians;
                  break;
              case "a":  // 左转 - 减少偏航角
                  headingPitchRoll.heading -= deltaRadians;
                  break;
              case "d": // 右转 - 增加偏航角
                  headingPitchRoll.heading += deltaRadians;
                  break;
              case "q": // 逆时针旋转 - 减少翻滚角
                  headingPitchRoll.roll -= deltaRadians;
                  break;
              case "e": // 顺时针旋转 - 增加翻滚角
                  headingPitchRoll.roll += deltaRadians;
                  break;
              // 速度控制
              case "1":          // 加速
                  speed += 10;
                  speed = Math.min(speed, 10000);
                  break;
              case "2":          // 减速
                  speed -= 10;
                  speed = Math.max(speed, 10);
                  break;
          }
      });
  
      if (preUpdate) {
          viewer.scene.preUpdate.removeEventListener(preUpdate);
      }
  
      // 注册场景更新前事件监听器，每帧执行一次
      viewer.scene.preUpdate.addEventListener(preUpdate = () => {
          // 确保模型已加载
          if (!firstModel) return;
  
          // 根据速度计算下一个位置
          // multiplyByScalar将单位向量乘以标量，得到实际的移动向量
          Vector = Cesium.Cartesian3.multiplyByScalar(
              Cesium.Cartesian3.UNIT_X,  // 模型的X轴正方向作为前进方向
              speed / 10,                // 速度因子
              Vector
          );
  
          // 计算模型新位置
          // multiplyByPoint将变换矩阵应用于点，得到变换后的新位置
          position = Cesium.Matrix4.multiplyByPoint(
              firstModel.modelMatrix,  // 当前模型的变换矩阵
              Vector,                  // 移动向量
              position                 // 当前位置，结果也存储在这里
          );
  
          // 更新模型姿态与位置
          // 重新计算模型的变换矩阵，应用新的位置和姿态
          Cesium.Transforms.headingPitchRollToFixedFrame(
              position,                // 新位置
              headingPitchRoll,        // 当前姿态
              Cesium.Ellipsoid.WGS84,  // 使用WGS84椭球体
              fixedFrameTransform,     // 局部坐标系生成器
              firstModel.modelMatrix   // 更新模型的变换矩阵
          );
  
          // 根据视角状态更新相机位置
          // lookAt使相机看向指定目标点，并保持相对位置
          if (view != "none") {
              viewer.camera.lookAt(position, new Cesium.Cartesian3(...xyz));
          }
      });
  }
  
  /**
   * 漫游视角切换方法
   * @param {String} value -视角模式 ('first'|'god'|'none')
   */
  function changeRoamView(value) {
      view = value;
      switch (value) {
          case "first":
              xyz = firstRoamXYZ;  // 第一人称视角
              break;
          case "god":
              xyz = godRoamXYZ;    // 上帝视角
              break;
      }
  }
  
  /**
   * 暂停第一视角漫游事件
   */
  function stopFirstRoam() {
      // 移除事件监听器
      document.removeEventListener("keydown", firstDown, false);
      viewer.scene.preUpdate.removeEventListener(preUpdate);
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
  
  /**
   * 销毁第一视角漫游事件
   */
  function quitFirstRoam() {
      stopFirstRoam();
      // 移除模型
      if (firstModel) {
          viewer.scene.primitives.remove(firstModel);
          firstModel = "";
      }
      speed = 5;
      // 重置姿态控制对象
      headingPitchRoll = new Cesium.HeadingPitchRoll()
      viewer.camera.flyTo({
          duration: 1,
          destination: Cesium.Cartesian3.fromDegrees(116.3, 39.9, 1000),
          orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-20),
              roll: 0.0,
          },
      });
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
