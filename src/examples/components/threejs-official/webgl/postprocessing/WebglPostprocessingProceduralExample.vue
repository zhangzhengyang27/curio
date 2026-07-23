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

<script setup>
import { onUnmounted } from 'vue'

let gui = null
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
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let postCamera, postScene;
  			let postMaterial, noiseRandom1DMaterial, noiseRandom2DMaterial, noiseRandom3DMaterial, postQuad;
  			let stats;
  
  			const params = { procedure: 'noiseRandom3D' };
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// Setup post processing stage
  				postCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  				noiseRandom1DMaterial = new THREE.ShaderMaterial( {
  					vertexShader: document.querySelector( '#procedural-vert' ).textContent.trim(),
  					fragmentShader: document.querySelector( '#noiseRandom1D-frag' ).textContent.trim()
  				} );
  				noiseRandom2DMaterial = new THREE.ShaderMaterial( {
  					vertexShader: document.querySelector( '#procedural-vert' ).textContent.trim(),
  					fragmentShader: document.querySelector( '#noiseRandom2D-frag' ).textContent.trim()
  				} );
  				noiseRandom3DMaterial = new THREE.ShaderMaterial( {
  					vertexShader: document.querySelector( '#procedural-vert' ).textContent.trim(),
  					fragmentShader: document.querySelector( '#noiseRandom3D-frag' ).textContent.trim()
  				} );
  				postMaterial = noiseRandom3DMaterial;
  				const postPlane = new THREE.PlaneGeometry( 2, 2 );
  				postQuad = new THREE.Mesh( postPlane, postMaterial );
  				postScene = new THREE.Scene();
  				postScene.add( postQuad );
  
  				
  
  				//
  
  				gui = new GUI();
  				gui.add( params, 'procedure', [ 'noiseRandom1D', 'noiseRandom2D', 'noiseRandom3D' ] );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
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
