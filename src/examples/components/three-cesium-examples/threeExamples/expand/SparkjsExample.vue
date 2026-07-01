<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 5]"
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

async function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  const { SparkRenderer, SplatMesh } = await import('@sparkjsdev/spark')

  scene.add(new THREE.AxesHelper(100))

  const spark = new SparkRenderer({ renderer });

  scene.add(spark);

  const params = { url: props.example?.globals?.FILE_HOST + 'other/deskFlower.ksplat' }

  const butterfly = new SplatMesh(params);

  butterfly.quaternion.set(0, 0, -1, 0);

  butterfly.position.set(2, 2, -3)

  scene.add(butterfly)
}
</script>
