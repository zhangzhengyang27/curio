<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
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

  controls.enableDamping = true
  
  const loader = new FontLoader()
  loader.load(props.example?.globals?.FILE_HOST + 'files/json/font.json', font => {
  
      const textGeometry = new TextGeometry(`
          Three.js
          Cesium.js
          Examples
            - star -
      `, {
          font,
          size: 1,
          depth: 0.5,
          curveSegments: 10,
          bevelEnabled: false,
          bevelThickness: 0.1,
          bevelSize: 0.1,
          bevelSegments: 5
      }).center()
  
      const mesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const sampler = new MeshSurfaceSampler(mesh).build();
      const positions = new Float32Array(30000);
      const colors = new Float32Array(30000);
      const samplePoint = new THREE.Vector3();
      const color = new THREE.Color();
      
      for (let i = 0; i < 10000; i++) {
          sampler.sample(samplePoint);
          positions.set([samplePoint.x, samplePoint.y, samplePoint.z], i * 3);
      
          // 随机生成颜色
          color.setHSL(Math.random(), 1.0, 0.5);
          colors.set([color.r, color.g, color.b], i * 3);
      }
      
      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const pointsMaterial = new THREE.PointsMaterial({ size: 0.04, vertexColors: true });
      scene.add(new THREE.Points(pointsGeometry, pointsMaterial));
  
  })
}
</script>
