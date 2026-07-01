<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.1, far: 2000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">\n\t\t\t\tthree.js\n\t\t\t</a>\n\t\t\t- 2D Texture array framebuffer color attachment\n\t\t\t<br />\n\n\t\t\t<p>\n\t\t\t\tThis example shows how to render to an array of 2D texture.</br>\n\t\t\t\tWebGL2 allows to render to specific \"layers\" in 3D texture and array of textures.\n\t\t\t</p>\n\n\t\t\tScanned head data by\n\t\t\t<a href=\"https://www.codeproject.com/Articles/352270/Getting-started-with-Volume-Rendering\" target=\"_blank\" rel=\"noopener\">Divine Augustine</a><br />\n\t\t\tlicensed under\n\t\t\t<a href=\"https://www.codeproject.com/info/cpol10.aspx\" target=\"_blank\" rel=\"noopener\">CPOL</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const DIMENSIONS = {
  				width: 256,
  				height: 256,
  				depth: 109
  			};
  
  			const params = {
  				intensity: 1
  			};
  
  			/** Post-processing objects */
  
  			const postProcessScene = new THREE.Scene();
  			const postProcessCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  
  			const renderTarget = new THREE.WebGLArrayRenderTarget( DIMENSIONS.width, DIMENSIONS.height, DIMENSIONS.depth );
  			renderTarget.texture.format = THREE.RedFormat;
  
  			const postProcessMaterial = new THREE.ShaderMaterial( {
  				uniforms: {
  					uTexture: { value: null },
  					uDepth: { value: 55 },
  					uIntensity: { value: 1.0 }
  				},
  				vertexShader: document.getElementById( 'vertex-postprocess' ).textContent.trim(),
  				fragmentShader: document.getElementById( 'fragment-postprocess' ).textContent.trim()
  			} );
  
  			let depthStep = 0.4;
  
  			let mesh, stats;
  
  			const planeWidth = 50;
  			const planeHeight = 50;
  
  			
  
  
  				
  
  				
  				camera.position.z = 70;
  
  				
  
  				/** Post-processing scene */
  
  				const planeGeometry = new THREE.PlaneGeometry( 2, 2 );
  				const screenQuad = new THREE.Mesh( planeGeometry, postProcessMaterial );
  				postProcessScene.add( screenQuad );
  
  				// 2D Texture array is available on WebGL 2.0
  
  				
  
  
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  				const gui = new GUI();
  
  				gui.add( params, 'intensity', 0, 1 ).step( 0.01 ).onChange( value => postProcessMaterial.uniforms.uIntensity.value = value );
  				gui.open();
  
  				// width 256, height 256, depth 109, 8-bit, zip archived raw data
  
  				new THREE.FileLoader()
  					.setResponseType( 'arraybuffer' )
  					.load( ASSET_HOST + 'textures/3d/head256x256x109.zip', function ( data ) {
  
  						const zip = unzipSync( new Uint8Array( data ) );
  						const array = new Uint8Array( zip[ 'head256x256x109' ].buffer );
  
  						const texture = new THREE.DataArrayTexture( array, DIMENSIONS.width, DIMENSIONS.height, DIMENSIONS.depth );
  						texture.format = THREE.RedFormat;
  						texture.needsUpdate = true;
  
  						const material = new THREE.ShaderMaterial( {
  							uniforms: {
  								diffuse: { value: renderTarget.texture },
  								depth: { value: 55 },
  								size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
  							},
  							vertexShader: document.getElementById( 'vs' ).textContent.trim(),
  							fragmentShader: document.getElementById( 'fs' ).textContent.trim()
  						} );
  
  						const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
  
  						mesh = new THREE.Mesh( geometry, material );
  
  						scene.add( mesh );
  
  						postProcessMaterial.uniforms.uTexture.value = texture;
  
  						} );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    let value = mesh.material.uniforms[ 'depth' ].value;
    				value += depthStep;
    				if ( value > 109.0 || value < 0.0 ) {
    					if ( value > 1.0 ) value = 109.0 * 2.0 - value;
    					if ( value < 0.0 ) value = - value;
    					depthStep = - depthStep;
    				}
    				mesh.material.uniforms[ 'depth' ].value = value;
    {
    // Step 1 - Render the input DataArrayTexture into render target
    				renderTo2DArray();
    				// Step 2 - Renders the scene containing the plane with a material
    				// sampling the render target texture.
    }
    				stats.update();
  })
  
  			/**
  			 * Renders the 2D array into the render target `renderTarget`.
  			 */
  			function renderTo2DArray() {
  
  				const layer = Math.floor( mesh.material.uniforms[ 'depth' ].value );
  				postProcessMaterial.uniforms.uDepth.value = layer;
  				renderer.setRenderTarget( renderTarget, layer );
  				renderer.render( postProcessScene, postProcessCamera );
  				renderer.setRenderTarget( null );
  
  			}
  
  			function render() {
  
  				// Step 1 - Render the input DataArrayTexture into render target
  				renderTo2DArray();
  
  				// Step 2 - Renders the scene containing the plane with a material
  				// sampling the render target texture.
  
  
  			}
  
  		
}
</script>
