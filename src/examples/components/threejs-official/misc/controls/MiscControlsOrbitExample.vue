<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[400, 200, 0]"
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - orbit controls"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  			//render(); // remove when using animation loop
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0xcccccc );
  				scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
  
  				
  
  
  				// controls
  
  				
  				controls.listenToKeyEvents( window ); // optional
  
  				//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
  
  				controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  				controls.dampingFactor = 0.05;
  
  				controls.screenSpacePanning = false;
  
  				controls.minDistance = 100;
  				controls.maxDistance = 500;
  
  				controls.cursorStyle = 'grab';
  
  				controls.maxPolarAngle = Math.PI / 2;
  
  				// world
  
  				const geometry = new THREE.ConeGeometry( 10, 30, 4, 1 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 500 );
  				const dummy = new THREE.Object3D();
  
  				for ( let i = 0; i < 500; i ++ ) {
  
  					dummy.position.x = Math.random() * 1600 - 800;
  					dummy.position.y = 0;
  					dummy.position.z = Math.random() * 1600 - 800;
  
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
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    render();
  })
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
