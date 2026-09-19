<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[3, 0.25, 3]"
    :camera-look-at="[0, 0.1, 0]"
    :camera-options="{ fov: 35, near: 0.1, far: 15 }"
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
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t<a href=\"https://github.com/google/draco\" target=\"_blank\" rel=\"noopener\">DRACO</a> loader"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  		const container = document.querySelector( '#container' );
  
  		// Configure and create Draco decoder.
  		const dracoLoader = new DRACOLoader();
  
  		
  
  
  			
  
  
  			
  			scene.background = new THREE.Color( 0x443333 );
  			scene.fog = new THREE.Fog( 0x443333, 1, 4 );
  
  			// Ground
  			const plane = new THREE.Mesh(
  				new THREE.PlaneGeometry( 8, 8 ),
  				new THREE.MeshLambertMaterial( { color: 0xcbcbcb } )
  			);
  			plane.rotation.x = - Math.PI / 2;
  			plane.position.y = 0.03;
  			plane.receiveShadow = true;
  			scene.add( plane );
  
  			// Lights
  			const hemiLight = new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 );
  			scene.add( hemiLight );
  
  			const spotLight = new THREE.SpotLight();
  			spotLight.intensity = 7;
  			spotLight.angle = Math.PI / 16;
  			spotLight.penumbra = 0.5;
  			spotLight.castShadow = true;
  			spotLight.shadow.radius = 8;
  			spotLight.position.set( - 1, 1, 1 );
  			scene.add( spotLight );
  
  			dracoLoader.load( ASSET_HOST + 'models/draco/bunny.drc', function ( geometry ) {
  
  				geometry.computeVertexNormals();
  
  				const material = new THREE.MeshStandardMaterial( { color: 0xa5a5a5 } );
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.castShadow = true;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				// Release decoder resources.
  				dracoLoader.dispose();
  
  			} );
  
  			// renderer
  			
  
  
  			renderer.shadowMap.enabled = true;
  
  
  			
  
  		
  
  
  		
  
  		__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    const timer = Date.now() * 0.0003;
    			camera.position.x = Math.sin( timer ) * 0.5;
    			camera.position.z = Math.cos( timer ) * 0.5;
  })
  	
}
</script>
