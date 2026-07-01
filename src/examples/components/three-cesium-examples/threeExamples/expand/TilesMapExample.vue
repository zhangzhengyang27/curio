<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10000, 0]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import * as tt from 'three-tile'
import * as plugin from "three-tile/plugin"
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

  scene.add(new THREE.AmbientLight(0xffffff, 5))
  
  const map = new tt.TileMap({
      imgSource: [new plugin.ArcGisSource(), new plugin.GDSource()],
      minLevel: 2,
      maxLevel: 18,
      lon0: 90
  })
  map.scale.multiplyScalar(0.001)
  map.rotateX(-Math.PI / 2)
  scene.add(map)
}
</script>
