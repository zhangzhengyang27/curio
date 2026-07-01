<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 2000 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl - canvas as a texture\n\t\t\t<div>click and draw in the white box"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let mesh, material;
  			const drawStartPos = new THREE.Vector2();
  
  			
  			setupCanvasDrawing();
  
  			
  
  
  				
  				camera.position.z = 500;
  
  				
  
  				material = new THREE.MeshBasicMaterial();
  
  				mesh = new THREE.Mesh( new THREE.BoxGeometry( 200, 200, 200 ), material );
  				scene.add( mesh );
  
  				
  
  
  				
  
  			
  
  
  			// Sets up the drawing canvas and adds it as the material map
  
  			function setupCanvasDrawing() {
  
  				// get canvas and context
  
  				const drawingCanvas = document.getElementById( 'drawing-canvas' );
  				const drawingContext = drawingCanvas.getContext( '2d' );
  
  				// draw white background
  
  				drawingContext.fillStyle = '#FFFFFF';
  				drawingContext.fillRect( 0, 0, 128, 128 );
  
  				// set canvas as material.map (this could be done to any map, bump, displacement etc.)
  
  				material.map = new THREE.CanvasTexture( drawingCanvas );
  
  				// set the variable to keep track of when to draw
  
  				let paint = false;
  
  				// add canvas event listeners
  				drawingCanvas.addEventListener( 'pointerdown', function ( e ) {
  
  					paint = true;
  					drawStartPos.set( e.offsetX, e.offsetY );
  
  				} );
  
  				drawingCanvas.addEventListener( 'pointermove', function ( e ) {
  
  					if ( paint ) draw( drawingContext, e.offsetX, e.offsetY );
  
  				} );
  
  				drawingCanvas.addEventListener( 'pointerup', function () {
  
  					paint = false;
  
  				} );
  
  				drawingCanvas.addEventListener( 'pointerleave', function () {
  
  					paint = false;
  
  				} );
  
  			}
  
  			function draw( drawContext, x, y ) {
  
  				drawContext.moveTo( drawStartPos.x, drawStartPos.y );
  				drawContext.strokeStyle = '#000000';
  				drawContext.lineTo( x, y );
  				drawContext.stroke();
  				// reset drawing start position to current position.
  				drawStartPos.set( x, y );
  				// need to flag the map as needing updating.
  				material.map.needsUpdate = true;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    mesh.rotation.x += 0.01;
    				mesh.rotation.y += 0.01;
  })
  
  		
}
</script>
