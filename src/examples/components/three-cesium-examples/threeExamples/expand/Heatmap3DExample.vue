<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 40, 40]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { GUI } from 'lil-gui'
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

  /* heatmap.js 自行安装module 方式引入  此处我为src 方式引入  */
  
  scene.add(new THREE.AxesHelper(500), new THREE.AmbientLight(0xffffff, 3))
  
  // 渲染 
  
  const getRandom = (max: any, min: any) => Math.round((Math.random() * (max - min + 1) + min) * 10) / 10

  var heatmap = (globalThis as any).h337.create({
      container: document.createElement('div'),
      width: 256,
      height: 256,
      blur: '0.8',
      radius: 10
  });
  
  var i = 0, max = 10, data = [];
  while (i < 2000) {
      data.push({ x: getRandom(1, 256), y: getRandom(1, 256), value: getRandom(1, 6) });
      i++;
  }
  
  heatmap.setData({
      max: max,
      data: data
  });
  
  const texture = new THREE.CanvasTexture(heatmap._renderer.canvas);
  const geometry = new THREE.PlaneGeometry(50, 50, 1000, 1000);
  geometry.rotateX(-Math.PI * 0.5);
  
  const material = new THREE.ShaderMaterial({
      uniforms: {
          heightMap: { value: texture },
          heightRatio: { value: 5 }
      },
      vertexShader: `	uniform sampler2D heightMap;
  			uniform float heightRatio;
  			varying vec2 vUv;
  			varying float hValue;
  			varying vec3 cl;
  			void main() {
  			    vUv = uv;
  			    vec3 pos = position;
  		        cl = texture2D(heightMap, vUv).rgb;
  		        hValue = texture2D(heightMap, vUv).r;
  		        pos.y = hValue * heightRatio;
  		        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
  		    }`,
      fragmentShader: `varying float hValue;
  			varying vec3 cl;
  			void main() {
  		 		float v = abs(hValue - 1.);
  		 		gl_FragColor = vec4(cl, .8 - v * v) ; 
  		    }`,
      transparent: true,
  })
  
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  
  new GUI().add(mesh.material.uniforms.heightRatio, "value", 1, 15).name("heightRatio")
}
</script>
