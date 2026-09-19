<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.1, far: 500 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - box selection"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  
  			
  
  
  				
  				camera.position.z = 50;
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				scene.add( new THREE.AmbientLight( 0xaaaaaa ) );
  
  				const light = new THREE.SpotLight( 0xffffff, 10000 );
  				light.position.set( 0, 25, 50 );
  				light.angle = Math.PI / 5;
  
  				light.castShadow = true;
  				light.shadow.camera.near = 10;
  				light.shadow.camera.far = 100;
  				light.shadow.mapSize.width = 1024;
  				light.shadow.mapSize.height = 1024;
  
  				scene.add( light );
  
  				const geometry = new THREE.BoxGeometry();
  
  				for ( let i = 0; i < 200; i ++ ) {
  
  					const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
  
  					object.position.x = Math.random() * 80 - 40;
  					object.position.y = Math.random() * 45 - 25;
  					object.position.z = Math.random() * 45 - 25;
  
  					object.rotation.x = Math.random() * 2 * Math.PI;
  					object.rotation.y = Math.random() * 2 * Math.PI;
  					object.rotation.z = Math.random() * 2 * Math.PI;
  
  					object.scale.x = Math.random() * 2 + 1;
  					object.scale.y = Math.random() * 2 + 1;
  					object.scale.z = Math.random() * 2 + 1;
  
  					object.castShadow = true;
  					object.receiveShadow = true;
  
  					scene.add( object );
  
  				}
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFShadowMap;
  
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    stats.update();
  })
  
  			const selectionBox = new SelectionBox( camera, scene );
  			const helper = new SelectionHelper( renderer, 'selectBox' );
  
  			document.addEventListener( 'pointerdown', function ( event ) {
  
  				for ( const item of selectionBox.collection ) {
  
  					(item as any).material.emissive.set( 0x000000 );
  
  				}
  
  				selectionBox.startPoint.set(
  					( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1,
  					- ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1,
  					0.5 );
  
  			} );
  
  			document.addEventListener( 'pointermove', function ( event ) {
  
  				if ( helper.isDown ) {
  
  					for ( let i = 0; i < selectionBox.collection.length; i ++ ) {
  
  						(selectionBox.collection[ i ] as any).material.emissive.set( 0x000000 );
  
  					}
  
  					selectionBox.endPoint.set(
  						( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1,
  						- ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1,
  						0.5 );
  
  					const allSelected = selectionBox.select();
  
  					for ( let i = 0; i < allSelected.length; i ++ ) {
  
  						(allSelected[ i ] as any).material.emissive.set( 0xffffff );
  
  					}
  
  				}
  
  			} );
  
  			document.addEventListener( 'pointerup', function ( event ) {
  
  				selectionBox.endPoint.set(
  					( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1,
  					- ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1,
  					0.5 );
  
  				const allSelected = selectionBox.select();
  
  				for ( let i = 0; i < allSelected.length; i ++ ) {
  
  					(allSelected[ i ] as any).material.emissive.set( 0xffffff );
  
  				}
  
  			} );
  
  		
}
</script>
