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
import { mix, step, texture, screenUV, mrt, output, normalWorld, uv, vec2 } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Multiple Render Targets</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let torus;
  			let quadMesh, sceneMRT, renderTarget, readbackTarget, material, readbackMaterial, pixelBuffer, pixelBufferTexture;
  
  			const options = {
  				selection: 'mrt',
  			};
  
  			
  
  
  				
  
  
  				//
  
  				renderer.inspector = new Inspector();
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( options, 'selection', [ 'mrt', 'diffuse', 'normal' ] );
  
  				// Create a multi render target with Float buffers
  
  				renderTarget = new THREE.RenderTarget(
  					(__stage.container?.clientWidth || window.innerWidth) * window.devicePixelRatio,
  					(__stage.container?.clientHeight || window.innerHeight) * window.devicePixelRatio,
  					{ count: 2, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }
  				);
  
  				// Name our G-Buffer attachments for debugging
  
  				renderTarget.textures[ 0 ].name = 'output';
  				renderTarget.textures[ 1 ].name = 'normal';
  
  				// Init readback render target, readback data texture, readback material
  				// Be careful with the size! 512 is already big. Reading data back from the GPU is computationally intensive
  
  				const size = 512;
  
  				readbackTarget = new THREE.RenderTarget( size, size, { count: 2 } );
  
  				pixelBuffer = new Uint8Array( size ** 2 * 4 ).fill( 0 );
  				pixelBufferTexture = new THREE.DataTexture( pixelBuffer, size, size );
  				pixelBufferTexture.type = THREE.UnsignedByteType;
  				pixelBufferTexture.format = THREE.RGBAFormat;
  
  				readbackMaterial = new THREE.MeshBasicNodeMaterial();
  				readbackMaterial.colorNode = texture( pixelBufferTexture );
  
  				// MRT
  
  				sceneMRT = mrt( {
  					'output': output,
  					'normal': normalWorld
  				} );
  
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
  
  				// Output
  
  				material = new THREE.NodeMaterial();
  				material.colorNode = mix( texture( renderTarget.textures[ 0 ] ), texture( renderTarget.textures[ 1 ] ), step( 0.5, screenUV.x ) );
  
  				quadMesh = new THREE.QuadMesh( material );
  
  				// Controls
  
  				new OrbitControls( camera, renderer.domElement );
  
  				
  
  			
  
  
  			
  
  			async function render( time ) {
  
  				const selection = options.selection;
  
  				torus.rotation.y = ( time / 1000 ) * .4;
  
  				const isReadback = ( selection !== 'mrt' );
  
  				// render scene into target
  				renderer.setMRT( sceneMRT );
  				renderer.setRenderTarget( isReadback ? readbackTarget : renderTarget );
  
  
  				// render post FX
  				renderer.setMRT( null );
  				renderer.setRenderTarget( null );
  
  				if ( isReadback ) {
  
  					quadMesh.material = readbackMaterial;
  
  					await readback();
  
  				} else {
  
  					quadMesh.material = material;
  
  				}
  
  				quadMesh.render( renderer );
  
  			}
  
  			async function readback() {
  
  				const width = readbackTarget.width;
  				const height = readbackTarget.height;
  
  				const selection = options.selection;
  
  				if ( selection === 'diffuse' ) {
  
  					pixelBuffer = await renderer.readRenderTargetPixelsAsync( readbackTarget, 0, 0, width, height, 0 ); // zero is optional
  
  					pixelBufferTexture.image.data = pixelBuffer;
  					pixelBufferTexture.needsUpdate = true;
  
  				} else if ( selection === 'normal' ) {
  
  					pixelBuffer = await renderer.readRenderTargetPixelsAsync( readbackTarget, 0, 0, width, height, 1 );
  
  					pixelBufferTexture.image.data = pixelBuffer;
  					pixelBufferTexture.needsUpdate = true;
  
  				}
  
  			}
  
  		
}
</script>
