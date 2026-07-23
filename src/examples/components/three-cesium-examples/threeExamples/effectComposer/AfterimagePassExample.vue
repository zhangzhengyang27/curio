<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[40, 40, 40]"
    :clear-color="'#000'"
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'lil-gui';
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

  // 初始化场景、相机、渲染器
  
  // 初始化控制器
  controls.enableDamping = true;
  // 添加光源
  const directionalLight = new THREE.DirectionalLight('#fff');
  directionalLight.position.set(30, 30, 30).normalize();
  scene.add(directionalLight);
  const ambientLight = new THREE.AmbientLight('#fff', 2);
  scene.add(ambientLight);
  
  // 添加性能监控
  const stats = new Stats();
  ctx.overlay?.appendChild(stats.dom)
  
  scene.fog = new THREE.Fog(0x000000, 1, 1000);
  
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(15, 0, 0)
  scene.add(mesh);
  
  new GLTFLoader().load(props.example?.globals?.FILE_HOST + "files/model/Fox.glb", (gltf) => {
  
      scene.add(gltf.scene)
  
      gltf.scene.scale.multiplyScalar(0.1)
  
  })
  
  // 后期处理
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const afterimagePass = new AfterimagePass();
  composer.addPass(afterimagePass);
  
  // GUI控制
  const params = {
      enable: true
  };
  gui = new GUI({ name: 'Damp setting' });
  gui.add(afterimagePass.uniforms["damp"], 'value', 0, 1).step(0.001);
  gui.add(params, 'enable');
  
  // 窗口大小调整
  
  function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
  }
  
  // 动画渲染
  ctx.addUpdateCallback(() => {
    stats.update();
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
        if (params.enable) {
            composer.render();
        } else {
        }
  })
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
