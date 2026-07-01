<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 10, 10]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
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

  // 坐标轴
  scene.add(new THREE.AxesHelper(100000))
  
  // 着色器
  const uniforms = {
  
      innerCircleWidth: { value: 0 },
  
      circleWidth: { value: 300 },
  
      diff: { value: new THREE.Color(1., 1., 1.) },
  
      color: { value: new THREE.Color('#8f95ff') },
  
      opacity: { value: 0.6 },
  
      center: { value: new THREE.Vector3(0, 0, 0) }
  
  }
  
  const material = new THREE.ShaderMaterial({
  
      uniforms,
  
      transparent: true,
  
      vertexShader: `
          varying vec2 vUv;
          varying vec3 v_position;
          void main() {
              vUv = uv;
              v_position = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
      `,
  
      fragmentShader: `
          varying vec2 vUv;
          varying vec3 v_position;
  
          uniform float innerCircleWidth;
          uniform float circleWidth;
          uniform float opacity;
          uniform vec3 center;
          
          uniform vec3 color;
          uniform vec3 diff;
  
          void main() {
              float dis = length(v_position - center);
              if(dis < (innerCircleWidth + circleWidth) && dis > innerCircleWidth) {
                  float r = (dis - innerCircleWidth) / circleWidth;
              
                  gl_FragColor = mix(vec4(diff, opacity), vec4(color, opacity), r);
              }else {
                  gl_FragColor = vec4(diff, opacity);
              }
          }
      `
  
  })
  
  // 加载模型
  new FBXLoader().load(props.example?.globals?.HOST + '/files/model/city.FBX', (object3d) => {
  
      scene.add(object3d)
  
      object3d.scale.set(0.001, 0.001, 0.001)
  
      object3d.traverse((child) => {
  
          if (child.isMesh) child.material = material
  
      })
  
  })
  
  // 渲染
  
  ctx.addUpdateCallback(() => {
    if (uniforms.innerCircleWidth.value < 1000) uniforms.innerCircleWidth.value += 3
        else uniforms.innerCircleWidth.value = 0
  })
}
</script>
