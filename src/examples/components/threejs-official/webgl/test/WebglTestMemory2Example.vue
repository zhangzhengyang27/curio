<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 40, near: 1, far: 10000 }"
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

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - memory test II"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			const N = 100;
  
  			let container;
  
  
  
  
  			const meshes = [];
  
  			let fragmentShader, vertexShader;
  
  			
  			setInterval( render, 1000 / 60 );
  
  			
  
  
  				vertexShader = document.getElementById( 'vertexShader' ).textContent;
  				fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
  
  				
  				camera.position.z = 2000;
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  
  				geometry = new THREE.SphereGeometry( 15, 64, 32 );
  
  				for ( let i = 0; i < N; i ++ ) {
  
  					const material = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: generateFragmentShader() } );
  
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.x = ( 0.5 - Math.random() ) * 1000;
  					mesh.position.y = ( 0.5 - Math.random() ) * 1000;
  					mesh.position.z = ( 0.5 - Math.random() ) * 1000;
  
  					scene.add( mesh );
  
  					meshes.push( mesh );
  
  				}
  
  				
  
  
  
  
  			
  
  
  			//
  
  			function generateFragmentShader() {
  
  				return fragmentShader.replace( 'XXX', Math.random() + ',' + Math.random() + ',' + Math.random() );
  
  			}
  
  			function render() {
  
  				for ( let i = 0; i < N; i ++ ) {
  
  					const mesh = meshes[ i ];
  					mesh.material = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: generateFragmentShader() } );
  
  				}
  
  
  
  				console.log( 'before', renderer.info.programs.length );
  
  				for ( let i = 0; i < N; i ++ ) {
  
  					const mesh = meshes[ i ];
  					mesh.material.dispose();
  
  				}
  
  				console.log( 'after', renderer.info.programs.length );
  
  			}
  
  		
}
</script>
