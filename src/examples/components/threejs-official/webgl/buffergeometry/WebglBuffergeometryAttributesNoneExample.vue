<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 1, far: 3500 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> WebGL 2 - buffergeometry - attributes - none"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let mesh;
  
  			
  
  
  				
  				camera.position.z = 4;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  				scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
  
  				// geometry
  
  				const triangleCount = 10000;
  				const vertexCountPerTriangle = 3;
  				const vertexCount = triangleCount * vertexCountPerTriangle;
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setDrawRange( 0, vertexCount );
  
  				// material
  
  				const material = new THREE.RawShaderMaterial( {
  					uniforms: {
  						seed: { value: 42 },
  					},
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  					side: THREE.DoubleSide,
  					glslVersion: THREE.GLSL3
  				} );
  
  				// mesh
  
  				mesh = new THREE.Mesh( geometry, material );
  				mesh.frustumCulled = false;
  				scene.add( mesh );
  
  				// renderer
  
  				
  
  
  				
  
  
  			function animate( time ) {
  
  				mesh.rotation.x = time / 1000.0 * 0.25;
  				mesh.rotation.y = time / 1000.0 * 0.50;
  
  
  
  			}
  
  		
}
</script>
