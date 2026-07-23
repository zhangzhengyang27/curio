<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 1, far: 10 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - instancing demo (single triangle)\n\t\t<div id=\"notSupported\" style=\"display:none\">Sorry your graphics card + browser does not support hardware instancing"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  		let container, stats;
  
  
  		
  
  
  			container = document.getElementById( 'container' );
  
  			
  			camera.position.z = 2;
  
  			
  
  			// geometry
  
  			const vector = new THREE.Vector4();
  
  			const instances = 50000;
  
  			const positions = [];
  			const offsets = [];
  			const colors = [];
  			const orientationsStart = [];
  			const orientationsEnd = [];
  
  			positions.push( 0.025, - 0.025, 0 );
  			positions.push( - 0.025, 0.025, 0 );
  			positions.push( 0, 0, 0.025 );
  
  			// instanced attributes
  
  			for ( let i = 0; i < instances; i ++ ) {
  
  				// offsets
  
  				offsets.push( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  
  				// colors
  
  				colors.push( Math.random(), Math.random(), Math.random(), Math.random() );
  
  				// orientation start
  
  				vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
  				vector.normalize();
  
  				orientationsStart.push( vector.x, vector.y, vector.z, vector.w );
  
  				// orientation end
  
  				vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
  				vector.normalize();
  
  				orientationsEnd.push( vector.x, vector.y, vector.z, vector.w );
  
  			}
  
  			const geometry = new THREE.InstancedBufferGeometry();
  			geometry.instanceCount = instances;
  
  			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  
  			geometry.setAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  			geometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );
  			geometry.setAttribute( 'orientationStart', new THREE.InstancedBufferAttribute( new Float32Array( orientationsStart ), 4 ) );
  			geometry.setAttribute( 'orientationEnd', new THREE.InstancedBufferAttribute( new Float32Array( orientationsEnd ), 4 ) );
  
  			// material
  
  			const material = new THREE.RawShaderMaterial( {
  
  				uniforms: {
  					'time': { value: 1.0 },
  					'sineTime': { value: 1.0 }
  				},
  				vertexShader: document.getElementById( 'vertexShader' ).textContent,
  				fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  				side: THREE.DoubleSide,
  				forceSinglePass: true,
  				transparent: true
  
  			} );
  
  			//
  
  			const mesh = new THREE.Mesh( geometry, material );
  			scene.add( mesh );
  
  			//
  
  			
  
  
  			//
  
  			const gui = new GUI( { width: 350 } );
  			gui.add( geometry, 'instanceCount', 0, instances );
  
  			//
  
  			stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  			//
  
  			
  
  		
  
  
  		
  
  		//
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now();
    			const object = scene.children[ 0 ];
    			object.rotation.y = time * 0.0005;
    			object.material.uniforms[ 'time' ].value = time * 0.005;
    			object.material.uniforms[ 'sineTime' ].value = Math.sin( object.material.uniforms[ 'time' ].value * 0.05 );
    			stats.update();
  })
  
  	
}
</script>
