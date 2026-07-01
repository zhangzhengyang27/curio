<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    :camera-look-at="[0, 10, 0]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from "three";
import TWEEN from "three/examples/jsm/libs/tween.module.js";
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  const geometry = new THREE.BoxGeometry(10, 60, 100); //几何体
  const material = new THREE.MeshLambertMaterial(); //材质
  const mesh = new THREE.Mesh(geometry, material); //网格模型
  mesh.position.set(0, 10, 0); //网格模型位置
  // scene.add(mesh); //场景添加网格模型
  
  // 3d半圆扩散 + 扩散波
  let circle3D = scatter3DCircle(50);
  circle3D.layers.enable(1);
  circle3D.position.set(0, 10, 0);
  scene.add(circle3D);
  
  // AxesHelper
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);
  
  // 光源
  const pointLight = new THREE.DirectionalLight(0xff00ff, 1.0); //颜色、强度
  pointLight.position.set(200, 300, 400); //位置
  scene.add(pointLight); //点光源添加到场景中
  
  // 光源参考线
  const dirLightHelper = new THREE.DirectionalLightHelper(
    pointLight,
    5,
    0xff0000
  );
  scene.add(dirLightHelper);
  
  // 相机
  
  // 渲染器
  
  // 设置相机控件轨道控制器OrbitControls
  
  // 圆扩散
  function scatter3DCircle(r) {
    const geometry = new THREE.SphereGeometry(
      r,
      120,
      120,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
  
    let circle = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        // side: THREE.DoubleSide,
        // transparent: true,
        // color:new THREE.Color("#ff0000")
        map: new THREE.TextureLoader().load(
          props.example?.globals?.FILE_HOST + "images/four/gradual_red_01.png"
        ),
      })
    );
  
    return circle;
  }
  let s = 0,
    p = 0;
  
  ctx.addUpdateCallback(() => {
    // animation
      if (s > 160) {
        (s = 0), (p = 160);
      }
      circle3D.scale.set(1 + s / 60, 1 + s / 80, 1 + s / 60);
      circle3D.material.opacity = p / 160;
      s++;
      p--;
      TWEEN.update();
  })
}
</script>
