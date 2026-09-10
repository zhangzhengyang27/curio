<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    custom-render
    :camera-options="{ fov: 70, near: 1, far: 20 }"
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Depth Texture</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			let quad, renderTarget;
  
  			const dpr = window.devicePixelRatio;
  
  			
  
  
  				
  				camera.position.z = 4;
  
  				
  				scene.background = new THREE.Color( 0x222222 );
  				scene.overrideMaterial = new THREE.MeshBasicNodeMaterial();
  
  				//
  
  				const geometry = new THREE.TorusKnotGeometry( 1, 0.3, 128, 64 );
  
  				const count = 50;
  				const scale = 5;
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					const r = Math.random() * 2.0 * Math.PI;
  					const z = ( Math.random() * 2.0 ) - 1.0;
  					const zScale = Math.sqrt( 1.0 - z * z ) * scale;
  
  					const mesh = new THREE.Mesh( geometry );
  					mesh.position.set(
  						Math.cos( r ) * zScale,
  						Math.sin( r ) * zScale,
  						z * scale
  					);
  					mesh.rotation.set( Math.random(), Math.random(), Math.random() );
  					scene.add( mesh );
  
  				}
  
  				//
  
  				
  
  
  				const depthTexture = new THREE.DepthTexture();
  				depthTexture.type = THREE.FloatType;
  
  				renderTarget = new THREE.RenderTarget( (__stage.container?.clientWidth || window.innerWidth) * dpr, (__stage.container?.clientHeight || window.innerHeight) * dpr );
  				renderTarget.depthTexture = depthTexture;
  
  				
  
  				// FX
  
  				const materialFX = new THREE.MeshBasicNodeMaterial();
  				materialFX.colorNode = texture( depthTexture );
  
  				quad = new THREE.QuadMesh( materialFX );
  
  				//
  
  				
  				controls.enableDamping = true;
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderer.setRenderTarget( renderTarget );
    				renderer.setRenderTarget( null );
    				quad.render( renderer );
  })
  
  		
}
</script>
