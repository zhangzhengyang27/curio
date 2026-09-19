<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 1, far: 10000 }"
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
import { instancedBufferAttribute, uniform, mod, pass, texture, float, time, vec2, vec3, vec4, sin, cos } from 'three/tsl';
import { afterImage } from 'three/examples/jsm/tsl/display/AfterImageNode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>After Image</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let particles: any;
  			let renderPipeline: any, afterImagePass: any, scenePass: any;
  
  			const params = {
  
  				damp: uniform( 0.8, 'float' ).setName( 'damp' ),
  				enabled: true
  
  			};
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				camera.position.z = 1000;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				const sprite = new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/circle.png' );
  
  				// geometry
  
  				const radius = 600;
  				const count = 50000;
  
  				const vertex = new THREE.Vector3();
  				const color = new THREE.Color();
  
  				const colors = [];
  				const vertices = [];
  				const timeOffsets = [];
  
  				for ( var i = 0; i < count; i ++ ) {
  
  					getRandomPointOnSphere( radius, vertex );
  					vertices.push( vertex.x, vertex.y, vertex.z );
  
  					color.setHSL( i / count, 0.7, 0.7, THREE.SRGBColorSpace );
  					colors.push( color.r, color.g, color.b );
  
  					timeOffsets.push( i / count );
  
  				}
  
  				const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( vertices ), 3 );
  				const colorAttribute = new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 );
  				const timeAttribute = new THREE.InstancedBufferAttribute( new Float32Array( timeOffsets ), 1 );
  
  				// material and TSL
  
  				const material = new THREE.SpriteNodeMaterial( { blending: THREE.AdditiveBlending, depthWrite: false } );
  
  				const localTime = ( instancedBufferAttribute( timeAttribute ) as any ).add( time.mul( 0.1 ) );
  				const modTime = mod( localTime, 1.0 );
  				const accTime = modTime.mul( modTime );
  
  				const angle = accTime.mul( 40.0 );
  				const pulse = vec2( sin( angle ).mul( 20.0 ), cos( angle ).mul( 20.0 ) );
  				const pos: any = instancedBufferAttribute( positionAttribute );
  
  				const animated = vec3( pos.x.mul( accTime ).add( pulse.x ), pos.y.mul( accTime ).add( pulse.y ), pos.z.mul( accTime ).mul( 1.75 ) );
  				const fAlpha = modTime.oneMinus().mul( 2.0 );
  
  				material.colorNode = texture( sprite ).mul( vec4( instancedBufferAttribute( colorAttribute ) as any, fAlpha ) );
  				material.positionNode = animated;
  				material.scaleNode = float( 2 );
  
  				particles = new THREE.Sprite( material );
  				particles.count = count;
  				scene.add( particles );
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				scenePass = pass( scene, camera );
  
  				afterImagePass = afterImage( scenePass, params.damp );
  
  				renderPipeline.outputNode = afterImagePass;
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( afterImagePass.damp, 'value', 0.25, 1 );
  				gui.add( params, 'enabled' ).onChange( updatePassChain );
  
  				
  
  			
  
  
  			function updatePassChain() {
  
  				if ( params.enabled === true ) {
  
  					renderPipeline.outputNode = afterImagePass;
  
  				} else {
  
  					renderPipeline.outputNode = scenePass;
  
  				}
  
  				renderPipeline.needsUpdate = true;
  
  
  			}
  
  
  			function getRandomPointOnSphere( r: any, v: any ) {
  
  				const angle = Math.random() * Math.PI * 2;
  				const u = Math.random() * 2 - 1;
  
  				v.set(
  					Math.cos( angle ) * Math.sqrt( 1 - Math.pow( u, 2 ) ) * r,
  					Math.sin( angle ) * Math.sqrt( 1 - Math.pow( u, 2 ) ) * r,
  					u * r
  				);
  
  				return v;
  
  			}
  
  			
  
  			function animate( time: any ) {
  
  				particles.rotation.z = time * 0.001;
  
  				renderPipeline.render();
  
  			}
  
  		
}
</script>
