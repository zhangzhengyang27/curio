<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :clear-color="0x000000"
    :camera-position="[-50, 0, 50]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    custom-render
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Wireframe } from 'three/examples/jsm/lines/webgpu/Wireframe.js';
import { WireframeGeometry2 } from 'three/examples/jsm/lines/WireframeGeometry2.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Fat Lines</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			let wireframe, camera2, backgroundNode;
  			let wireframe1;
  			let matLine, matLineBasic, matLineDashed;
  			let gui;
  
  			// viewport
  			let insetWidth;
  
  
  			
  
  
  				
  
  
  				renderer.setClearColor( 0x000000 );
  				renderer.inspector = new Inspector();
  
  
  				
  
  				
  
  
  				camera2 = new THREE.PerspectiveCamera( 40, 1, 1, 1000 );
  				camera2.position.copy( camera.position );
  
  				
  				controls.minDistance = 10;
  				controls.maxDistance = 500;
  
  				backgroundNode = color( 0x222222 );
  
  				// Wireframe ( WireframeGeometry2, Line2NodeMaterial )
  
  				let geo = new THREE.IcosahedronGeometry( 20, 1 );
  
  				const geometry = new WireframeGeometry2( geo );
  
  				matLine = new THREE.Line2NodeMaterial( {
  
  					color: 0x4080ff,
  					linewidth: 5, // in world units with size attenuation, pixels otherwise
  					dashed: false
  
  				} );
  
  				wireframe = new Wireframe( geometry, matLine );
  				wireframe.computeLineDistances();
  				wireframe.scale.set( 1, 1, 1 );
  				scene.add( wireframe );
  
  				// Line ( THREE.WireframeGeometry, THREE.LineBasicMaterial ) - rendered with gl.LINE
  
  				geo = new THREE.WireframeGeometry( geo );
  
  				matLineBasic = new THREE.LineBasicMaterial( { color: 0x4080ff } );
  				matLineDashed = new THREE.LineDashedMaterial( { scale: 2, dashSize: 1, gapSize: 1 } );
  
  				wireframe1 = new THREE.LineSegments( geo, matLineBasic );
  				wireframe1.computeLineDistances();
  				wireframe1.visible = false;
  				scene.add( wireframe1 );
  
  				//
  
  				
  				onWindowResize();
  
  				initGui();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    // main scene
    				renderer.setViewport( 0, 0, (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.autoClear = true;
    				scene.backgroundNode = null;
    				scene.name = 'Scene';
    				// inset scene
    				const posY = (__stage.container?.clientHeight || window.innerHeight) - insetHeight - 20;
    				renderer.clearDepth(); // important!
    				renderer.setScissorTest( true );
    				renderer.setScissor( 20, posY, insetWidth, insetHeight );
    				renderer.setViewport( 20, posY, insetWidth, insetHeight );
    				camera2.position.copy( camera.position );
    				camera2.quaternion.copy( camera.quaternion );
    				renderer.autoClear = false;
    				scene.backgroundNode = backgroundNode;
    				scene.name = 'Scene [ Scissor ]';
    				renderer.render( scene, camera2 );
    				renderer.setScissorTest( false );
  })
  
  			//
  
  			function initGui() {
  
  				gui = renderer.inspector.createParameters( 'Settings' );
  
  				const param = {
  					'line type': 0,
  					'width (px)': 5,
  					'dashed': false,
  					'dash scale': 1,
  					'dash / gap': 1
  				};
  
  
  				gui.add( param, 'line type', { 'LineGeometry': 0, 'gl.LINE': 1 } ).onChange( function ( val ) {
  
  					switch ( val ) {
  
  						case 0:
  							wireframe.visible = true;
  
  							wireframe1.visible = false;
  
  							break;
  
  						case 1:
  							wireframe.visible = false;
  
  							wireframe1.visible = true;
  
  							break;
  
  					}
  
  				} );
  
  				gui.add( param, 'width (px)', 1, 10 ).onChange( function ( val ) {
  
  					matLine.linewidth = val;
  
  				} );
  
  				gui.add( param, 'dashed' ).onChange( function ( val ) {
  
  					matLine.dashed = val;
  					wireframe1.material = val ? matLineDashed : matLineBasic;
  
  				} );
  
  				gui.add( param, 'dash scale', 0.5, 1, 0.1 ).onChange( function ( val ) {
  
  					matLine.scale = val;
  					matLineDashed.scale = val;
  
  				} );
  
  				gui.add( param, 'dash / gap', { '2 : 1': 0, '1 : 1': 1, '1 : 2': 2 } ).onChange( function ( val ) {
  
  					switch ( val ) {
  
  						case 0:
  							matLine.dashSize = 2;
  							matLine.gapSize = 1;
  
  							matLineDashed.dashSize = 2;
  							matLineDashed.gapSize = 1;
  
  							break;
  
  						case 1:
  							matLine.dashSize = 1;
  							matLine.gapSize = 1;
  
  							matLineDashed.dashSize = 1;
  							matLineDashed.gapSize = 1;
  
  							break;
  
  						case 2:
  							matLine.dashSize = 1;
  							matLine.gapSize = 2;
  
  							matLineDashed.dashSize = 1;
  							matLineDashed.gapSize = 2;
  
  							break;
  
  					}
  
  				} );
  
  			}
  
  		
}
</script>
