<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 27, near: 1, far: 4000 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - buffergeometry - lines"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, stats, timer;
  
  
  			let line;
  
  			const segments = 10000;
  			const r = 800;
  			let t = 0;
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				//
  
  				
  				camera.position.z = 2750;
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const geometry = new THREE.BufferGeometry();
  				const material = new THREE.LineBasicMaterial( { vertexColors: true } );
  
  				const positions = [];
  				const colors = [];
  
  				for ( let i = 0; i < segments; i ++ ) {
  
  					const x = Math.random() * r - r / 2;
  					const y = Math.random() * r - r / 2;
  					const z = Math.random() * r - r / 2;
  
  					// positions
  
  					positions.push( x, y, z );
  
  					// colors
  
  					colors.push( ( x / r ) + 0.5 );
  					colors.push( ( y / r ) + 0.5 );
  					colors.push( ( z / r ) + 0.5 );
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  				generateMorphTargets( geometry );
  
  				geometry.computeBoundingSphere();
  
  				line = new THREE.Line( geometry, material );
  				scene.add( line );
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				const time = timer.getElapsed();
    				line.rotation.x = time * 0.25;
    				line.rotation.y = time * 0.5;
    				t += delta * 0.5;
    				line.morphTargetInfluences[ 0 ] = Math.abs( Math.sin( t ) );
    				stats.update();
  })
  
  			function generateMorphTargets( geometry ) {
  
  				const data = [];
  
  				for ( let i = 0; i < segments; i ++ ) {
  
  					const x = Math.random() * r - r / 2;
  					const y = Math.random() * r - r / 2;
  					const z = Math.random() * r - r / 2;
  
  					data.push( x, y, z );
  
  				}
  
  				const morphTarget = new THREE.Float32BufferAttribute( data, 3 );
  				morphTarget.name = 'target1';
  
  				geometry.morphAttributes.position = [ morphTarget ];
  
  			}
  
  		
}
</script>
