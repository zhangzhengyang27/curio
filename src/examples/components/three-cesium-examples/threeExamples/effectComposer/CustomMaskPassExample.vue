<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 2, 8]"
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
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

  class ScreenMaskPass extends ShaderPass {
  
      constructor() {
  
          super({
  
              name: 'ScreenMaskShader',
  
              uniforms: {
                  tDiffuse: { value: null },
                  opacity: { value: 1.0 },
                  intensity: { value: 2.0 },
                  maskColor: { value: new THREE.Color(1, 1, 1) },
                  R: { value: 0.1 },
                  sr: { value: 1.2 }
              },
  
              vertexShader: `
                  varying vec2 vUv;
                  void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                  }
              `,
  
              fragmentShader: `
                  uniform float opacity;
                  uniform float intensity;
                  uniform sampler2D tDiffuse;
                  uniform vec3 maskColor;
                  uniform float R;
                  uniform float sr;
                  varying vec2 vUv;
                  void main() {
                  // 阴影颜色
                  vec4 texel = texture2D( tDiffuse, vUv );
                  // 距离中心的距离
                  float dist = sqrt((vUv.x-0.5)*(vUv.x-0.5)+(vUv.y-0.5)*(vUv.y-0.5));
                  // 渐变, sr 是开始黑色参数
                  float rr = (sr - smoothstep(R, R + 0.5, dist));
                  // 叠加黑色
                  texel *= vec4(maskColor * rr * vec3(intensity,intensity,intensity), 1.0);
                  gl_FragColor = opacity * texel;
                  }
              `
  
          })
  
      }
  
  }
  
  const composer = new EffectComposer(renderer)
  
  const renderPass = new RenderPass(scene, camera)
  
  composer.addPass(renderPass)
  
  const screenMaskPass = new ScreenMaskPass()
  
  composer.addPass(screenMaskPass)
  
  scene.add(new THREE.AxesHelper(500), new THREE.GridHelper(500, 50))
  
  ctx.addUpdateCallback(() => {
    composer.render()
  })
  
  // 文件地址
  const urls = [0, 1, 2, 3, 4, 5].map(k => ('/external-examples/3d-file-server/files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  scene.background = textureCube;
}
</script>
