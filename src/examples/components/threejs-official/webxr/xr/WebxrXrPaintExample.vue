<template>
  <WebXRExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1.6, 3]"
    :camera-options="{ fov: 50, near: 0.01, far: 50 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebXRExampleScene>
</template>

<script setup lang="ts">
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TubePainter } from 'three/examples/jsm/misc/TubePainter.js';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> xr - paint"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let controller1, controller2;
  
  			const cursor = new THREE.Vector3();
  			const color = new THREE.Color();
  
  
  			
  
  
  				
  
  				
  				scene.background = new THREE.Color( 0x222222 );
  
  				
  
  
  				
  				controls.target.set( 0, 1.6, 0 );
  				controls.update();
  
  				const grid = new THREE.GridHelper( 4, 1, 0x111111, 0x111111 );
  				scene.add( grid );
  
  				scene.add( new THREE.HemisphereLight( 0x888877, 0x777788, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 1.5 );
  				light.position.set( 0, 4, 0 );
  				scene.add( light );
  
  				//
  
  				const painter1 = new TubePainter();
  				scene.add( painter1.mesh );
  
  				const painter2 = new TubePainter();
  				scene.add( painter2.mesh );
  
  				//
  
  				
  
  
  				document.body.appendChild( XRButton.createButton( renderer ) );
  
  				// controllers
  
  				function onSelectStart( this: any ) {
  
  					this.updateMatrixWorld( true );
  
  					const pivot = this.getObjectByName( 'pivot' );
  					cursor.setFromMatrixPosition( pivot.matrixWorld );
  
  					const painter = this.userData.painter;
  					painter.moveTo( cursor );
  
  					this.userData.isSelecting = true;
  
  				}
  
  				function onSelectEnd( this: any ) {
  
  					this.userData.isSelecting = false;
  
  				}
  
  				function onSqueezeStart( this: any ) {
  
  					this.userData.isSqueezing = true;
  					this.userData.positionAtSqueezeStart = this.position.y;
  			
  					const pivot = this.getObjectByName( 'pivot' );
  					this.userData.scaleAtSqueezeStart = pivot.scale.x;
  
  				}
  
  				function onSqueezeEnd( this: any ) {
  
  					this.userData.isSqueezing = false;
  
  				}
  
  				controller1 = renderer.xr.getController( 0 );
  				controller1.addEventListener( 'selectstart', onSelectStart );
  				controller1.addEventListener( 'selectend', onSelectEnd );
  				controller1.addEventListener( 'squeezestart', onSqueezeStart );
  				controller1.addEventListener( 'squeezeend', onSqueezeEnd );
  				controller1.userData.painter = painter1;
  				scene.add( controller1 );
  
  				controller2 = renderer.xr.getController( 1 );
  				controller2.addEventListener( 'selectstart', onSelectStart );
  				controller2.addEventListener( 'selectend', onSelectEnd );
  				controller2.addEventListener( 'squeezestart', onSqueezeStart );
  				controller2.addEventListener( 'squeezeend', onSqueezeEnd );
  				controller2.userData.painter = painter2;
  				scene.add( controller2 );
  
  				//
  
  				const pivot = new THREE.Mesh( new THREE.IcosahedronGeometry( 0.01, 3 ) );
  				pivot.name = 'pivot';
  				pivot.position.z = - 0.05;
  
  				const group = new THREE.Group();
  				group.add( pivot );
  
  				controller1.add( group.clone() );
  				controller2.add( group.clone() );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			function handleController( controller: any ) {
  
  				controller.updateMatrixWorld( true );
  
  				const userData = controller.userData;
  				const painter = userData.painter;
  
  				const pivot = controller.getObjectByName( 'pivot' );
  
  				if ( userData.isSqueezing === true ) {
  
  					const delta = ( controller.position.y - userData.positionAtSqueezeStart ) * 5;
  					const scale = Math.max( 0.1, userData.scaleAtSqueezeStart + delta );
  
  					pivot.scale.setScalar( scale );
  					painter.setSize( scale );
  
  				}
  
  				cursor.setFromMatrixPosition( pivot.matrixWorld );
  
  				if ( userData.isSelecting === true ) {
  
  					const hue = ( performance.now() * 0.001 ) % 1;
  					color.setHSL( hue, 1.0, 0.5 );
  					painter.setColor( color );
  
  					painter.lineTo( cursor );
  					painter.update();
  
  				}
  
  			}
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    handleController( controller1 );
    				handleController( controller2 );
  })
  
  		
}
</script>
