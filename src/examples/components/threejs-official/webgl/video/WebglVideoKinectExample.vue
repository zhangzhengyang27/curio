<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 500]"
    :camera-options="{ fov: 50, near: 1, far: 10000 }"
    @ready="onReady"
  />
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

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

  
  			let geometry, mesh, material;
  			let mouse, center;
  
  			
  
  
  				
  
  				const info = document.createElement( 'div' );
  				info.id = 'info';
  				info.innerHTML = '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> - kinect';
  				document.body.appendChild( info );
  
  				
  
  
  				
  				center = new THREE.Vector3();
  				center.z = - 1000;
  
  				const video = document.getElementById( 'video' );
  
  				const texture = new THREE.VideoTexture( video );
  				texture.minFilter = THREE.NearestFilter;
  				texture.generateMipmaps = false;
  
  				const width = 640, height = 480;
  				const nearClipping = 850, farClipping = 4000;
  
  				geometry = new THREE.BufferGeometry();
  
  				const vertices = new Float32Array( width * height * 3 );
  
  				for ( let i = 0, j = 0, l = vertices.length; i < l; i += 3, j ++ ) {
  
  					vertices[ i ] = j % width;
  					vertices[ i + 1 ] = Math.floor( j / width );
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  
  				material = new THREE.ShaderMaterial( {
  
  					uniforms: {
  
  						'map': { value: texture },
  						'width': { value: width },
  						'height': { value: height },
  						'nearClipping': { value: nearClipping },
  						'farClipping': { value: farClipping },
  
  						'pointSize': { value: 2 },
  						'zOffset': { value: 1000 }
  
  					},
  					vertexShader: document.getElementById( 'vs' ).textContent,
  					fragmentShader: document.getElementById( 'fs' ).textContent,
  					blending: THREE.AdditiveBlending,
  					depthTest: false, depthWrite: false,
  					transparent: true
  
  				} );
  
  				mesh = new THREE.Points( geometry, material );
  				scene.add( mesh );
  
  				const gui = new GUI();
  				gui.add( material.uniforms.nearClipping, 'value', 1, 10000, 1.0 ).name( 'nearClipping' );
  				gui.add( material.uniforms.farClipping, 'value', 1, 10000, 1.0 ).name( 'farClipping' );
  				gui.add( material.uniforms.pointSize, 'value', 1, 10, 1.0 ).name( 'pointSize' );
  				gui.add( material.uniforms.zOffset, 'value', 0, 4000, 1.0 ).name( 'zOffset' );
  
  				video.play();
  
  				//
  
  				
  
  
  				mouse = new THREE.Vector3( 0, 0, 1 );
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onDocumentMouseMove( event ) {
  
  				mouse.x = ( event.clientX - (__stage.container?.clientWidth || window.innerWidth) / 2 ) * 8;
  				mouse.y = ( event.clientY - (__stage.container?.clientHeight || window.innerHeight) / 2 ) * 8;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    camera.position.x += ( mouse.x - camera.position.x ) * 0.05;
    				camera.position.y += ( - mouse.y - camera.position.y ) * 0.05;
  })
  
  		
}
</script>
