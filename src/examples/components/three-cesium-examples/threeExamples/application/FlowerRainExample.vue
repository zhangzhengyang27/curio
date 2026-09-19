<template>
  <ExampleScene
    camera="orthographic"
    :camera-options="{ size: 200 }"
    :camera-position="[0, 200, 500]"
    :camera-look-at="[0, 0, 0]"
    :control-options="{ autoRotate: true }"
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
  const { width, height } = ctx.size
  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'

  const petal = new THREE.Group()

  const textures = [1, 2, 3, 4, 5].map((i) =>
    new THREE.TextureLoader().load(FILE_HOST + `examples/flowerAndHouse/img/flower${i}.png`)
  )

  for (let i = 0; i < 400; i++) {
    const spriteMaterial = new THREE.SpriteMaterial({
      map: textures[Math.floor(Math.random() * textures.length)]
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    petal.add(sprite)

    sprite.scale.set(40, 50, 1)
    sprite.position.set(
      2000 * (Math.random() - 0.5),
      500 * Math.random(),
      2000 * (Math.random() - 0.5)
    )
  }
  scene.add(petal)

  ctx.addUpdateCallback(() => {
    petal.children.forEach((sprite) => {
      sprite.position.y -= 5
      sprite.position.x += 0.5
      if (sprite.position.y < -height / 2) {
        sprite.position.y = height / 2
      }
      if (sprite.position.x > 1000) {
        sprite.position.x = -1000
      }
    })
  })
}
</script>
