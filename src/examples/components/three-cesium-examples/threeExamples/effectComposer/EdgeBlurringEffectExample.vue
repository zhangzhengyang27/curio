<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 5]"
    :clear-color="0xffffff"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { Color, UniformsUtils } from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera

  scene.background = new Color(0xffffff)

  const vertexShader = `
    precision highp float;
    precision highp int;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `

  const fragmentShader = `
    precision highp float;
    precision highp int;
    uniform float edge;
    uniform float opacity;
    uniform sampler2D map;
    varying vec2 vUv;
    void main(){
      float edgeMin = edge;
      float edgeMax = 1.0 - edge;
      gl_FragColor = texture2D( map, vUv );
      if(vUv.x < edgeMin){
        if(vUv.y < edgeMin){
          gl_FragColor.a = (min(vUv.x / edgeMin, vUv.y / edgeMin)) * opacity;
        }
        else if(vUv.y >= edgeMin && vUv.y <= edgeMax){
          gl_FragColor.a = (vUv.x / edgeMin) * opacity;
        }
        else if(vUv.y > edgeMax){
          gl_FragColor.a = (min(vUv.x / edgeMin, 1.0 - ((vUv.y - edgeMax) / edgeMin))) * opacity;
        }
        else{
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      }
      else if (vUv.x >= edgeMin && vUv.x <= edgeMax){
        if(vUv.y < edgeMin){
          gl_FragColor.a = (vUv.y / edgeMin) * opacity;
        }
        else if(vUv.y >= edgeMin && vUv.y <= edgeMax){
          gl_FragColor.a = 1.0 * opacity;
        }
        else if(vUv.y > edgeMax){
          gl_FragColor.a = (1.0 - ((vUv.y - edgeMax) / edgeMin)) * opacity;
        }
      }
      else if (vUv.x > edgeMax){
        float xNormal = 1.0 - ((vUv.x - edgeMax) / edgeMin);
        if(vUv.y < edgeMin){
          gl_FragColor.a = (min(vUv.y / edgeMin, xNormal)) * opacity;
        }
        else if(vUv.y >= edgeMin && vUv.y <= edgeMax){
          gl_FragColor.a = (xNormal) * opacity;
        }
        else if(vUv.y > edgeMax){
          gl_FragColor.a = (min(xNormal, 1.0 - ((vUv.y - edgeMax) / edgeMin))) * opacity;
        }
      }
    }
  `

  const geometry = new THREE.PlaneGeometry(2, 4)
  const material1 = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const material2 = new THREE.RawShaderMaterial({
    uniforms: UniformsUtils.clone({
      map: { type: 't', value: null },
      edge: { type: 'f', value: 0.1 },
      opacity: { type: 'f', value: 1 }
    }),
    transparent: true,
    opacity: 1,
    alphaTest: 1,
    depthTest: true,
    vertexShader,
    fragmentShader
  })

  const cube = new THREE.Mesh(geometry, material1)
  const rect = new THREE.Mesh(geometry, material2)
  cube.position.set(-2, 0, 0)
  rect.position.set(0, 0, 0)

  scene.add(cube)
  scene.add(rect)
}
</script>
