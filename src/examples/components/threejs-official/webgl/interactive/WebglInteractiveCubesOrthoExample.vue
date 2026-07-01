<template>
  <ExampleScene
    camera="perspective"
    antialias
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - interactive cubes"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats;
  
  
  			let theta = 0;
  			let INTERSECTED;
  
  			const pointer = new THREE.Vector2();
  			const radius = 25;
  			const frustumSize = 50;
  
  			
  
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 1, 1, 1 ).normalize();
  				scene.add( light );
  
  				const geometry = new THREE.BoxGeometry();
  
  				for ( let i = 0; i < 2000; i ++ ) {
  
  					const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
  
  					object.position.x = Math.random() * 40 - 20;
  					object.position.y = Math.random() * 40 - 20;
  					object.position.z = Math.random() * 40 - 20;
  
  					object.rotation.x = Math.random() * 2 * Math.PI;
  					object.rotation.y = Math.random() * 2 * Math.PI;
  					object.rotation.z = Math.random() * 2 * Math.PI;
  
  					object.scale.x = Math.random() + 0.5;
  					object.scale.y = Math.random() + 0.5;
  					object.scale.z = Math.random() + 0.5;
  
  					scene.add( object );
  
  				}
  
  				raycaster = new THREE.Raycaster();
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				document.addEventListener( 'pointermove', onPointerMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onPointerMove( event ) {
  
  				pointer.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				pointer.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    theta += 0.1;
    				camera.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
    				camera.position.y = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
    				camera.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta ) );
    				camera.updateMatrixWorld();
    				// find intersections
    				raycaster.setFromCamera( pointer, camera );
    				const intersects = raycaster.intersectObjects( scene.children, false );
    				if ( intersects.length > 0 ) {
    					if ( INTERSECTED != intersects[ 0 ].object ) {
    						if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    						INTERSECTED = intersects[ 0 ].object;
    						INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
    						INTERSECTED.material.emissive.setHex( 0xff0000 );
    					}
    				} else {
    					if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    					INTERSECTED = null;
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				theta += 0.1;
  
  				camera.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
  				camera.position.y = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
  				camera.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta ) );
  
  
  				camera.updateMatrixWorld();
  
  				// find intersections
  
  				raycaster.setFromCamera( pointer, camera );
  
  				const intersects = raycaster.intersectObjects( scene.children, false );
  
  				if ( intersects.length > 0 ) {
  
  					if ( INTERSECTED != intersects[ 0 ].object ) {
  
  						if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
  
  						INTERSECTED = intersects[ 0 ].object;
  						INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
  						INTERSECTED.material.emissive.setHex( 0xff0000 );
  
  					}
  
  				} else {
  
  					if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
  
  					INTERSECTED = null;
  
  				}
  
  
  
  			}
  
  		
}
</script>
