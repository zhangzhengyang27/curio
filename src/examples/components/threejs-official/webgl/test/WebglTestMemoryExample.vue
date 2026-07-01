<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 1, far: 10000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - memory test I"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  				
  				camera.position.z = 200;
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  
  				
  
  
  				
  
  
  			function createImage() {
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = 256;
  				canvas.height = 256;
  
  				const context = canvas.getContext( '2d' );
  				context.fillStyle = 'rgb(' + Math.floor( Math.random() * 256 ) + ',' + Math.floor( Math.random() * 256 ) + ',' + Math.floor( Math.random() * 256 ) + ')';
  				context.fillRect( 0, 0, 256, 256 );
  
  				return canvas;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const geometry = new THREE.SphereGeometry( 50, Math.random() * 64, Math.random() * 32 );
    				const texture = new THREE.CanvasTexture( createImage() );
    				const material = new THREE.MeshBasicMaterial( { map: texture, wireframe: true } );
    				const mesh = new THREE.Mesh( geometry, material );
    				scene.add( mesh );
    				scene.remove( mesh );
    				// clean up
    				geometry.dispose();
    				material.dispose();
    				texture.dispose();
  })
  
  		
}
</script>
