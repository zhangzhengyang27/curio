<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 1.5]"
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
import { float, vec3, vec4, If, Break, Fn, smoothstep, texture3D, uniform } from 'three/tsl';
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

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Volumetric Cloud</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let mesh;
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  
  				
  
  
  				new OrbitControls( camera, renderer.domElement );
  
  				// Sky
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = 1;
  				canvas.height = 32;
  
  				const context = canvas.getContext( '2d' )!;
  				const gradient = context.createLinearGradient( 0, 0, 0, 32 );
  				gradient.addColorStop( 0.0, '#014a84' );
  				gradient.addColorStop( 0.5, '#0561a0' );
  				gradient.addColorStop( 1.0, '#437ab6' );
  				context.fillStyle = gradient;
  				context.fillRect( 0, 0, 1, 32 );
  
  				const skyMap = new THREE.CanvasTexture( canvas );
  				skyMap.colorSpace = THREE.SRGBColorSpace;
  
  				const sky = new THREE.Mesh(
  					new THREE.SphereGeometry( 10 ),
  					new THREE.MeshBasicNodeMaterial( { map: skyMap, side: THREE.BackSide } )
  				);
  				scene.add( sky );
  
  				// Texture
  
  				const size = 128;
  				const data = new Uint8Array( size * size * size );
  
  				let i = 0;
  				const scale = 0.05;
  				const perlin = new ImprovedNoise();
  				const vector = new THREE.Vector3();
  
  				for ( let z = 0; z < size; z ++ ) {
  
  					for ( let y = 0; y < size; y ++ ) {
  
  						for ( let x = 0; x < size; x ++ ) {
  
  							const d = 1.0 - vector.set( x, y, z ).subScalar( size / 2 ).divideScalar( size ).length();
  							data[ i ] = ( 128 + 128 * perlin.noise( x * scale / 1.5, y * scale, z * scale / 1.5 ) ) * d * d;
  							i ++;
  
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
  
  				const transparentRaymarchingTexture = Fn( ( {
  					texture,
  					range = float( 0.1 ),
  					threshold = float( 0.25 ),
  					opacity = float( 0.25 ),
  					steps = float( 100 )
  				}: any ) => {
  
  					const finalColor = vec4( 0 ).toVar();
  
  					RaymarchingBox( steps, ( { positionRay } ) => {
  
  						const mapValue = float( texture.sample( positionRay.add( 0.5 ) ).r ).toVar();
  
  						mapValue.assign( smoothstep( threshold.sub( range ), threshold.add( range ), mapValue ).mul( opacity ) );
  
  						const shading = texture.sample( positionRay.add( vec3( - 0.01 ) ) ).r.sub( texture.sample( positionRay.add( vec3( 0.01 ) ) ).r );
  
  						const col = shading.mul( 3.0 ).add( positionRay.x.add( positionRay.y ).mul( 0.25 ) ).add( 0.2 );
  
  						finalColor.rgb.addAssign( finalColor.a.oneMinus().mul( mapValue ).mul( col ) );
  
  						finalColor.a.addAssign( finalColor.a.oneMinus().mul( mapValue ) );
  
  						If( finalColor.a.greaterThanEqual( 0.95 ), () => {
  
  							Break();
  
  						} );
  
  					} );
  
  					return finalColor;
  
  				} );
  
  				// Material
  
  				const baseColor = uniform( new THREE.Color( 0x798aa0 ) );
  				const range = uniform( 0.1 );
  				const threshold = uniform( 0.25 );
  				const opacity = uniform( 0.25 );
  				const steps = uniform( 100 );
  
  				const cloud3d = ( transparentRaymarchingTexture as any )( {
  					texture: texture3D( texture, null, 0 ),
  					range,
  					threshold,
  					opacity,
  					steps
  				} );
  
  				const finalCloud = cloud3d.setRGB( cloud3d.rgb.add( baseColor ) );
  
  				const material = new THREE.NodeMaterial();
  				material.colorNode = finalCloud;
  				material.side = THREE.BackSide;
  				material.transparent = true;
  
  				mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), material );
  				scene.add( mesh );
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  				gui.add( threshold, 'value', 0, 1, 0.01 ).name( 'threshold' );
  				gui.add( opacity, 'value', 0, 1, 0.01 ).name( 'opacity' );
  				gui.add( range, 'value', 0, 1, 0.01 ).name( 'range' );
  				gui.add( steps, 'value', 0, 200, 1 ).name( 'steps' );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    mesh.rotation.y = - performance.now() / 7500;
  })
  
  		
}
</script>
