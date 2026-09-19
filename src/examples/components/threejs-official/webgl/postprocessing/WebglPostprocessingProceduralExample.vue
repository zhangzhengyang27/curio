<template>
  <ExampleScene
    camera="perspective"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Procedural Effects Example by <a href=\"https://clara.io\" target=\"_blank\" rel=\"noopener\">Ben Houston</a><br/><br/>"

const proceduralVertShader = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const noiseRandom1DFragShader = /* glsl */`
#include <common>
varying vec2 vUv;
void main() {
    gl_FragColor = vec4(vec3(rand(vUv.x)), 1.0);
}
`

const noiseRandom2DFragShader = /* glsl */`
#include <common>
varying vec2 vUv;
void main() {
    gl_FragColor = vec4(vec3(rand(vUv)), 1.0);
}
`

const noiseRandom3DFragShader = /* glsl */`
#include <common>
varying vec2 vUv;
void main() {
    gl_FragColor = vec4(rand(vec3(vUv, 1.0)), rand(vec3(vUv.yx, 1.0)), rand(vec3(vUv, vUv.x)), 1.0);
}
`

function onReady(__stage: any) {
  const scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let postCamera, postScene;
  			let postMaterial: any, noiseRandom1DMaterial, noiseRandom2DMaterial, noiseRandom3DMaterial, postQuad;
  			let stats;
  
  			const params = { procedure: 'noiseRandom3D' };
  
  			
  
  
  				const container = __stage.container;
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// Setup post processing stage
  				postCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  				noiseRandom1DMaterial = new THREE.ShaderMaterial( {
  					vertexShader: proceduralVertShader,
  					fragmentShader: noiseRandom1DFragShader
  				} );
  				noiseRandom2DMaterial = new THREE.ShaderMaterial( {
  					vertexShader: proceduralVertShader,
  					fragmentShader: noiseRandom2DFragShader
  				} );
  				noiseRandom3DMaterial = new THREE.ShaderMaterial( {
  					vertexShader: proceduralVertShader,
  					fragmentShader: noiseRandom3DFragShader
  				} );
  				postMaterial = noiseRandom3DMaterial;
  				const postPlane = new THREE.PlaneGeometry( 2, 2 );
  				postQuad = new THREE.Mesh( postPlane, postMaterial );
  				postScene = new THREE.Scene();
  				postScene.add( postQuad );
  
  				
  
  				//
  
  				gui = new GUI();
  				gui.add( params, 'procedure', [ 'noiseRandom1D', 'noiseRandom2D', 'noiseRandom3D' ] );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    switch ( params.procedure ) {
    					case 'noiseRandom1D': postMaterial = noiseRandom1DMaterial; break;
    					case 'noiseRandom2D': postMaterial = noiseRandom2DMaterial; break;
    					case 'noiseRandom3D': postMaterial = noiseRandom3DMaterial; break;
    				}
    				postQuad.material = postMaterial;
    				// render post FX
    				stats.update();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
