<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    alpha
    :clear-color="0x000000"
    :camera-position="[-40, 0, 60]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
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

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/examples/jsm/lines/webgpu/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

let timer: any;

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Fat Lines</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			//
  
  			let line: any, thresholdLine: any, segments: any, thresholdSegments: any;
  
  			let sphereInter: any, sphereOnLine: any;
  			let gui;
  
  
  			const color = new THREE.Color();
  
  			const pointer = new THREE.Vector2( Infinity, Infinity );
  
  			const raycaster = new THREE.Raycaster();
  
  			(raycaster.params as any).Line2 = {};
  			(raycaster.params as any).Line2.threshold = 0;
  
  			const matLine = new THREE.Line2NodeMaterial( {
  
  				color: 0xffffff,
  				linewidth: 1, // in world units with size attenuation, pixels otherwise
  				worldUnits: true,
  				vertexColors: true,
  
  				alphaToCoverage: true,
  
  			} );
  
  			const matThresholdLine = new THREE.Line2NodeMaterial( {
  
  				color: 0xffffff,
  				linewidth: matLine.linewidth, // in world units with size attenuation, pixels otherwise
  				worldUnits: true,
  				// vertexColors: true,
  				transparent: true,
  				opacity: 0.2,
  				depthTest: false,
  				visible: false,
  
  			} );
  
  			const params = {
  
  				'line type': 1,
  				'world units': matLine.worldUnits,
  				'visualize threshold': matThresholdLine.visible,
  				'width': matLine.linewidth,
  				'alphaToCoverage': matLine.alphaToCoverage,
  				'threshold': (raycaster.params as any).Line2.threshold,
  				'translation': 0,
  				'animate': true
  
  			};
  
  			init();
  
  			function init() {
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  
  				renderer.setClearColor( 0x000000 );
  				renderer.inspector = new Inspector();
  
  
  				
  
  				
  
  
  				
  				controls.minDistance = 10;
  				controls.maxDistance = 500;
  
  				const sphereGeometry = new THREE.SphereGeometry( 0.25, 8, 4 );
  				const sphereInterMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, depthTest: false } );
  				const sphereOnLineMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, depthTest: false } );
  
  				sphereInter = new THREE.Mesh( sphereGeometry, sphereInterMaterial );
  				sphereOnLine = new THREE.Mesh( sphereGeometry, sphereOnLineMaterial );
  				sphereInter.visible = false;
  				sphereOnLine.visible = false;
  				sphereInter.renderOrder = 10;
  				sphereOnLine.renderOrder = 10;
  				scene.add( sphereInter );
  				scene.add( sphereOnLine );
  
  				// Position and THREE.Color Data
  
  				const positions = [];
  				const colors = [];
  				const points = [];
  				for ( let i = - 50; i < 50; i ++ ) {
  
  					const t = i / 3;
  					points.push( new THREE.Vector3( t * Math.sin( 2 * t ), t, t * Math.cos( 2 * t ) ) );
  
  				}
  
  				const spline = new THREE.CatmullRomCurve3( points );
  				const divisions = Math.round( 3 * points.length );
  				const point = new THREE.Vector3();
  				const color = new THREE.Color();
  
  				for ( let i = 0, l = divisions; i < l; i ++ ) {
  
  					const t = i / l;
  
  					spline.getPoint( t, point );
  					positions.push( point.x, point.y, point.z );
  
  					color.setHSL( t, 1.0, 0.5, THREE.SRGBColorSpace );
  					colors.push( color.r, color.g, color.b );
  
  				}
  
  				const lineGeometry = new LineGeometry();
  				lineGeometry.setPositions( positions );
  				lineGeometry.setColors( colors );
  
  				const segmentsGeometry = new LineSegmentsGeometry();
  				segmentsGeometry.setPositions( positions );
  				segmentsGeometry.setColors( colors );
  
  				segments = new LineSegments2( segmentsGeometry, matLine );
  				segments.computeLineDistances();
  				segments.scale.set( 1, 1, 1 );
  				scene.add( segments );
  
  				thresholdSegments = new LineSegments2( segmentsGeometry, matThresholdLine );
  				thresholdSegments.computeLineDistances();
  				thresholdSegments.scale.set( 1, 1, 1 );
  				scene.add( thresholdSegments );
  
  				line = new Line2( lineGeometry, matLine );
  				line.computeLineDistances();
  				line.scale.set( 1, 1, 1 );
  				scene.add( line );
  
  				thresholdLine = new Line2( lineGeometry, matThresholdLine );
  				thresholdLine.computeLineDistances();
  				thresholdLine.scale.set( 1, 1, 1 );
  				scene.add( thresholdLine );
  
  				const geo = new THREE.BufferGeometry();
  				geo.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  				geo.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  				//
  
  				switchLine( params[ 'line type' ] );
  
  				//
  
  				document.addEventListener( 'pointermove', onPointerMove );

  				onWindowResize();

				function onWindowResize() {
					const w = __stage.container?.clientWidth || window.innerWidth
					const h = __stage.container?.clientHeight || window.innerHeight
					camera.aspect = w / h
					camera.updateProjectionMatrix()
					renderer.setSize( w, h )
				}

  				initGui();
  
  			}
  
  			
  
  			function onPointerMove( event: any ) {
  
  				pointer.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				pointer.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			}
  
  			__stage.addUpdateCallback(async (_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				const obj = line.visible ? line : segments;
    				thresholdLine.position.copy( line.position );
    				thresholdLine.quaternion.copy( line.quaternion );
    				thresholdSegments.position.copy( segments.position );
    				thresholdSegments.quaternion.copy( segments.quaternion );
    				if ( params.animate ) {
    					line.rotation.y += delta * 0.1;
    					segments.rotation.y = line.rotation.y;
    				}
    				raycaster.setFromCamera( pointer, camera );
    				const intersects = raycaster.intersectObject( obj );
    				if ( intersects.length > 0 ) {
    					sphereInter.visible = true;
    					sphereOnLine.visible = true;
    					sphereInter.position.copy( intersects[ 0 ].point );
    					sphereOnLine.position.copy( intersects[ 0 ].pointOnLine );
    					const index = intersects[ 0 ].faceIndex;
    					const colors = obj.geometry.getAttribute( 'instanceColorStart' );
    					color.fromBufferAttribute( colors, index as any );
    					sphereInter.material.color.copy( color ).offsetHSL( 0.3, 0, 0 );
    					sphereOnLine.material.color.copy( color ).offsetHSL( 0.7, 0, 0 );
    					renderer.domElement.style.cursor = 'crosshair';
    				} else {
    					sphereInter.visible = false;
    					sphereOnLine.visible = false;
    					renderer.domElement.style.cursor = '';
    				}
  })
  
  			//
  
  			function switchLine( val: any ) {
  
  				switch ( val ) {
  
  					case 0:
  						line.visible = true;
  						thresholdLine.visible = true;
  
  						segments.visible = false;
  						thresholdSegments.visible = false;
  
  						break;
  
  					case 1:
  						line.visible = false;
  						thresholdLine.visible = false;
  
  						segments.visible = true;
  						thresholdSegments.visible = true;
  
  						break;
  
  				}
  
  			}
  
  			function initGui() {
  
  				gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( params, 'line type', { 'LineGeometry': 0, 'LineSegmentsGeometry': 1 } ).onChange( function ( val: any ) {
  
  					switchLine( val );
  
  				} );
  
  				gui.add( params, 'world units' ).onChange( function ( val: any ) {
  
  					matLine.worldUnits = val;
  					matLine.needsUpdate = true;
  
  					matThresholdLine.worldUnits = val;
  					matThresholdLine.needsUpdate = true;
  
  				} );
  
  				gui.add( params, 'visualize threshold' ).onChange( function ( val: any ) {
  
  					matThresholdLine.visible = val;
  
  				} );
  
  				gui.add( params, 'width', 1, 10 ).onChange( function ( val: any ) {
  
  					matLine.linewidth = val;
  					matThresholdLine.linewidth = matLine.linewidth + (raycaster.params as any).Line2.threshold;
  
  				} );
  
  				gui.add( params, 'alphaToCoverage' ).onChange( function ( val: any ) {
  
  					matLine.alphaToCoverage = val;
  
  				} );
  
  				gui.add( params, 'threshold', 0, 10 ).onChange( function ( val: any ) {
  
  					(raycaster.params as any).Line2.threshold = val;
  					matThresholdLine.linewidth = matLine.linewidth + (raycaster.params as any).Line2.threshold;
  
  				} );
  
  				gui.add( params, 'translation', 0, 10 ).onChange( function ( val: any ) {
  
  					line.position.x = val;
  					segments.position.x = val;
  
  				} );
  
  				gui.add( params, 'animate' );
  
  			}
  
  		
}
</script>
