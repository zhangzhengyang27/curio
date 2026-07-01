<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.1, far: 50 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { mix, vec2, step, texture, uv, screenUV, normalWorld, output, mrt } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Multiple Render Targets</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let torus;
  			let renderPipeline, renderTarget;
  
  			
  
  
  				
  
  
  				// Create a multi render target with Float buffers
  
  				renderTarget = new THREE.RenderTarget(
  					(__stage.container?.clientWidth || window.innerWidth) * window.devicePixelRatio,
  					(__stage.container?.clientHeight || window.innerHeight) * window.devicePixelRatio,
  					{ count: 2, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }
  				);
  
  				// Name our G-Buffer attachments for debugging
  
  				renderTarget.textures[ 0 ].name = 'output';
  				renderTarget.textures[ 1 ].name = 'normal';
  
  				// Scene
  
  				
  				scene.background = new THREE.Color( 0x222222 );
  
  				
  				camera.position.z = 4;
  
  				const loader = new THREE.TextureLoader();
  
  				const diffuse = loader.load( ASSET_HOST + 'textures/hardwood2_diffuse.jpg' );
  				diffuse.colorSpace = THREE.SRGBColorSpace;
  				diffuse.wrapS = THREE.RepeatWrapping;
  				diffuse.wrapT = THREE.RepeatWrapping;
  
  				const torusMaterial = new THREE.NodeMaterial();
  				torusMaterial.colorNode = texture( diffuse, uv().mul( vec2( 10, 4 ) ) );
  
  				torus = new THREE.Mesh( new THREE.TorusKnotGeometry( 1, 0.3, 128, 32 ), torusMaterial );
  				scene.add( torus );
  
  				// MRT
  
  				renderer.setMRT( mrt( {
  					'output': output,
  					'normal': normalWorld
  				} ) );
  
  				// Post Processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = mix( texture( renderTarget.textures[ 0 ] ), texture( renderTarget.textures[ 1 ] ), step( 0.5, screenUV.x ) );
  
  				// Controls
  
  				new OrbitControls( camera, renderer.domElement );
  
  				
  
  			
  
  
  			
  
  			function render( time ) {
  
  				torus.rotation.y = ( time / 1000 ) * .4;
  
  				// render scene into target
  				renderer.setRenderTarget( renderTarget );
  
  
  				// render post FX
  				renderer.setRenderTarget( null );
  				renderPipeline.render();
  
  			}
  
  		
}
</script>
