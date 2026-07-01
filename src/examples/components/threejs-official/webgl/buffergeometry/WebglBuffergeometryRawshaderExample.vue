<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 1, far: 10 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - raw shader demo"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, stats;
  
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				
  				camera.position.z = 2;
  
  				
  				scene.background = new THREE.Color( 0x101010 );
  
  				// geometry
  				// nr of triangles with 3 vertices per triangle
  				const vertexCount = 200 * 3;
  
  				const geometry = new THREE.BufferGeometry();
  
  				const positions = [];
  				const colors = [];
  
  				for ( let i = 0; i < vertexCount; i ++ ) {
  
  					// adding x,y,z
  					positions.push( Math.random() - 0.5 );
  					positions.push( Math.random() - 0.5 );
  					positions.push( Math.random() - 0.5 );
  
  					// adding r,g,b,a
  					colors.push( Math.random() * 255 );
  					colors.push( Math.random() * 255 );
  					colors.push( Math.random() * 255 );
  					colors.push( Math.random() * 255 );
  
  				}
  
  				const positionAttribute = new THREE.Float32BufferAttribute( positions, 3 );
  				const colorAttribute = new THREE.Uint8BufferAttribute( colors, 4 );
  
  				colorAttribute.normalized = true; // this will map the buffer values to 0.0f - +1.0f in the shader
  
  				geometry.setAttribute( 'position', positionAttribute );
  				geometry.setAttribute( 'color', colorAttribute );
  
  				// material
  
  				const material = new THREE.RawShaderMaterial( {
  
  					uniforms: {
  						time: { value: 1.0 }
  					},
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  					side: THREE.DoubleSide,
  					transparent: true
  
  				} );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now();
    				const object = scene.children[ 0 ];
    				object.rotation.y = time * 0.0005;
    				object.material.uniforms.time.value = time * 0.005;
    				stats.update();
  })
  
  		
}
</script>
