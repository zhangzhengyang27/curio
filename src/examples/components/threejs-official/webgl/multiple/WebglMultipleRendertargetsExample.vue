<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 0.1, far: 50 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\">threejs</a> webgl - Multiple RenderTargets"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  			let renderTarget;
  			let postScene, postCamera;
  
  			const parameters = {
  				samples: 4,
  				wireframe: false
  			};
  
  			const gui = new GUI();
  			gui.add( parameters, 'samples', 0, 4 ).step( 1 );
  			gui.add( parameters, 'wireframe' );
  			gui.onChange( render );
  
  			
  
  
  				
  
  
  
  
  				// Create a multi render target with Float buffers
  
  				renderTarget = new THREE.WebGLRenderTarget(
  					(__stage.container?.clientWidth || window.innerWidth) * window.devicePixelRatio,
  					(__stage.container?.clientHeight || window.innerHeight) * window.devicePixelRatio,
  					{
  						count: 2,
  						minFilter: THREE.NearestFilter,
  						magFilter: THREE.NearestFilter
  					}
  				);
  
  				// Name our G-Buffer attachments for debugging
  
  				renderTarget.textures[ 0 ].name = 'diffuse';
  				renderTarget.textures[ 1 ].name = 'normal';
  
  				// Scene setup
  
  				
  				scene.background = new THREE.Color( 0x222222 );
  
  				
  				camera.position.z = 4;
  
  				const loader = new THREE.TextureLoader();
  
  				const diffuse = loader.load( ASSET_HOST + 'textures/hardwood2_diffuse.jpg', render );
  				diffuse.wrapS = THREE.RepeatWrapping;
  				diffuse.wrapT = THREE.RepeatWrapping;
  				diffuse.colorSpace = THREE.SRGBColorSpace;
  
  				scene.add( new THREE.Mesh(
  					new THREE.TorusKnotGeometry( 1, 0.3, 128, 32 ),
  					new THREE.RawShaderMaterial( {
  						name: 'G-Buffer Shader',
  						vertexShader: document.querySelector( '#gbuffer-vert' ).textContent.trim(),
  						fragmentShader: document.querySelector( '#gbuffer-frag' ).textContent.trim(),
  						uniforms: {
  							tDiffuse: { value: diffuse },
  							repeat: { value: new THREE.Vector2( 5, 0.5 ) }
  						},
  						glslVersion: THREE.GLSL3
  					} )
  				) );
  
  				// PostProcessing setup
  
  				postScene = new THREE.Scene();
  				postCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  
  				postScene.add( new THREE.Mesh(
  					new THREE.PlaneGeometry( 2, 2 ),
  					new THREE.RawShaderMaterial( {
  						name: 'Post-FX Shader',
  						vertexShader: document.querySelector( '#render-vert' ).textContent.trim(),
  						fragmentShader: document.querySelector( '#render-frag' ).textContent.trim(),
  						uniforms: {
  							tDiffuse: { value: renderTarget.textures[ 0 ] },
  							tNormal: { value: renderTarget.textures[ 1 ] },
  						},
  						glslVersion: THREE.GLSL3
  					} )
  				) );
  
  				// Controls
  
  				
  				controls.addEventListener( 'change', render );
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  				renderTarget.samples = parameters.samples;
  
  				scene.traverse( function ( child ) {
  
  					if ( child.material !== undefined ) {
  
  						child.material.wireframe = parameters.wireframe;
  
  					}
  
  				} );
  
  				// render scene into target
  				renderer.setRenderTarget( renderTarget );
  
  
  				// render post FX
  				renderer.setRenderTarget( null );
  				renderer.render( postScene, postCamera );
  
  			}
  
  		
}
</script>
