<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 3]"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const controls = ctx.controls
  controls.enableDamping = true

  scene.background = new THREE.Color(0x000000)

  const texture = new THREE.TextureLoader().load(
    props.example?.globals?.FILE_HOST + 'threeExamples/shader/flag.webp'
  )

  const shadeMaterial = new THREE.ShaderMaterial({
    vertexShader: `precision mediump float;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        modelPosition.z = sin((modelPosition.x + uTime) * 10.0) * 0.05;
        modelPosition.z += sin((modelPosition.y + uTime) * 10.0) * 0.05;
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }`,
    fragmentShader: `precision mediump float;
      uniform sampler2D uTexture;
      varying vec2 vUv;

      void main() {
        vec4 textureColor = texture2D(uTexture, vUv);
        gl_FragColor = textureColor;
      }`,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: texture }
    }
  })

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 1, 128, 128), shadeMaterial)
  scene.add(plane)

  ctx.addUpdateCallback((delta: number, elapsed: number) => {
    shadeMaterial.uniforms.uTime.value = elapsed
  })
}
</script>
