<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[15, 15, 15]"
    :camera-options="{ fov: 50, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> raycaster - sprite<br>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  		let selectedObject = null;
  		const raycaster = new THREE.Raycaster();
  		const pointer = new THREE.Vector2();
  
  		
  
  
  			// init renderer
  			
  
  
  			// init scene
  			
  			scene.background = new THREE.Color( 0xffffff );
  
  			group = new THREE.Group();
  			scene.add( group );
  
  			// init camera
  			
  
  
  
  
  			controls.minDistance = 15;
  			controls.maxDistance = 250;
  
  			// add sprites
  
  			const sprite1 = new THREE.Sprite( new THREE.SpriteMaterial( { color: '#69f' } ) );
  			sprite1.position.set( 6, 5, 5 );
  			sprite1.scale.set( 2, 5, 1 );
  			group.add( sprite1 );
  
  			const sprite2 = new THREE.Sprite( new THREE.SpriteMaterial( { color: '#69f', sizeAttenuation: false } ) );
  			sprite2.material.rotation = Math.PI / 3 * 4;
  			sprite2.position.set( 8, - 2, 2 );
  			sprite2.center.set( 0.5, 0 );
  			sprite2.scale.set( .1, .5, .1 );
  			group.add( sprite2 );
  
  			const group2 = new THREE.Object3D();
  			group2.scale.set( 1, 2, 1 );
  			group2.position.set( - 5, 0, 0 );
  			group2.rotation.set( Math.PI / 2, 0, 0 );
  			group.add( group2 );
  
  			const sprite3 = new THREE.Sprite( new THREE.SpriteMaterial( { color: '#69f' } ) );
  			sprite3.position.set( 0, 2, 5 );
  			sprite3.scale.set( 10, 2, 3 );
  			sprite3.center.set( - 0.1, 0 );
  			sprite3.material.rotation = Math.PI / 3;
  			group2.add( sprite3 );
  
  			
  			document.addEventListener( 'pointermove', onPointerMove );
  
  		
  
  
  		function animate() {
  
  
  
  		}
  
  		
  
  		function onPointerMove( event ) {
  
  			if ( selectedObject ) {
  
  				selectedObject.material.color.set( '#69f' );
  				selectedObject = null;
  
  			}
  
  			pointer.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  			pointer.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			raycaster.setFromCamera( pointer, camera );
  
  			const intersects = raycaster.intersectObject( group, true );
  
  			if ( intersects.length > 0 ) {
  
  				const res = intersects.filter( function ( res ) {
  
  					return res && res.object;
  
  				} )[ 0 ];
  
  				if ( res && res.object ) {
  
  					selectedObject = res.object;
  					selectedObject.material.color.set( '#f00' );
  
  				}
  
  			}
  
  		}
  
  	
}
</script>
