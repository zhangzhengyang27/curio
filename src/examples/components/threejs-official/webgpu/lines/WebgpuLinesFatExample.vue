<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :clear-color="0x000000"
    :camera-position="[-40, 0, 60]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    custom-render
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color } from 'three/tsl';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/webgpu/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\">three.js</a> - fat lines"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let line, camera2, backgroundNode;
  			let line1;
  			let matLine, matLineBasic, matLineDashed;
  			let stats;
  
  
  			// viewport
  			let insetWidth;
  
  
  			
  
  
  				
  
  				renderer.setClearColor( 0x000000 );
  
  				camera2 = new THREE.PerspectiveCamera( 40, 1, 1, 1000 );
  				camera2.position.copy( camera.position );
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 10;
  				controls.maxDistance = 500;
  
  				backgroundNode = color( 0x222222 );
  
  				// Position and THREE.Color Data
  
  				const positions = [];
  				const colors = [];
  
  				const points = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );
  
  				const spline = new THREE.CatmullRomCurve3( points );
  				const divisions = Math.round( 12 * points.length );
  				const point = new THREE.Vector3();
  				const lineColor = new THREE.Color();
  
  				for ( let i = 0, l = divisions; i < l; i ++ ) {
  
  					const t = i / l;
  
  					spline.getPoint( t, point );
  					positions.push( point.x, point.y, point.z );
  
  					lineColor.setHSL( t, 1.0, 0.5, THREE.SRGBColorSpace );
  					colors.push( lineColor.r, lineColor.g, lineColor.b );
  
  				}
  
  
  				// Line2 ( LineGeometry, LineMaterial )
  
  				const geometry = new LineGeometry();
  				geometry.setPositions( positions );
  				geometry.setColors( colors );
  
  				matLine = new THREE.Line2NodeMaterial( {
  
  					color: 0xffffff,
  					linewidth: 5, // in world units with size attenuation, pixels otherwise
  					vertexColors: true,
  					dashed: false,
  					alphaToCoverage: false,
  
  				} );
  
  				line = new Line2( geometry, matLine );
  				line.computeLineDistances();
  				line.scale.set( 1, 1, 1 );
  				scene.add( line );
  
  
  				// THREE.Line ( THREE.BufferGeometry, THREE.LineBasicNodeMaterial ) - rendered with gl.LINE_STRIP
  
  				const geo = new THREE.BufferGeometry();
  				geo.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  				geo.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  				matLineBasic = new THREE.LineBasicNodeMaterial( { vertexColors: true } );
  				matLineDashed = new THREE.LineDashedNodeMaterial( { vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 } );
  
  				line1 = new THREE.Line( geo, matLineBasic );
  				line1.computeLineDistances();
  				line1.visible = false;
  				scene.add( line1 );
  
  				//
  
  				
  				onWindowResize();
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				initGui();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
    				// main scene
    				renderer.setClearColor( 0x000000 );
    				renderer.setViewport( 0, 0, (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.autoClear = true;
    				scene.backgroundNode = null;
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
    				renderer.render( scene, camera2 );
    				renderer.setScissorTest( false );
  })
  
  			//
  
  			function initGui() {
  
  				gui = new GUI();
  
  				const param = {
  					'line type': 0,
  					'world units': false,
  					'width': 10,
  					'alphaToCoverage': false,
  					'dashed': false,
  					'dash offset': 0,
  					'dash scale': 1,
  					'dash / gap': 1
  				};
  
  				gui.add( param, 'line type', { 'LineGeometry': 0, '"line-strip"': 1 } ).onChange( function ( val ) {
  
  					switch ( val ) {
  
  						case 0:
  							line.visible = true;
  
  							line1.visible = false;
  
  							break;
  
  						case 1:
  							line.visible = false;
  
  							line1.visible = true;
  
  							break;
  
  					}
  
  				} );
  
  				gui.add( param, 'world units' ).onChange( function ( val ) {
  
  					matLine.worldUnits = val;
  					matLine.needsUpdate = true;
  
  					if ( val ) {
  
  						widthController.name( 'width (world units)' ).min( 0.1 ).max( 0.5 ).setValue( 0.5 );
  
  					} else {
  
  						widthController.name( 'width (pixels)' ).min( 1 ).max( 10 ).setValue( 10 );
  					}
  
  				} );
  
  				const widthController = gui.add( param, 'width', 1, 10 ).name( 'width (pixels)' ).onChange( function ( val ) {
  
  					matLine.linewidth = val;
  
  				} );
  
  				gui.add( param, 'alphaToCoverage' ).onChange( function ( val ) {
  
  					matLine.alphaToCoverage = val;
  
  				} );
  
  				gui.add( param, 'dashed' ).onChange( function ( val ) {
  
  					matLine.dashed = val;
  					line1.material = val ? matLineDashed : matLineBasic;
  
  				} );
  
  				gui.add( param, 'dash scale', 0.5, 2, 0.1 ).onChange( function ( val ) {
  
  					matLine.scale = val;
  					matLineDashed.scale = val;
  
  				} );
  
  				gui.add( param, 'dash offset', 0, 5, 0.1 ).onChange( function ( val ) {
  
  					matLine.dashOffset = val;
  					matLineDashed.dashOffset = val;
  
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
