<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 75, near: 1, far: 10000 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl particles waves example"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const SEPARATION = 100, AMOUNTX = 50, AMOUNTY = 50;
  
  			let container, stats;
  
  
  			let particles, count = 0;
  
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			
  
  
  				
  				camera.position.z = 1000;
  
  				
  
  				//
  
  				const numParticles = AMOUNTX * AMOUNTY;
  
  				const positions = new Float32Array( numParticles * 3 );
  				const scales = new Float32Array( numParticles );
  
  				let i = 0, j = 0;
  
  				for ( let ix = 0; ix < AMOUNTX; ix ++ ) {
  
  					for ( let iy = 0; iy < AMOUNTY; iy ++ ) {
  
  						positions[ i ] = ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ); // x
  						positions[ i + 1 ] = 0; // y
  						positions[ i + 2 ] = iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ); // z
  
  						scales[ j ] = 1;
  
  						i += 3;
  						j ++;
  
  					}
  
  				}
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: {
  						color: { value: new THREE.Color( 0xffffff ) },
  					},
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent
  
  				} );
  
  				//
  
  				particles = new THREE.Points( geometry, material );
  				scene.add( particles );
  
  				//
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				container.style.touchAction = 'none';
  				container.addEventListener( 'pointermove', onPointerMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			function onPointerMove( event ) {
  
  				if ( event.isPrimary === false ) return;
  
  				mouseX = event.clientX - windowHalfX;
  				mouseY = event.clientY - windowHalfY;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y += ( - mouseY - camera.position.y ) * .05;
    				const positions = particles.geometry.attributes.position.array;
    				const scales = particles.geometry.attributes.scale.array;
    				let i = 0, j = 0;
    				for ( let ix = 0; ix < AMOUNTX; ix ++ ) {
    					for ( let iy = 0; iy < AMOUNTY; iy ++ ) {
    						positions[ i + 1 ] = ( Math.sin( ( ix + count ) * 0.3 ) * 50 ) +
    										( Math.sin( ( iy + count ) * 0.5 ) * 50 );
    						scales[ j ] = ( Math.sin( ( ix + count ) * 0.3 ) + 1 ) * 20 +
    										( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * 20;
    						i += 3;
    						j ++;
    					}
    				}
    				particles.geometry.attributes.position.needsUpdate = true;
    				particles.geometry.attributes.scale.needsUpdate = true;
    				count += 0.1;
    }
    				stats.update();
  })
  
  			function render() {
  
  				camera.position.x += ( mouseX - camera.position.x ) * .05;
  				camera.position.y += ( - mouseY - camera.position.y ) * .05;
  
  
  				const positions = particles.geometry.attributes.position.array;
  				const scales = particles.geometry.attributes.scale.array;
  
  				let i = 0, j = 0;
  
  				for ( let ix = 0; ix < AMOUNTX; ix ++ ) {
  
  					for ( let iy = 0; iy < AMOUNTY; iy ++ ) {
  
  						positions[ i + 1 ] = ( Math.sin( ( ix + count ) * 0.3 ) * 50 ) +
  										( Math.sin( ( iy + count ) * 0.5 ) * 50 );
  
  						scales[ j ] = ( Math.sin( ( ix + count ) * 0.3 ) + 1 ) * 20 +
  										( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * 20;
  
  						i += 3;
  						j ++;
  
  					}
  
  				}
  
  				particles.geometry.attributes.position.needsUpdate = true;
  				particles.geometry.attributes.scale.needsUpdate = true;
  
  
  
  				count += 0.1;
  
  			}
  
  		
}
</script>
