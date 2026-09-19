<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[1.25, 1.25, 1.25]"
    :camera-options="{ fov: 50, near: 0.1, far: 10 }"
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
import { float, mx_noise_float, Loop, color, positionLocal, sin, vec2, vec3, mul, time, uniform, Fn, transformNormalToView } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Raging Sea</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  
  				
  
  				// lights
  			
  				const directionalLight = new THREE.DirectionalLight( '#ffffff', 3 );
  				directionalLight.position.set( - 4, 2, 0 );
  				scene.add( directionalLight );
  
  				// material
  
  				const material = new THREE.MeshStandardNodeMaterial( { color: '#271442', roughness: 0.15 } );
  
  				const emissiveColor = uniform( color( '#ff0a81' ) );
  				const emissiveLow = uniform( - 0.25 );
  				const emissiveHigh = uniform( 0.2 );
  				const emissivePower = uniform( 7 );
  				const largeWavesFrequency = uniform( vec2( 3, 1 ) );
  				const largeWavesSpeed = uniform( 1.25 );
  				const largeWavesMultiplier = uniform( 0.15 );
  				const smallWavesIterations = uniform( 3 );
  				const smallWavesFrequency = uniform( 2 );
  				const smallWavesSpeed = uniform( 0.3 );
  				const smallWavesMultiplier = uniform( 0.18 );
  				const normalComputeShift = uniform( 0.01 );
  
  				// TSL functions
  
  				const wavesElevation = Fn( ( [ position ]: any ) => {
  
  					// large waves
  
  					const elevation = mul(
  						sin( position.x.mul( largeWavesFrequency.x ).add( time.mul( largeWavesSpeed ) ) ),
  						sin( position.z.mul( largeWavesFrequency.y ).add( time.mul( largeWavesSpeed ) ) ),
  						largeWavesMultiplier
  					).toVar();
  
  					Loop( { start: float( 1 ), end: smallWavesIterations.add( 1 ) }, ( { i } ) => {
  
  						const noiseInput = vec3(
  							position.xz
  								.add( 2 ) // avoids a-hole pattern
  								.mul( smallWavesFrequency )
  								.mul( i ),
  							time.mul( smallWavesSpeed )
  						);
  
  						const wave = mx_noise_float( noiseInput, 1, 0 )
  							.mul( smallWavesMultiplier )
  							.div( i )
  							.abs();
  
  						elevation.subAssign( wave );
  
  					} );
  
  					return elevation;
  
  				} );
  
  				// position
  
  				const elevation = (wavesElevation as any)( (positionLocal as any) );
  				const position = positionLocal.add( vec3( 0, elevation, 0 ) );
  
  				material.positionNode = position;
  
  				// normals
  
  				let positionA = positionLocal.add( vec3( normalComputeShift, 0, 0 ) );
  				let positionB = positionLocal.add( vec3( 0, 0, normalComputeShift.negate() ) );
  
  				positionA = positionA.add( vec3( 0, (wavesElevation as any)( (positionA as any) ), 0 ) );
  				positionB = positionB.add( vec3( 0, (wavesElevation as any)( (positionB as any) ), 0 ) );
  
  				const toA = positionA.sub( position ).normalize();
  				const toB = positionB.sub( position ).normalize();
  				const normal = toA.cross( toB );
  
  				material.normalNode = transformNormalToView( normal );
  
  				// emissive
  
  				const emissive = elevation.remap( emissiveHigh, emissiveLow ).pow( emissivePower );
  				material.emissiveNode = emissiveColor.mul( emissive );
  
  				// mesh
  
  				const geometry = new THREE.PlaneGeometry( 2, 2, 256, 256 );
  				geometry.rotateX( - Math.PI * 0.5 );
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				
  				controls.target.y = - 0.25;
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				// debug
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui.addColor( { color: (material as any)!.color.getHex( THREE.SRGBColorSpace ) }, 'color' ).name( 'color' ).onChange( (value: any) => (material as any)!.color.set( value ) );
  				gui.add( material, 'roughness', 0, 1, 0.001 );
  
  				const colorGui = gui.addFolder( 'emissive' );
  				colorGui.addColor( { color: emissiveColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' ).name( 'color' ).onChange( (value: any) => emissiveColor.value.set( value ) );
  				colorGui.add( emissiveLow, 'value', - 1, 0, 0.001 ).name( 'low' );
  				colorGui.add( emissiveHigh, 'value', 0, 1, 0.001 ).name( 'high' );
  				colorGui.add( emissivePower, 'value', 1, 10, 1 ).name( 'power' );
  
  				const wavesGui = gui.addFolder( 'waves' );
  				wavesGui.add( largeWavesSpeed, 'value', 0, 5 ).name( 'largeSpeed' );
  				wavesGui.add( largeWavesMultiplier, 'value', 0, 1 ).name( 'largeMultiplier' );
  				wavesGui.add( largeWavesFrequency.value, 'x', 0, 10 ).name( 'largeFrequencyX' );
  				wavesGui.add( largeWavesFrequency.value, 'y', 0, 10 ).name( 'largeFrequencyY' );
  				wavesGui.add( smallWavesIterations, 'value', 0, 5, 1 ).name( 'smallIterations' );
  				wavesGui.add( smallWavesFrequency, 'value', 0, 10 ).name( 'smallFrequency' );
  				wavesGui.add( smallWavesSpeed, 'value', 0, 1 ).name( 'smallSpeed' );
  				wavesGui.add( smallWavesMultiplier, 'value', 0, 1 ).name( 'smallMultiplier' );
  				wavesGui.add( normalComputeShift, 'value', 0, 0.1, 0.0001 ).name( 'normalComputeShift' );
  
  				// events
  
  				
  
  			
  
  
  			
  
  			async function animate() {
  			
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
