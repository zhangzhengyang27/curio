<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 10 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\" >three.js</a> - vertex shader clipping via\n\t\t\t<a href=\"https://registry.khronos.org/webgl/extensions/WEBGL_clip_cull_distance/\" target=\"_blank\" rel=\"noopener\" >WEBGL_clip_cull_distance</a>\n\t\t\t<div id=\"notSupported\" style=\"display:none\">WEBGL_clip_cull_distance not supported"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  			let timer, stats;
  
  
  
  			
  
  
  				
  				camera.position.z = 2;
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				//
  
  				
  
  
  				if ( renderer.extensions.has( 'WEBGL_clip_cull_distance' ) === false ) {
  
  					document.getElementById( 'notSupported' ).style.display = '';
  					return;
  
  				}
  
  				const ext = renderer
  					.getContext()
  					.getExtension( 'WEBGL_clip_cull_distance' );
  				const gl = renderer.getContext();
  
  				gl.enable( ext.CLIP_DISTANCE0_WEBGL );
  
  				// geometry
  
  				const vertexCount = 200 * 3;
  
  				const geometry = new THREE.BufferGeometry();
  
  				const positions = [];
  				const colors = [];
  
  				for ( let i = 0; i < vertexCount; i ++ ) {
  
  					// adding x,y,z
  					positions.push( Math.random() - 0.5 );
  					positions.push( Math.random() - 0.5 );
  					positions.push( Math.random() - 0.5 );
  
  					// adding r,g,b,a
  					colors.push( Math.random() * 255 );
  					colors.push( Math.random() * 255 );
  					colors.push( Math.random() * 255 );
  					colors.push( Math.random() * 255 );
  
  				}
  
  				const positionAttribute = new THREE.Float32BufferAttribute( positions, 3 );
  				const colorAttribute = new THREE.Uint8BufferAttribute( colors, 4 );
  				colorAttribute.normalized = true;
  
  				geometry.setAttribute( 'position', positionAttribute );
  				geometry.setAttribute( 'color', colorAttribute );
  
  				// material
  
  				material = new THREE.ShaderMaterial( {
  
  					uniforms: {
  						time: { value: 1.0 }
  					},
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  					side: THREE.DoubleSide,
  					transparent: true,
  					vertexColors: true
  
  				} );
  
  				material.extensions.clipCullDistance = true;
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				//
  
  				
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				stats.update();
    				material.uniforms.time.value = timer.getElapsed();
  })
  		
}
</script>
