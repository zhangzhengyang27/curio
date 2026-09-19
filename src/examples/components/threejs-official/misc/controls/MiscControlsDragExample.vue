<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.1, far: 500 }"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - drag controls<br />\n\t\t\tUse \"Shift+Click\" to add/remove objects to/from a group.<br />\n\t\t\tUse \"M\" to toggle between rotate and pan mode (touch only).<br />\n\t\t\tGrouped objects can be transformed as a union."
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			let container;
  
  			let group: any;
  			let enableSelection = false;
  
  			const objects: any = [];
  
  			const mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  
  			
  
  
  				
  				camera.position.z = 25;
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				scene.add( new THREE.AmbientLight( 0xaaaaaa ) );
  
  				const light = new THREE.SpotLight( 0xffffff, 10000 );
  				light.position.set( 0, 25, 50 );
  				light.angle = Math.PI / 9;
  
  				light.castShadow = true;
  				light.shadow.camera.near = 10;
  				light.shadow.camera.far = 100;
  				light.shadow.mapSize.width = 1024;
  				light.shadow.mapSize.height = 1024;
  
  				scene.add( light );
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				const geometry = new THREE.BoxGeometry();
  
  				for ( let i = 0; i < 200; i ++ ) {
  
  					const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
  
  					object.position.x = Math.random() * 30 - 15;
  					object.position.y = Math.random() * 15 - 7.5;
  					object.position.z = Math.random() * 20 - 10;
  
  					object.rotation.x = Math.random() * 2 * Math.PI;
  					object.rotation.y = Math.random() * 2 * Math.PI;
  					object.rotation.z = Math.random() * 2 * Math.PI;
  
  					object.scale.x = Math.random() * 2 + 1;
  					object.scale.y = Math.random() * 2 + 1;
  					object.scale.z = Math.random() * 2 + 1;
  
  					object.castShadow = true;
  					object.receiveShadow = true;
  
  					scene.add( object );
  
  					objects.push( object );
  
  				}
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFShadowMap;
  
  
  
  				const controls = new DragControls( [ ... objects ], camera, renderer.domElement );
  				controls.rotateSpeed = 2;
  				controls.addEventListener( 'drag', render );
  
  				//
  
  				
  
  				document.addEventListener( 'click', onClick );
  				window.addEventListener( 'keydown', onKeyDown );
  				window.addEventListener( 'keyup', onKeyUp );
  
  				render();
  
  			
  
  
  			
  
  			function onKeyDown( event: any ) {
  
  				enableSelection = ( event.keyCode === 16 ) ? true : false;
  			
  				if ( event.keyCode === 77 ) {
  
  					controls.touches.ONE = ( controls.touches.ONE === THREE.TOUCH.PAN ) ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN;
  			
  				}
  
  			}
  
  			function onKeyUp() {
  
  				enableSelection = false;
  
  			}
  
  			function onClick( event: any ) {
  
  				event.preventDefault();
  
  				if ( enableSelection === true ) {
  
  					const draggableObjects = controls.objects;
  					draggableObjects.length = 0;
  
  					mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  					mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  					raycaster.setFromCamera( mouse, camera );
  
  					const intersections = raycaster.intersectObjects( objects, true );
  
  					if ( intersections.length > 0 ) {
  
  						const object = intersections[ 0 ].object;
  
  						if ( group.children.includes( object ) === true ) {
  
  							(object!.material as any).emissive.set( 0x000000 );
  							scene.attach( object );
  
  						} else {
  
  							(object!.material as any).emissive.set( 0xaaaaaa );
  							group.attach( object );
  
  						}
  
  						controls.transformGroup = true;
  						draggableObjects.push( group );
  
  					}
  
  					if ( group.children.length === 0 ) {
  
  						controls.transformGroup = false;
  						draggableObjects.push( ...objects );
  
  					}
  
  				}
  
  				render();
  
  			}
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
