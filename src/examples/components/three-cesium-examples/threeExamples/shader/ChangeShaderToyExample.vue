<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import * as dat from 'dat.gui'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  scene.add(new THREE.AmbientLight(0xffffff, 8))
  
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  
  scene.add(mesh);
  
  // GUI 对象
  const GUI = new dat.GUI()
  
  const fileList = new Array(6).fill().map((_, i) => props.example?.globals?.FILE_HOST + `files/glsl/${i}.frag`)
  
  GUI.add({ url: fileList[0] }, 'url', fileList).onChange((url) => changeShader(url))
  
  changeShader(fileList[5])
  
  let shader = null
  
  // 渲染 
  ctx.addUpdateCallback(() => {
    shader && (shader.uniforms.u_time.value += 0.02)
  })
  
  async function changeShader(url) {
  
      const str = await fetch(url).then(res => res.text())
  
      shader = {
  
          uniforms: THREE.UniformsUtils.merge([
  
              THREE.ShaderLib['phong'].uniforms,
  
              {
                  u_resolution: {
                      type: 'v2',
                      value: new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight)
                  },
  
                  u_time: {
                      type: 'f',
                      value: 0.0
                  },
  
                  u_mouse: {
                      type: 'v2',
                      value: new THREE.Vector2(0, 0)
                  }
  
              }
  
          ]),
  
          side: THREE.DoubleSide,
  
          vertexShader: `
              varying vec2 vUv;
              void main() {
                  vUv = uv;
                  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                  gl_Position = projectionMatrix * mvPosition;
              }
          `,
  
          fragmentShader: str,
  
      }
  
      shader.fragmentShader = shader.fragmentShader.replace(/gl_FragCoord/, 'vUv * u_resolution.xy')
  
      shader.fragmentShader = shader.fragmentShader.replace(/uniform float u_time;/, `
          uniform float u_time;
          varying vec2 vUv;
      `)
  
      const material = new THREE.ShaderMaterial(shader);
  
      mesh.material.dispose()
  
      mesh.material = material
  
  }
}
</script>
