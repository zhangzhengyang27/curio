<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 2]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Break, If, vec3, vec4, texture3D, uniform, Fn } from 'three/tsl';
import { RaymarchingBox } from 'three/examples/jsm/tsl/utils/Raymarching.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Volumetric Perlin</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let mesh;
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  
  				
  
  
  				new OrbitControls( camera, renderer.domElement );
  
  				// Texture
  
  				const size = 128;
  				const data = new Uint8Array( size * size * size );
  
  				let i = 0;
  				const perlin = new ImprovedNoise();
  				const vector = new THREE.Vector3();
  
  				for ( let z = 0; z < size; z ++ ) {
  
  					for ( let y = 0; y < size; y ++ ) {
  
  						for ( let x = 0; x < size; x ++ ) {
  
  							vector.set( x, y, z ).divideScalar( size );
  
  							const d = perlin.noise( vector.x * 6.5, vector.y * 6.5, vector.z * 6.5 );
  
  							data[ i ++ ] = d * 128 + 128;
  
  						}
  
  					}
  
  				}
  
  				const texture = new THREE.Data3DTexture( data, size, size, size );
  				texture.format = THREE.RedFormat;
  				texture.minFilter = THREE.LinearFilter;
  				texture.magFilter = THREE.LinearFilter;
  				texture.unpackAlignment = 1;
  				texture.needsUpdate = true;
  
  				// Shader
  
  				const opaqueRaymarchingTexture = Fn( ( { texture, steps, threshold }: any ) => {
  
  					const finalColor = vec4( 0 ).toVar();
  
  					RaymarchingBox( steps, ( { positionRay } ) => {
  
  						const mapValue = texture.sample( positionRay.add( 0.5 ) ).r.toVar();
  
  						If( mapValue.greaterThan( threshold ), () => {
  
  							const p = vec3( positionRay ).add( 0.5 );
  
  							finalColor.rgb.assign( texture.normal( p ).mul( 0.5 ).add( positionRay.mul( 1.5 ).add( 0.25 ) ) );
  							finalColor.a.assign( 1 );
  							Break();
  
  						} );
  
  					} );
  
  					return finalColor;
  
  				} );
  
  				//
  
  				const threshold = uniform( 0.6 );
  				const steps = uniform( 200 );
  
  				const material = new THREE.NodeMaterial();
  				material.colorNode = ( opaqueRaymarchingTexture as any )( {
  					texture: texture3D( texture, null, 0 ),
  					steps,
  					threshold
  				} );
  				material.side = THREE.BackSide;
  				material.transparent = true;
  
  				mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), material );
  				scene.add( mesh );
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  				gui.add( threshold, 'value', 0, 1, 0.01 ).name( 'threshold' );
  				gui.add( steps, 'value', 0, 300, 1 ).name( 'steps' );
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
