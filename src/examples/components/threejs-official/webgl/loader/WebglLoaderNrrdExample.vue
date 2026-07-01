<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 0.01, far: 10000000000 }"
    :enable-controls="false"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\tNRRD format loader test"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let stats;
  
  			
  
  
  				
  				camera.position.z = 300;
  
  				
  
  				scene.add( camera );
  
  				// light
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 3 );
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
  				dirLight.position.set( 200, 200, 200 );
  				scene.add( dirLight );
  
  				const loader = new NRRDLoader();
  				loader.load( ASSET_HOST + 'models/nrrd/I.nrrd', function ( volume ) {
  
  					//box helper to see the extend of the volume
  					const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength );
  					const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  					const cube = new THREE.Mesh( geometry, material );
  					cube.visible = false;
  					const box = new THREE.BoxHelper( cube );
  					scene.add( box );
  					box.applyMatrix4( volume.matrix );
  					scene.add( cube );
  
  					//z plane
  					const sliceZ = volume.extractSlice( 'z', Math.floor( volume.RASDimensions[ 2 ] / 4 ) );
  					scene.add( sliceZ.mesh );
  
  					//y plane
  					const sliceY = volume.extractSlice( 'y', Math.floor( volume.RASDimensions[ 1 ] / 2 ) );
  					scene.add( sliceY.mesh );
  
  					//x plane
  					const sliceX = volume.extractSlice( 'x', Math.floor( volume.RASDimensions[ 0 ] / 2 ) );
  					scene.add( sliceX.mesh );
  
  					gui.add( sliceX, 'index', 0, volume.RASDimensions[ 0 ], 1 ).name( 'indexX' ).onChange( function () {
  
  						sliceX.repaint.call( sliceX );
  
  					} );
  					gui.add( sliceY, 'index', 0, volume.RASDimensions[ 1 ], 1 ).name( 'indexY' ).onChange( function () {
  
  						sliceY.repaint.call( sliceY );
  
  					} );
  					gui.add( sliceZ, 'index', 0, volume.RASDimensions[ 2 ], 1 ).name( 'indexZ' ).onChange( function () {
  
  						sliceZ.repaint.call( sliceZ );
  
  					} );
  
  					gui.add( volume, 'lowerThreshold', volume.min, volume.max, 1 ).name( 'Lower Threshold' ).onChange( function () {
  
  						volume.repaintAllSlices();
  
  					} );
  					gui.add( volume, 'upperThreshold', volume.min, volume.max, 1 ).name( 'Upper Threshold' ).onChange( function () {
  
  						volume.repaintAllSlices();
  
  					} );
  					gui.add( volume, 'windowLow', volume.min, volume.max, 1 ).name( 'Window Low' ).onChange( function () {
  
  						volume.repaintAllSlices();
  
  					} );
  					gui.add( volume, 'windowHigh', volume.min, volume.max, 1 ).name( 'Window High' ).onChange( function () {
  
  						volume.repaintAllSlices();
  
  					} );
  
  				} );
  
  				// renderer
  
  				
  
  
  				controls.minDistance = 100;
  				controls.maxDistance = 500;
  				controls.rotateSpeed = 5.0;
  				controls.zoomSpeed = 5;
  				controls.panSpeed = 2;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				const gui = new GUI();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
  })
  
  		
}
</script>
