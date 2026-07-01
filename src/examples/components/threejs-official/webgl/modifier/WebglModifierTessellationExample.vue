<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-100, 100, 200]"
    :camera-options="{ fov: 40, near: 1, far: 10000 }"
    :enable-controls="false"
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
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - modifier tessellation"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			let stats;
  
  
  			let mesh, uniforms;
  
  			const WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			const HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  			const loader = new FontLoader();
  			loader.load( ASSET_HOST + 'fonts/helvetiker_bold.typeface.json', function ( font ) {
  
  				init( font );
  
  			} );
  
  			function init( font ) {
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  
  				//
  
  				let geometry = new TextGeometry( 'THREE.JS', {
  
  					font: font,
  
  					size: 40,
  					depth: 5,
  					curveSegments: 3,
  
  					bevelThickness: 2,
  					bevelSize: 1,
  					bevelEnabled: true
  
  				} );
  
  				geometry.center();
  
  				const tessellateModifier = new TessellateModifier( 8, 6 );
  
  				geometry = tessellateModifier.modify( geometry );
  
  				//
  
  				const numFaces = geometry.attributes.position.count / 3;
  
  				const colors = new Float32Array( numFaces * 3 * 3 );
  				const displacement = new Float32Array( numFaces * 3 * 3 );
  
  				const color = new THREE.Color();
  
  				for ( let f = 0; f < numFaces; f ++ ) {
  
  					const index = 9 * f;
  
  					const h = 0.2 * Math.random();
  					const s = 0.5 + 0.5 * Math.random();
  					const l = 0.5 + 0.5 * Math.random();
  
  					color.setHSL( h, s, l );
  
  					const d = 10 * ( 0.5 - Math.random() );
  
  					for ( let i = 0; i < 3; i ++ ) {
  
  						colors[ index + ( 3 * i ) ] = color.r;
  						colors[ index + ( 3 * i ) + 1 ] = color.g;
  						colors[ index + ( 3 * i ) + 2 ] = color.b;
  
  						displacement[ index + ( 3 * i ) ] = d;
  						displacement[ index + ( 3 * i ) + 1 ] = d;
  						displacement[ index + ( 3 * i ) + 2 ] = d;
  
  					}
  
  				}
  
  				geometry.setAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
  				geometry.setAttribute( 'displacement', new THREE.BufferAttribute( displacement, 3 ) );
  
  				//
  
  				uniforms = {
  
  					amplitude: { value: 0.0 }
  
  				};
  
  				const shaderMaterial = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent
  
  				} );
  
  				//
  
  				mesh = new THREE.Mesh( geometry, shaderMaterial );
  
  				scene.add( mesh );
  
  				
  
  
  				const container = document.getElementById( 'container' );
  
  
  				
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.001;
    				uniforms.amplitude.value = 1.0 + Math.sin( time * 0.5 );
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.001;
  
  				uniforms.amplitude.value = 1.0 + Math.sin( time * 0.5 );
  
  				controls.update();
  
  
  
  			}
  
  
  		
}
</script>
