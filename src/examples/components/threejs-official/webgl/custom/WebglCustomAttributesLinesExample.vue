<template>
  <ExampleScene
    camera="perspective"
    antialias
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
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
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
  
  			let line, uniforms;
  
  			const loader = new FontLoader();
  			loader.load( ASSET_HOST + 'fonts/helvetiker_bold.typeface.json', function ( font ) {
  
  				init( font );
  
  			} );
  
  			function init( font ) {
  
  				
  				camera.position.z = 400;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  
  				uniforms = {
  
  					amplitude: { value: 5.0 },
  					opacity: { value: 0.3 },
  					color: { value: new THREE.Color( 0xffffff ) }
  
  				};
  
  				const shaderMaterial = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
  					blending: THREE.AdditiveBlending,
  					depthTest: false,
  					transparent: true
  
  				} );
  
  
  				const geometry = new TextGeometry( 'three.js', {
  
  					font: font,
  
  					size: 50,
  					depth: 15,
  					curveSegments: 10,
  
  					bevelThickness: 5,
  					bevelSize: 1.5,
  					bevelEnabled: true,
  					bevelSegments: 10,
  
  				} );
  
  				geometry.center();
  
  				const count = geometry.attributes.position.count;
  
  				const displacement = new THREE.Float32BufferAttribute( count * 3, 3 );
  				geometry.setAttribute( 'displacement', displacement );
  
  				const customColor = new THREE.Float32BufferAttribute( count * 3, 3 );
  				geometry.setAttribute( 'customColor', customColor );
  
  				const color = new THREE.Color( 0xffffff );
  
  				for ( let i = 0, l = customColor.count; i < l; i ++ ) {
  
  					color.setHSL( i / l, 0.5, 0.5 );
  					color.toArray( customColor.array, i * customColor.itemSize );
  
  				}
  
  				line = new THREE.Line( geometry, shaderMaterial );
  				line.rotation.x = 0.2;
  				scene.add( line );
  
  				
  
  
  				const container = document.getElementById( 'container' );
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.001;
    				line.rotation.y = 0.25 * time;
    				uniforms.amplitude.value = Math.sin( 0.5 * time );
    				uniforms.color.value.offsetHSL( 0.0005, 0, 0 );
    				const attributes = line.geometry.attributes;
    				const array = attributes.displacement.array;
    				for ( let i = 0, l = array.length; i < l; i += 3 ) {
    					array[ i ] += 0.3 * ( 0.5 - Math.random() );
    					array[ i + 1 ] += 0.3 * ( 0.5 - Math.random() );
    					array[ i + 2 ] += 0.3 * ( 0.5 - Math.random() );
    				}
    				attributes.displacement.needsUpdate = true;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.001;
  
  				line.rotation.y = 0.25 * time;
  
  				uniforms.amplitude.value = Math.sin( 0.5 * time );
  				uniforms.color.value.offsetHSL( 0.0005, 0, 0 );
  
  				const attributes = line.geometry.attributes;
  				const array = attributes.displacement.array;
  
  				for ( let i = 0, l = array.length; i < l; i += 3 ) {
  
  					array[ i ] += 0.3 * ( 0.5 - Math.random() );
  					array[ i + 1 ] += 0.3 * ( 0.5 - Math.random() );
  					array[ i + 2 ] += 0.3 * ( 0.5 - Math.random() );
  
  				}
  
  				attributes.displacement.needsUpdate = true;
  
  
  
  			}
  
  
  		
}
</script>
