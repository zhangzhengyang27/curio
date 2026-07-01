<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
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

  scene.add(new THREE.AxesHelper(50))
  
  controls.enableDamping = true
  
  const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  
  void main() {
    // 视图空间下的单位法线向量
    vNormal = normalize(normalMatrix * normal);
    // 视图空间下的单位坐标向量
    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0) ).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `
  
  /**
  * 需要注意法线向量值，菲涅尔反射对于法线向量差别比较大的模型效果明显，即不规则物体
  * 模型表面平整的话效果较差，不过可以使用法线贴图更改物体法线向量
  */
  const fragmentShader = `
  uniform vec3 uColor;
  uniform float uBias;
  uniform float uPower;
  uniform float uScale;
  
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  
  // 菲涅尔反射
  float fresnelReflex() {
      return pow(uBias + uScale * abs(dot(vNormal, vPositionNormal)), uPower);
  }
  
  void main() {
      float opacity = fresnelReflex();
      gl_FragColor = vec4(uColor, opacity);
  }`
  
  const material = new THREE.ShaderMaterial({
      uniforms: {
          uColor: { value: new THREE.Color(0x00ffff) },
          uBias: { value: 1.0 },
          uScale: { value: -1.0 },
          uPower: { value: 2.0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true
  })
  
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), material)
  
  scene.add(sphere)
  
  const vertexShader1 = `
    varying vec2 vUV;
  
    void main() {
    vUV = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `
  const fragmentShader1 = `
    uniform vec3 uColor;
  
    varying vec2 vUV;
  
    float glow(vec2 coord, float radius, float intensity) {
      return pow(radius / length(coord), intensity);
    }
  
    void main() {
      float ratio = glow(vUV - vec2(0.5), 0.1, 3.0);
      gl_FragColor = vec4(uColor * ratio, ratio);
    }
  
    `
  const material1 = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x00ffff) }
    },
    vertexShader: vertexShader1,
    fragmentShader: fragmentShader1,
    depthWrite: false,
    transparent: true
  })
  
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material1)
  
  plane.position.set(1, 0, 1)
  
  scene.add(plane)
}
</script>
