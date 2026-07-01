<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady"
  />
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			let stats;
  
  
  			const amount = parseInt( window.location.search.slice( 1 ) ) || 10;
  			const count = Math.pow( amount, 3 );
  
  			const raycaster = new THREE.Raycaster();
  			const mouse = new THREE.Vector2( 1, 1 );
  
  			const color = new THREE.Color();
  			const white = new THREE.Color().setHex( 0xffffff );
  
  			
  
  
  				
  
  
  
  				
  
  				const light = new THREE.HemisphereLight( 0xffffff, 0x888888, 3 );
  				light.position.set( 0, 1, 0 );
  				scene.add( light );
  
  				const geometry = new THREE.IcosahedronGeometry( 0.5, 3 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
  
  				mesh = new THREE.InstancedMesh( geometry, material, count );
  
  				let i = 0;
  				const offset = ( amount - 1 ) / 2;
  
  				const matrix = new THREE.Matrix4();
  
  				for ( let x = 0; x < amount; x ++ ) {
  
  					for ( let y = 0; y < amount; y ++ ) {
  
  						for ( let z = 0; z < amount; z ++ ) {
  
  							matrix.setPosition( offset - x, offset - y, offset - z );
  
  							mesh.setMatrixAt( i, matrix );
  							mesh.setColorAt( i, color );
  
  							i ++;
  
  						}
  
  					}
  
  				}
  
  				scene.add( mesh );
  
  				//
  
  				const gui = new GUI();
  				gui.add( mesh, 'count', 0, count );
  
  				
  
  
  				controls.enableDamping = true;
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				document.addEventListener( 'mousemove', onMouseMove );
  
  			
  
  
  			
  
  			function onMouseMove( event ) {
  
  				event.preventDefault();
  
  				mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    raycaster.setFromCamera( mouse, camera );
    				const intersection = raycaster.intersectObject( mesh );
    				if ( intersection.length > 0 ) {
    					const instanceId = intersection[ 0 ].instanceId;
    					mesh.getColorAt( instanceId, color );
    					if ( color.equals( white ) ) {
    						mesh.setColorAt( instanceId, color.setHex( Math.random() * 0xffffff ) );
    						mesh.instanceColor.needsUpdate = true;
    					}
    				}
    				stats.update();
  })
  
  		
}
</script>
