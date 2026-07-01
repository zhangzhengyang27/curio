<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 2]"
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

  /* 顶点着色器 */
  const vertexShader = `
  varying vec2 vUv;
  void main(){
  	vec4 mPosition=modelMatrix*vec4(position,1.);
  	gl_Position=projectionMatrix*viewMatrix*mPosition;
  	vUv = uv;
  }`
  
  /* 片元着色器 */
  const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  
  void main(){
    vec2 uv=vUv;
    float circular=length(uv-vec2(.5));
    circular=smoothstep(.3,.29,circular);
    vec3 color=vec3(0.);
    vec3 sumCol=mix(vec3(4.,0.,.2),vec3(1.,1.1,0.),uv.y);
    // 递减值
    float decreasing=(-uv.y+.3);
    uv.y +=uTime/10.;
    float line=fract(uv.y*20.);
    line=abs(line-.5);
    line-=decreasing;
    line=step(line,.2);
    color+=circular*sumCol*(1.-line);
    gl_FragColor=vec4(color,1.);
  }`
  
  // 自定义材质
  const material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    uniforms: {
      uTime: { value: 0 },
    },
    side: THREE.DoubleSide,
  })
  
  const geometry = new THREE.PlaneGeometry(2, 2)
  const mesh = new THREE.Mesh(geometry, material) //网格模型对象Mesh
  
  scene.add(mesh)
  
  ctx.addUpdateCallback(() => {
    material.uniforms.uTime.value += 0.03
  })
}
</script>
