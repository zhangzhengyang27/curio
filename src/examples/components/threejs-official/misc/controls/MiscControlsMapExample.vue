<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 200, -200]"
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
    :enable-controls="false"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - map controls"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  			
  			//render(); // remove when using animation loop
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0xcccccc );
  				scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
  
  				
  
  
  				// controls
  
  				
  
  				//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
  
  				controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  				controls.dampingFactor = 0.05;
  
  				controls.screenSpacePanning = false;
  
  				controls.minDistance = 100;
  				controls.maxDistance = 500;
  
  				controls.maxPolarAngle = Math.PI / 2;
  
  				// world
  
  				const geometry = new THREE.BoxGeometry();
  				geometry.translate( 0, 0.5, 0 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xeeeeee, flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 500 );
  				const dummy = new THREE.Object3D();
  
  				for ( let i = 0; i < 500; i ++ ) {
  
  					dummy.position.x = Math.random() * 1600 - 800;
  					dummy.position.y = 0;
  					dummy.position.z = Math.random() * 1600 - 800;
  					dummy.scale.x = 20;
  					dummy.scale.y = Math.random() * 80 + 10;
  					dummy.scale.z = 20;
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  				}
  
  				scene.add( mesh );
  
  				// lights
  
  				const dirLight1 = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight1.position.set( 1, 1, 1 );
  				scene.add( dirLight1 );
  
  				const dirLight2 = new THREE.DirectionalLight( 0x002288, 3 );
  				dirLight2.position.set( - 1, - 1, - 1 );
  				scene.add( dirLight2 );
  
  				const ambientLight = new THREE.AmbientLight( 0x555555 );
  				scene.add( ambientLight );
  
  				//
  
  				
  
  
  				const gui = new GUI();
  				gui.add( controls, 'zoomToCursor' );
  				gui.add( controls, 'screenSpacePanning' );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    render();
  })
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
