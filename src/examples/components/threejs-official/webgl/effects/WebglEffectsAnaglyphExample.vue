<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 0.01, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - effects - anaglyph<br/>\n\t\t\tskybox by <a href=\"https://www.pauldebevec.com/\" target=\"_blank\" rel=\"noopener\">Paul Debevec</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, effect;
  
  			const spheres = [];
  
  			let mouseX = 0;
  			let mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  				
  				camera.position.z = 3;
  
  				const path = ASSET_HOST + 'textures/cube/pisa/';
  				const format = '.png';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const textureCube = new THREE.CubeTextureLoader().load( urls );
  
  				
  				scene.background = textureCube;
  
  				const geometry = new THREE.SphereGeometry( 0.1, 32, 16 );
  				const material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube } );
  
  				for ( let i = 0; i < 500; i ++ ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.x = Math.random() * 10 - 5;
  					mesh.position.y = Math.random() * 10 - 5;
  					mesh.position.z = Math.random() * 10 - 5;
  
  					mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;
  
  					scene.add( mesh );
  
  					spheres.push( mesh );
  
  				}
  
  				//
  
  				
  
  				const width = (__stage.container?.clientWidth || window.innerWidth) || 2;
  				const height = (__stage.container?.clientHeight || window.innerHeight) || 2;
  
  				effect = new AnaglyphEffect( renderer );
  				effect.setSize( width, height );
  
  				// Configure stereo parameters for physically-correct rendering
  				// eyeSep: interpupillary distance (default 0.064m / 64mm for humans)
  				// planeDistance: distance to the zero-parallax plane (objects here appear at screen depth)
  				effect.eyeSep = 0.064;
  				effect.planeDistance = 3; // Match camera distance to origin for zero parallax at scene center
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX ) / 100;
  				mouseY = ( event.clientY - windowHalfY ) / 100;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const timer = 0.0001 * Date.now();
    				camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y += ( - mouseY - camera.position.y ) * .05;
    				for ( let i = 0, il = spheres.length; i < il; i ++ ) {
    					const sphere = spheres[ i ];
    					sphere.position.x = 5 * Math.cos( timer + i );
    					sphere.position.y = 5 * Math.sin( timer + i * 1.1 );
    				}
    				effect.render( scene, camera );
    }
  })
  
  			function render() {
  
  				const timer = 0.0001 * Date.now();
  
  				camera.position.x += ( mouseX - camera.position.x ) * .05;
  				camera.position.y += ( - mouseY - camera.position.y ) * .05;
  
  
  
  				for ( let i = 0, il = spheres.length; i < il; i ++ ) {
  
  					const sphere = spheres[ i ];
  
  					sphere.position.x = 5 * Math.cos( timer + i );
  					sphere.position.y = 5 * Math.sin( timer + i * 1.1 );
  
  				}
  
  				effect.render( scene, camera );
  
  			}
  
  		
}
</script>
