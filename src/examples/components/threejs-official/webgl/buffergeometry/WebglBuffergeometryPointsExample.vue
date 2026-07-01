<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 27, near: 5, far: 3500 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - buffergeometry - particles"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, stats;
  
  
  			let points;
  
  				container = document.getElementById( 'container' );
  
  				//
  
  				
  				camera.position.z = 2750;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  				scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
  
  				//
  
  				const particles = 500000;
  
  				const geometry = new THREE.BufferGeometry();
  
  				const positions = [];
  				const colors = [];
  
  				const color = new THREE.Color();
  
  				const n = 1000, n2 = n / 2; // particles spread in the cube
  
  				for ( let i = 0; i < particles; i ++ ) {
  
  					// positions
  
  					const x = Math.random() * n - n2;
  					const y = Math.random() * n - n2;
  					const z = Math.random() * n - n2;
  
  					positions.push( x, y, z );
  
  					// colors
  
  					const vx = ( x / n ) + 0.5;
  					const vy = ( y / n ) + 0.5;
  					const vz = ( z / n ) + 0.5;
  
  					color.setRGB( vx, vy, vz, THREE.SRGBColorSpace );
  
  					colors.push( color.r, color.g, color.b );
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  				geometry.computeBoundingSphere();
  
  				//
  
  				const material = new THREE.PointsMaterial( { size: 15, vertexColors: true } );
  
  				points = new THREE.Points( geometry, material );
  				scene.add( points );
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.001;
    				points.rotation.x = time * 0.25;
    				points.rotation.y = time * 0.5;
    				stats.update();
  })
  
  		
}
</script>
