<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 45, near: 1, far: 15000 }"
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
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - level of detail"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			let container;
  
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			
  
  
  				
  				camera.position.z = 1000;
  
  				
  				scene.fog = new THREE.Fog( 0x000000, 1, 15000 );
  
  				const pointLight = new THREE.PointLight( 0xff2200, 3, 0, 0 );
  				pointLight.position.set( 0, 0, 0 );
  				scene.add( pointLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( 0, 0, 1 ).normalize();
  				scene.add( dirLight );
  
  				const geometry = [
  
  					[ new THREE.IcosahedronGeometry( 100, 16 ), 50 ],
  					[ new THREE.IcosahedronGeometry( 100, 8 ), 300 ],
  					[ new THREE.IcosahedronGeometry( 100, 4 ), 1000 ],
  					[ new THREE.IcosahedronGeometry( 100, 2 ), 2000 ],
  					[ new THREE.IcosahedronGeometry( 100, 1 ), 8000 ]
  
  				];
  
  				const material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: true } );
  
  				for ( let j = 0; j < 1000; j ++ ) {
  
  					const lod = new THREE.LOD();
  
  					for ( let i = 0; i < geometry.length; i ++ ) {
  
  						const mesh = new THREE.Mesh( geometry[ i ][ 0 ], material );
  						mesh.scale.set( 1.5, 1.5, 1.5 );
  						mesh.updateMatrix();
  						mesh.matrixAutoUpdate = false;
  						lod.addLevel( mesh, geometry[ i ][ 1 ] );
  
  					}
  
  					lod.position.x = 10000 * ( 0.5 - Math.random() );
  					lod.position.y = 7500 * ( 0.5 - Math.random() );
  					lod.position.z = 10000 * ( 0.5 - Math.random() );
  					lod.updateMatrix();
  					lod.matrixAutoUpdate = false;
  					scene.add( lod );
  
  				}
  
  
  				
  
  
  				//
  
  				
  				controls.movementSpeed = 1000;
  				controls.rollSpeed = Math.PI / 10;
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				controls.update( timer.getDelta() );
  })
  
  		
}
</script>
