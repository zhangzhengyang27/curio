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
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - buffergeometry custom attributes - particles"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats;
  
  			let particleSystem, uniforms, geometry;
  
  			const particles = 100000;
  
  			
  
  
  				
  				camera.position.z = 300;
  
  				
  
  				uniforms = {
  
  					pointTexture: { value: new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/spark1.png' ) }
  
  				};
  
  				const shaderMaterial = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
  
  					blending: THREE.AdditiveBlending,
  					depthTest: false,
  					transparent: true,
  					vertexColors: true
  
  				} );
  
  
  				const radius = 200;
  
  				geometry = new THREE.BufferGeometry();
  
  				const positions = [];
  				const colors = [];
  				const sizes = [];
  
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < particles; i ++ ) {
  
  					positions.push( ( Math.random() * 2 - 1 ) * radius );
  					positions.push( ( Math.random() * 2 - 1 ) * radius );
  					positions.push( ( Math.random() * 2 - 1 ) * radius );
  
  					color.setHSL( i / particles, 1.0, 0.5 );
  
  					colors.push( color.r, color.g, color.b );
  
  					sizes.push( 20 );
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  				geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( THREE.DynamicDrawUsage ) );
  
  				particleSystem = new THREE.Points( geometry, shaderMaterial );
  
  				scene.add( particleSystem );
  
  				
  
  
  				const container = document.getElementById( 'container' );
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.005;
    				particleSystem.rotation.z = 0.01 * time;
    				const sizes = geometry.attributes.size.array;
    				for ( let i = 0; i < particles; i ++ ) {
    					sizes[ i ] = 10 * ( 1 + Math.sin( 0.1 * i + time ) );
    				}
    				geometry.attributes.size.needsUpdate = true;
    				stats.update();
  })
  
  		
}
</script>
