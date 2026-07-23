<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 10, 10]"
    alpha
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
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

  camera.add(new THREE.PointLight(0xffffff, 1, 1000, 0.01))
  scene.add(camera)

  if (controls) controls.enableDamping = true

  scene.add(new THREE.GridHelper(10, 10))

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new OutputPass())

  const finalMaterial = new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      saturation: { value: 0.2 },
      brightness: { value: 0.2 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      vec3 hsv2rgb( in vec3 c ){
        vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
        return c.z * mix( vec3(1.0), rgb, c.y);
      }

      vec3 rgbToHsv(vec3 rgb){
        vec3 hsv = vec3(0);
        float maxC = max(max(rgb.r,rgb.g),rgb.b);
        float minC = min(min(rgb.r,rgb.g),rgb.b);
        float delta = maxC - minC;
        if (maxC == rgb.r) hsv.x = mod((rgb.g - rgb.b)/delta,6.0)/6.0;
        if (maxC == rgb.g) hsv.x = (rgb.b - rgb.r)/(delta*6.0) + 1.0/3.0;
        if (maxC == rgb.b) hsv.x = (rgb.r - rgb.g)/(delta*6.0) + 2.0/3.0;
        hsv.y = delta/maxC;
        hsv.z = maxC;
        return hsv;
      }

      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform float saturation;
      uniform float brightness;
      void main(){
        vec4 col = texture2D(tDiffuse,vUv);
        vec3 hsvCol = rgbToHsv(col.rgb);
        hsvCol.y *= saturation;
        hsvCol.z *= brightness;
        vec3 col2 = hsv2rgb(hsvCol);
        gl_FragColor = vec4(col2,col.a);
        #include <colorspace_fragment>
      }
    `
  })

  const finalPass = new ShaderPass(finalMaterial)
  composer.addPass(finalPass)

  gui = new GUI()
  gui.add(finalMaterial.uniforms.saturation, 'value', 0, 1, 0.01).name('饱和度')
  gui.add(finalMaterial.uniforms.brightness, 'value', 0, 1, 0.01).name('亮度')

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  for (let i = 0; i < 100; i++) {
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() })
    const mesh = new THREE.Mesh(boxGeometry, material)
    mesh.position.x = Math.random() * 10 - 5
    mesh.position.y = Math.random() * 10 - 5
    mesh.position.z = Math.random() * 10 - 5
    scene.add(mesh)
  }

  ctx.addUpdateCallback(() => {
    if (controls) controls.update()
    composer.render()
  })
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
