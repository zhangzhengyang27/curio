<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 0.01, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Basic Material</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			const spheres = [];
  
  			let mouseX = 0;
  			let mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			const params = {
  				color: '#ffffff',
  				mapping: THREE.CubeReflectionMapping,
  				refractionRatio: 0.98,
  				transparent: false,
  				opacity: 1
  			};
  
  			const mappings = { ReflectionMapping: THREE.CubeReflectionMapping, RefractionMapping: THREE.CubeRefractionMapping };
  
  			document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  				
  				camera.position.z = 3;
  
  				const path = './textures/cube/pisa/';
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
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui.addColor( params, 'color' ).onChange( ( value ) => material.color.set( value ) );
  				gui.add( params, 'mapping', mappings ).onChange( ( value ) => {
  
  					textureCube.mapping = value;
  					material.needsUpdate = true;
  			
  				} );
  				gui.add( params, 'refractionRatio', 0, 1, 0.01 ).onChange( ( value ) => material.refractionRatio = value );
  				gui.add( params, 'transparent' ).onChange( ( value ) => {
  			
  					material.transparent = value;
  					material.needsUpdate = true;
  
  				} );
  				gui.add( params, 'opacity', 0, 1, 0.01 ).onChange( ( value ) => material.opacity = value );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX ) / 100;
  				mouseY = ( event.clientY - windowHalfY ) / 100;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const timer = 0.0001 * Date.now();
    				camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y += ( - mouseY - camera.position.y ) * .05;
    				for ( let i = 0, il = spheres.length; i < il; i ++ ) {
    					const sphere = spheres[ i ];
    					sphere.position.x = 5 * Math.cos( timer + i );
    					sphere.position.y = 5 * Math.sin( timer + i * 1.1 );
    				}
  })
  
  		
}
</script>
