<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { checker, uv, uniform, convertToTexture } from 'three/tsl';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Procedural Texture</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				
  				camera.position.z = 1;
  
  				
  
  				// procedural to texture
  
  				const uvScale = uniform( 4 );
  				const blurAmount = uniform( .5 );
  
  				const procedural = checker( uv().mul( uvScale ) );
  				const proceduralToTexture = convertToTexture( procedural, 512, 512 ); // ( node, width, height )
  
  				const colorNode = gaussianBlur( proceduralToTexture, blurAmount, 20 );
  
  				// extra
  
  				//proceduralToTexture.autoUpdate = false; // update just once
  				//proceduralToTexture.textureNeedsUpdate = true; // manually update
  
  				// scene
  
  				const material = new THREE.MeshBasicNodeMaterial();
  				material.colorNode = colorNode;
  
  				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( plane );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Procedural Texture' );
  				gui.add( uvScale, 'value', 1, 10 ).name( 'uv scale ( before rtt )' );
  				gui.add( blurAmount, 'value', 0, 2 ).name( 'blur amount ( after rtt )' );
  				gui.add( proceduralToTexture, 'autoUpdate' ).name( 'auto update' );
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
