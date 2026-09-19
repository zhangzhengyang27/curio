<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 20]"
    :camera-options="{ fov: 45, near: 0.25, far: 250 }"
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
import { pass, screenUV, uniform, uv, vec2, vec3, color, Fn, vec4, Loop, float, mix, luminance, smoothstep, rtt, time, viewportSize, instanceIndex, positionLocal } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Anamorphic Lensflares</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let instancedMesh;
  			let renderPipeline;
  			
  			const _dummy = new THREE.Object3D();
  
  			
  
  
  				
  
  				
  
  
  				
  				scene.backgroundNode = Fn( () => {
  
  					const dist = screenUV.distance( 0.5 ).mul( 2.0 );
  					return mix( color( 0x111111 ), color( 0x000000 ), dist );
  
  				} )();
  
  				const timeScale = uniform( 0.5 );
  
  				const material = new THREE.MeshBasicNodeMaterial( {
  					color: 0xffffff,
  					// Animate the spheres up and down continuously using TSL and their instanceIndex as a phase offset
  					positionNode: positionLocal.add( vec3( 0, time.add( float( instanceIndex ).mul( 0.5 ) ).mul( timeScale ).sin().mul( 5.0 ), 0 ) )
  				} );
  
  				const maxCount = 200;
  
  				instancedMesh = new THREE.InstancedMesh( new THREE.SphereGeometry( 0.1, 32, 32 ), material, maxCount );
  
  				const _color = new THREE.Color();
  
  				for ( let i = 0; i < maxCount; i ++ ) {
  
  					_dummy.position.x = ( Math.random() - 0.5 ) * 20;
  					_dummy.position.y = ( Math.random() - 0.5 ) * 20;
  					_dummy.position.z = ( Math.random() - 0.5 ) * 20;
  					_dummy.updateMatrix();
  					instancedMesh.setMatrixAt( i, _dummy.matrix );
  
  					_color.setHex( Math.random() * 0xffffff );
  					instancedMesh.setColorAt( i, _color );
  
  				}
  
  				scene.add( instancedMesh );
  
  				
  
  
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 1;
  				renderer.inspector = new Inspector();
  				controls.minDistance = 2;
  				controls.maxDistance = 25;
  
  				// post-processing
  
  				const scenePass = pass( scene, camera );
  
  				const intensity = uniform( 5.0 );
  				const tintColor = uniform( new THREE.Color( 0x7a8aff ) );
  				const threshold = uniform( 0.3 );
  				const radius = uniform( 0.0 );
  				const samples = uniform( 80 );
  
  				const bloomPass = bloom( scenePass.getTextureNode().toInspector( 'Color' ), intensity, radius, threshold );
  				bloomPass.setResolutionScale( 0.25 );
  
  				// Custom high pass for anamorphic bloom
  				bloomPass.highPassFn = Fn( ( { input, threshold, smoothWidth }: any ) => {
  
  					// Extract bright areas to a texture (computed once, sampled many times)
  					const v = luminance( input.rgb );
  					const alpha = smoothstep( threshold, threshold.add( smoothWidth ), v );
  					const brightPass = rtt( mix( vec4( 0 ), input, alpha ), null, null, {
  						wrapS: THREE.MirroredRepeatWrapping,
  						wrapT: THREE.MirroredRepeatWrapping
  					} );
  
  					// Horizontal blur
  					const total = vec4( 0 );
  					const halfSamples = samples.div( 2 );
  
  					const invSize = vec2( 1.0 ).div( viewportSize );
  
  					Loop( { start: halfSamples.negate(), end: halfSamples }, ( { i } ) => {
  
  						let softness = float( i ).abs().div( halfSamples ).oneMinus();
  						softness = softness.pow( 2.0 );
  
  						const shiftedUV = vec2( uv().x.add( invSize.x.mul( i ).mul( 4.0 ) ), uv().y );
  						total.addAssign( brightPass.sample( shiftedUV ).mul( softness ) );
  
  					} );
  
  					return total.div( samples.div( 3.0 ) );
  
  				} );
  
  				const anamorphicPass = bloomPass.mul( tintColor ).toInspector( 'Anamorphic' );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = scenePass.add( anamorphicPass );
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( intensity, 'value', 0, 10 ).name( 'intensity' );
  				gui.add( threshold, 'value', 0, .9 ).name( 'threshold' );
  				gui.add( samples, 'value', 2, 128, 1 ).name( 'samples' );
  				gui.addColor( tintColor, 'value' ).name( 'tint color' );
  				gui.add( radius, 'value', 0, 1, 0.01 ).name( 'bloom radius' );
  				gui.add( timeScale, 'value', 0, 1 ).name( 'time scale' );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderPipeline.render();
  })
  
  		
}
</script>
