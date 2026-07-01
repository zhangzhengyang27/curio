<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.01, far: 200 }"
    :camera-position="[0, 1.2, 3.6]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0xf6f6f8"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import {
  BoxGeometry,
  EquirectangularReflectionMapping,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import ExampleScene from '../../ExampleScene.vue'

class ResourceTracker {
  constructor() {
    this.resources = new Set()
  }
  track(resource) {
    if (Array.isArray(resource)) {
      for (const child of resource) {
        this.track(child)
      }
    } else {
      this.resources.add(resource)
      if (resource instanceof Material) {
        for (const value of Object.values(resource)) {
          if (value instanceof Texture) {
            this.track(value)
          }
        }
        if ('uniforms' in resource) {
          for (const uniform of Object.values(resource.uniforms)) {
            if (!uniform) continue
            const uniformValue = uniform.value
            if (uniformValue instanceof Texture || Array.isArray(uniformValue)) {
              this.track(uniformValue)
            }
          }
        }
      }
      if (resource instanceof Object3D) {
        if (resource instanceof Mesh) {
          this.track(resource.geometry)
          this.track(resource.material)
        }
        this.track(resource.children)
      }
    }
    return resource
  }
  untrack(resource) {
    this.resources.delete(resource)
  }
  dispose() {
    for (const resource of this.resources) {
      if (resource instanceof Object3D) {
        resource.parent?.remove(resource)
      } else {
        resource.dispose()
      }
    }
    this.resources.clear()
  }
}

function onReady(ctx) {
  const { scene } = ctx

  const resTracker = new ResourceTracker()

  const boxGeometry = new BoxGeometry(1, 1, 1)
  const boxMaterial = new MeshStandardMaterial({
    metalness: 1,
    roughness: 0.3,
  })
  const box = new Mesh(boxGeometry, boxMaterial)
  scene.add(box)
  resTracker.track(box)

  new RGBELoader()
    .loadAsync(
      '/external-examples/threejs-lesson/09-cleanup/public/textures/venice_sunset_1k.hdr',
    )
    .then((texture) => {
      texture.mapping = EquirectangularReflectionMapping
      scene.environment = texture
      resTracker.track(texture)
    })

  new TextureLoader()
    .loadAsync(
      '/external-examples/threejs-lesson/09-cleanup/public/textures/wall.jpg',
    )
    .then((map) => {
      map.colorSpace = SRGBColorSpace
      boxMaterial.map = map
      boxMaterial.needsUpdate = true
      resTracker.track(map)
    })

  ctx.addUpdateCallback((delta, elapsed) => {
    box.rotation.y = elapsed * 0.001
  })
}
</script>
