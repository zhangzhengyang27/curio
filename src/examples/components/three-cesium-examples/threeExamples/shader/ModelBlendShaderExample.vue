<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[3, 3, 3]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
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

  scene.add(new THREE.AmbientLight(0xffffff, 3))
  
  scene.add(new THREE.AxesHelper(1000))
  
  let car = null
  
  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.HOST + '/files/model/car.glb',
  
      gltf => {
  
          car = gltf.scene
  
          scene.add(car)
  
          modelBlendShader(car, box)
  
      }
  
  )
  
  ctx.addUpdateCallback(() => {
    car?.render?.()
  })
  
  /* 混合着色 */
  function modelBlendShader(model, DOM) {
  
      let materials = []
  
      model.traverse(c => c.isMesh && materials.push(c.material))
  
      materials = [... new Set(materials)]
  
      const uniforms = {
  
          iResolution: {
              type: 'v2',
              value: new THREE.Vector2(DOM.clientWidth, DOM.clientHeight)
          },
  
          iTime: {
              type: 'f',
              value: 1.0
          }
  
      }
  
      materials.forEach(material => {
  
          material.onBeforeCompile = shader => {
  
              shader.uniforms.iResolution = uniforms.iResolution
  
              shader.uniforms.iTime = uniforms.iTime
  
              shader.fragmentShader = shader.fragmentShader.replace(/#include <common>/, `
                  uniform vec2 iResolution;
                  uniform float iTime;
                  #include <common> 
              `)
  
              shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
                  vec3 c;
                  float l,z=iTime;
                  for(int i=0;i<3;i++) {
                      vec2 uv,p=gl_FragCoord.xy/iResolution/2.0;
                      uv=p +  2.0;
                      p-=.5;
                      p.x*=iResolution.x/iResolution.y;
                      z+=.07;
                      l=length(p);
                      uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z-z));
                      c[i]=.01/length(mod(uv,1.)-.5);
                  }
                  vec4 diffuseColor = vec4( diffuse * c  * vec3(20.,20.,20.), opacity );
              `)
  
          }
  
          material.needsUpdate = true
  
      })
  
      model.render = () => uniforms.iTime.value += 0.02
  
  }
}
</script>
