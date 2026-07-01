<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 30, near: 1, far: 10000 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - custom attributes example"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats;
  
  			let sphere, uniforms;
  
  			let displacement, noise;
  
  			
  
  
  				
  				camera.position.z = 300;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  
  				uniforms = {
  
  					'amplitude': { value: 1.0 },
  					'color': { value: new THREE.Color( 0xff2200 ) },
  					'colorTexture': { value: new THREE.TextureLoader().load( ASSET_HOST + 'textures/water.jpg' ) }
  
  				};
  
  				uniforms[ 'colorTexture' ].value.wrapS = uniforms[ 'colorTexture' ].value.wrapT = THREE.RepeatWrapping;
  
  				const shaderMaterial = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent
  
  				} );
  
  
  				const radius = 50, segments = 128, rings = 64;
  
  				const geometry = new THREE.SphereGeometry( radius, segments, rings );
  
  				displacement = new Float32Array( geometry.attributes.position.count );
  				noise = new Float32Array( geometry.attributes.position.count );
  
  				for ( let i = 0; i < displacement.length; i ++ ) {
  
  					noise[ i ] = Math.random() * 5;
  
  				}
  
  				geometry.setAttribute( 'displacement', new THREE.BufferAttribute( displacement, 1 ) );
  
  				sphere = new THREE.Mesh( geometry, shaderMaterial );
  				scene.add( sphere );
  
  				
  
  
  				const container = document.getElementById( 'container' );
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.01;
    				sphere.rotation.y = sphere.rotation.z = 0.01 * time;
    				uniforms[ 'amplitude' ].value = 2.5 * Math.sin( sphere.rotation.y * 0.125 );
    				uniforms[ 'color' ].value.offsetHSL( 0.0005, 0, 0 );
    				for ( let i = 0; i < displacement.length; i ++ ) {
    					displacement[ i ] = Math.sin( 0.1 * i + time );
    					noise[ i ] += 0.5 * ( 0.5 - Math.random() );
    					noise[ i ] = THREE.MathUtils.clamp( noise[ i ], - 5, 5 );
    					displacement[ i ] += noise[ i ];
    				}
    				sphere.geometry.attributes.displacement.needsUpdate = true;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.01;
  
  				sphere.rotation.y = sphere.rotation.z = 0.01 * time;
  
  				uniforms[ 'amplitude' ].value = 2.5 * Math.sin( sphere.rotation.y * 0.125 );
  				uniforms[ 'color' ].value.offsetHSL( 0.0005, 0, 0 );
  
  				for ( let i = 0; i < displacement.length; i ++ ) {
  
  					displacement[ i ] = Math.sin( 0.1 * i + time );
  
  					noise[ i ] += 0.5 * ( 0.5 - Math.random() );
  					noise[ i ] = THREE.MathUtils.clamp( noise[ i ], - 5, 5 );
  
  					displacement[ i ] += noise[ i ];
  
  				}
  
  				sphere.geometry.attributes.displacement.needsUpdate = true;
  
  
  
  			}
  
  
  		
}
</script>
