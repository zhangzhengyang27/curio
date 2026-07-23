<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 0.1, far: 5 }"
    :camera-position="[2, 2, 2]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0x000000"
    @ready="onReady"
  />
</template>

<script setup>
import {
  BoxGeometry,
  Material,
  Mesh,
  Object3D,
  Texture,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three'
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

  const geometry = new BoxGeometry(1, 1, 1)
  const loader = new TextureLoader()
  const texture = loader.load(
    '/external-examples/threejs-lesson/09-cleanup/public/textures/wall.jpg',
  )
  texture.colorSpace = SRGBColorSpace

  const material = new MeshBasicMaterial({
    map: texture,
  })
  const cube = new Mesh(geometry, material)
  scene.add(cube)

  resTracker.track(scene)
}
</script>
