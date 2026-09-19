<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
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
import * as TSL from 'three/tsl';
import Transpiler from 'three/examples/jsm/transpiler/Transpiler.js';
import ShaderToyDecoder from 'three/examples/jsm/transpiler/ShaderToyDecoder.js';
import TSLEncoder from 'three/examples/jsm/transpiler/TSLEncoder.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Shadertoy</span>"
async function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			class ShaderToyNode extends THREE.Node {
	mainImage: any;

  
  				constructor() {
  
  					super( 'vec4' );
  
  					this.mainImage = null;
  
  				}
  
  				transpile( glsl: any, iife = false ) {
  
  					const decoder = new ShaderToyDecoder();
  
  					const encoder = new TSLEncoder();
  					encoder.iife = iife;
  
  					const jsCode = new Transpiler( decoder, encoder ).parse( glsl );
  
  					return jsCode;
  
  				}
  
  				parse( glsl: any ) {
  
  					const jsCode = this.transpile( glsl, true );
  
  					const { mainImage } = new Function( 'return (' + jsCode + ')' )()( TSL );
  
  					this.mainImage = mainImage;
  
  				}
  
  				async parseAsync( glsl: any ) {
  
  					const jsCode = this.transpile( glsl );
  
  					const { mainImage } = await import( `data:text/javascript,${ encodeURIComponent( jsCode ) }` );
  
  					this.mainImage = mainImage;
  
  				}
  
  				setup( builder: any ) {
  
  					if ( this.mainImage === null ) {
  
  						throw new Error( 'ShaderToyNode: .parse() must be called first.' );
  
  					}
  
  					return this.mainImage();
  
  				}
  
  
  			}
  
  			const dpr = window.devicePixelRatio;
  
  			
  
  
  				const example1Code = `
  					void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  						vec2 uv = fragCoord / iResolution.xy;
  						vec3 col = 0.5 + 0.5 * cos( iTime + uv.xyx + vec3( 0, 2, 4 ) );
  						fragColor = vec4( col, 1.0 );
  					}
  				`;
  				const example2Code = `
  					void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  						vec2 uv = ( fragCoord - 0.5 * iResolution.xy ) / iResolution.y;
  						float d = length( uv );
  						vec3 col = vec3( smoothstep( 0.5, 0.49, d ) );
  						col *= 0.5 + 0.5 * cos( iTime + uv.xyx + vec3( 0, 2, 4 ) );
  						fragColor = vec4( col, 1.0 );
  					}
  				`;
  
  				const shaderToy1Node = new ShaderToyNode();
  				shaderToy1Node.parse( example1Code );
  
  				const shaderToy2Node = new ShaderToyNode();
  				shaderToy2Node.parse( example2Code );
  
  				//
  
  				
  				
  
  				const geometry = new THREE.PlaneGeometry( 2, 2 );
  
  				const material = new THREE.MeshBasicNodeMaterial();
  				material.colorNode = TSL.oscSine( TSL.time.mul( .3 ) ).mix( shaderToy1Node as any, shaderToy2Node as any );
  
  				const quad = new THREE.Mesh( geometry, material );
  				scene.add( quad );
  
  				//
  
  				
  
  
  				renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
