<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { mix, range, normalWorld, oscSine, time } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Instancing</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let mesh: any;
  			const amount = parseInt( window.location.search.slice( 1 ) ) || 10;
  			const count = Math.pow( amount, 3 );
  			const dummy = new THREE.Object3D();
  
  			
  
  
  				
  
  
  
  				
  
  				const material = new THREE.MeshBasicMaterial();
  
  				// random colors between instances from 0x000000 to 0xFFFFFF
  				const randomColors = range( new THREE.Color( 0x000000 ), new THREE.Color( 0xFFFFFF ) );
  
  				material.colorNode = mix( normalWorld, randomColors, oscSine( time.mul( .1 ) ) );
  
  				const loader = new THREE.BufferGeometryLoader();
  				loader.load( ASSET_HOST + 'models/json/suzanne_buffergeometry.json', function ( geometry ) {
  
  					geometry.computeVertexNormals();
  					geometry.scale( 0.5, 0.5, 0.5 );
  
  					mesh = new THREE.InstancedMesh( geometry, material, count );
  					mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
  
  					scene.add( mesh );
  
  					//
  
  					const gui = renderer.inspector.createParameters( 'Settings' );
  					gui.add( mesh, 'count', 1, count, 1 ).name( 'instance count' );
  
  				} );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    if ( mesh ) {
    					const time = Date.now() * 0.001;
    					mesh.rotation.x = Math.sin( time / 4 );
    					mesh.rotation.y = Math.sin( time / 2 );
    					let i = 0;
    					const offset = ( amount - 1 ) / 2;
    					for ( let x = 0; x < amount; x ++ ) {
    						for ( let y = 0; y < amount; y ++ ) {
    							for ( let z = 0; z < amount; z ++ ) {
    								dummy.position.set( offset - x, offset - y, offset - z );
    								dummy.rotation.y = ( Math.sin( x / 4 + time ) + Math.sin( y / 4 + time ) + Math.sin( z / 4 + time ) );
    								dummy.rotation.z = dummy.rotation.y * 2;
    								dummy.updateMatrix();
    								mesh.setMatrixAt( i ++, dummy.matrix );
    							}
    						}
    					}
    				}
    }
  })
  
  			async function render() {
  
  				if ( mesh ) {
  
  					const time = Date.now() * 0.001;
  
  					mesh.rotation.x = Math.sin( time / 4 );
  					mesh.rotation.y = Math.sin( time / 2 );
  
  					let i = 0;
  					const offset = ( amount - 1 ) / 2;
  
  					for ( let x = 0; x < amount; x ++ ) {
  
  						for ( let y = 0; y < amount; y ++ ) {
  
  							for ( let z = 0; z < amount; z ++ ) {
  
  								dummy.position.set( offset - x, offset - y, offset - z );
  								dummy.rotation.y = ( Math.sin( x / 4 + time ) + Math.sin( y / 4 + time ) + Math.sin( z / 4 + time ) );
  								dummy.rotation.z = dummy.rotation.y * 2;
  
  								dummy.updateMatrix();
  
  								mesh.setMatrixAt( i ++, dummy.matrix );
  
  							}
  
  						}
  
  					}
  
  				}
  
  				await renderer.render( scene, camera );
  
  			}
  
  		
}
</script>
