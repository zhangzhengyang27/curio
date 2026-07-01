<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { positionLocal, time, mod, instancedBufferAttribute, rotate, screenUV, color, vec2 } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Layers</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			
  
  
  				
  				camera.layers.enable( 0 ); // enabled by default
  				camera.layers.enable( 1 );
  				camera.layers.enable( 2 );
  
  				camera.position.z = 10;
  
  				
  
  				const horizontalEffect = screenUV.x.mix( color( 0xf996ae ), color( 0xf6f0a3 ) );
  				const lightEffect = screenUV.distance( vec2( 0.5, 1.0 ) ).oneMinus().mul( color( 0xd9b6fd ) );
  
  				scene.backgroundNode = horizontalEffect.add( lightEffect );
  
  				const sprite = new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/blossom.png' );
  				sprite.colorSpace = THREE.SRGBColorSpace;
  
  				const count = 2500;
  
  				const geometry = new THREE.PlaneGeometry( 0.25, 0.25 );
  
  				const colors = [ 0xD70654, 0xFFD95F, 0xB8D576 ];
  
  				for ( let i = 0; i < 3; i ++ ) {
  
  					const particles = new THREE.Mesh( geometry, getMaterial( count, colors[ i ], sprite ) );
  					particles.layers.set( i );
  					particles.count = count;
  					scene.add( particles );
  
  				}
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// GUI
  
  				const layers = {
  					'Red': true,
  					'Yellow': true,
  					'Green': true
  				};
  
  				const gui = renderer.inspector.createParameters( 'Layers' );
  
  				gui.add( layers, 'Red' ).onChange( () => {
  
  					camera.layers.toggle( 0 );
  
  				} );
  
  				gui.add( layers, 'Yellow' ).onChange( () => {
  
  					camera.layers.toggle( 1 );
  
  				} );
  
  				gui.add( layers, 'Green' ).onChange( () => {
  
  					camera.layers.toggle( 2 );
  
  				} );
  
  				//
  
  				
  
  			
  
  
  			function getMaterial( count, color, sprite ) {
  
  				// instance data
  
  				const positions = [];
  				const rotations = [];
  				const directions = [];
  				const timeOffsets = [];
  
  				const v = new THREE.Vector3();
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					positions.push(
  						THREE.MathUtils.randFloat( - 25, - 20 ),
  						THREE.MathUtils.randFloat( - 10, 50 ),
  						THREE.MathUtils.randFloat( - 5, 5 )
  					);
  
  					v.set( THREE.MathUtils.randFloat( 0.7, 0.9 ), THREE.MathUtils.randFloat( - 0.3, - 0.15 ), 0 ).normalize();
  
  					rotations.push( Math.random(), Math.random(), Math.random() );
  
  					directions.push( v.x, v.y, v.z );
  
  					timeOffsets.push( i / count );
  
  				}
  
  				const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );
  				const rotationAttribute = new THREE.InstancedBufferAttribute( new Float32Array( rotations ), 3 );
  				const directionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( directions ), 3 );
  				const timeAttribute = new THREE.InstancedBufferAttribute( new Float32Array( timeOffsets ), 1 );
  
  				// material
  
  				const material = new THREE.MeshBasicNodeMaterial( {
  					color: color,
  					map: sprite,
  					alphaMap: sprite,
  					alphaTest: 0.1,
  					side: THREE.DoubleSide,
  					forceSinglePass: true
  				} );
  
  				// TSL
  
  				const instancePosition = instancedBufferAttribute( positionAttribute );
  				const instanceDirection = instancedBufferAttribute( directionAttribute );
  				const instanceRotation = instancedBufferAttribute( rotationAttribute );
  
  				const localTime = instancedBufferAttribute( timeAttribute ).add( time.mul( 0.02 ) );
  				const modTime = mod( localTime, 1.0 );
  
  				const rotatedPosition = rotate( positionLocal, instanceRotation.mul( modTime.mul( 20 ) ) );
  				material.positionNode = rotatedPosition.add( instancePosition ).add( instanceDirection.mul( modTime.mul( 50 ) ) );
  
  				return material;
  
  			}
  
  			
  
  			//
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
