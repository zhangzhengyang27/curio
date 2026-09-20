<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 100, 300]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.autoRotate = true
  
  let sampler: any = null
  
  let path: any = null
  
  new OBJLoader().load(

      props.example?.globals?.FILE_HOST + 'files/model/z2586300277.obj',

      (obj) => {

          sampler = new MeshSurfaceSampler(obj.children[0] as THREE.Mesh).build();

          path = new Path();

          scene.add(path.line);

          },

      undefined,

      (err) => console.error('[z2586300277] OBJ 加载失败:', err)

  )

  const tempPosition = new THREE.Vector3();
  
  class Path {
      vertices: any[]
      geometry: THREE.BufferGeometry
      material: THREE.LineBasicMaterial
      line: THREE.Line
      previousPoint: THREE.Vector3
      constructor() {
  
          this.vertices = [];
  
          this.geometry = new THREE.BufferGeometry();
  
          this.material = new THREE.LineBasicMaterial({ color: 0xa58fb5, transparent: true, opacity: 0.5 });
  
          this.line = new THREE.Line(this.geometry, this.material);
  
          sampler.sample(tempPosition);
  
          this.previousPoint = tempPosition.clone()
  
      }
      update() {
  
          let pointFound = false;
  
          while (!pointFound) {
  
              sampler.sample(tempPosition);
  
              if (tempPosition.distanceTo(this.previousPoint) < 20) {
  
                  this.vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
  
                  this.previousPoint = tempPosition.clone();
  
                  pointFound = true;
  
              }
  
          }
  
          this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.vertices, 3));
  
      }
  
  }
  
  function render() {

      if (!path) return

      if (path.vertices.length < 50000) {

          Array.from({ length: 10 }).forEach(() => path.update())

      }

      controls.update();

  }

  // 原移植版本定义了 render 却从未注册进渲染循环，线条永远长不出来（黑屏）
  ctx.addUpdateCallback(render)
}
</script>
