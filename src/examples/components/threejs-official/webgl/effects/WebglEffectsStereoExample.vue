<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - effects - stereo. skybox by <a href=\"http://www.zfight.com/\" target=\"_blank\" rel=\"noopener\">Jochum Skoglund</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, effect;
  
  			const spheres = [];
  
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  				
  				camera.position.z = 3;
  
  				
  				scene.background = new THREE.CubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/Park3Med/' )
  					.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
  
  				const geometry = new THREE.SphereGeometry( 0.1, 32, 16 );
  
  				const textureCube = new THREE.CubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/Park3Med/' )
  					.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
  				textureCube.mapping = THREE.CubeRefractionMapping;
  
  				const material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube, refractionRatio: 0.95 } );
  
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
  
  				
  
  				effect = new StereoEffect( renderer );
  				effect.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX ) * 0.01;
  				mouseY = ( event.clientY - windowHalfY ) * 0.01;
  
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
    				effect.render( scene, camera );
  })
  
  		
}
</script>
