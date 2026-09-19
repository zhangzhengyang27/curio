<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 70, near: 0.1, far: 10 }"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { vec4 } from 'three/tsl';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(__stage: any) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			
  
  
  				// add the dependencies
  
  				const width = 200;
  				const height = 200;
  
  
  				camera.position.z = .72;
  
  
  
  				scene.background = new THREE.Color( 0x222222 );
  
  				const rendererDOM = renderer.domElement;
  
  
  
  
  				renderer.debug.diagnostics.keywords = true;
  
  
  				const material = new THREE.NodeMaterial();
  				material.fragmentNode = vec4( 0, 0, 0, 1 );
  
  				const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( mesh );
  
  				//
  
  				let compiling = false;
  
  				// editor
  
  				(window.require as any).config( { paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs' } } );
  
  				(require as any)( [ 'vs/editor/editor.main' ], () => {
  
  					const options = {
  						shader: 'fragment',
  						outputColorSpace: THREE.SRGBColorSpace,
  						output: 'WGSL',
  						preview: true
  					};
  
  					let timeout: any = null;
  					let rawShader: any = null;
  
  					const editorDOM = document.createElement( 'div' );
  					editorDOM.style.cssText = 'position:absolute;top:0;right:0;width:40%;height:100%;';
  					__stage.overlay?.appendChild( editorDOM );
  					const resultDOM = document.createElement( 'div' );
  					resultDOM.style.cssText = 'position:absolute;bottom:0;right:0;width:40%;height:30%;overflow:auto;color:#0f0;font-size:11px;background:rgba(0,0,0,0.8);';
  					__stage.overlay?.appendChild( resultDOM );
  
  					const tslCode = `// Simple uv.x animation
  
  const { texture, uniform, vec2, vec4, uv, oscSine, time, grayscale } = await import( 'three/tsl' );
  
  const samplerTexture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  samplerTexture.wrapS = THREE.RepeatWrapping;
  samplerTexture.colorSpace = THREE.SRGBColorSpace;
  
  const scaledTime = time.mul( .5 ); // .5 is speed
  const uv0 = uv();
  const animateUv = vec2( uv0.x.add( oscSine( scaledTime ) ), uv0.y );
  
  // .setName() is optional
  const myMap = texture( samplerTexture, animateUv ).rgb.setName( 'myTexture' );
  const myColor = uniform( new THREE.Color( 0x0066ff ) ).setName( 'myColor' );
  const opacity = .7;
  
  const desaturatedMap = grayscale( myMap.rgb );
  
  const finalColor = desaturatedMap.add( myColor );
  
  output = vec4( finalColor, opacity );
  `;
  
  					const editor = (window as any).monaco.editor.create( editorDOM, {
  						value: tslCode,
  						language: 'javascript',
  						theme: 'vs-dark',
  						automaticLayout: true,
  						minimap: { enabled: false }
  					} );
  
  					const result = (window as any).monaco.editor.create( resultDOM, {
  						value: '',
  						language: 'wgsl',
  						theme: 'vs-dark',
  						automaticLayout: true,
  						readOnly: true,
  						minimap: { enabled: false }
  					} );
  
  					const showCode = () => {
  
  						result.setValue( rawShader[ options.shader + 'Shader' ] );
  						result.revealLine( 1 );
  
  					};
  
  					const webGLRenderer = new THREE.WebGPURenderer( { forceWebGL: true } );
  					(webGLRenderer.debug as any).diagnostics.keywords = true;
  
  					const build = async () => {
  
  						try {
  
  							const AsyncFunction = async function () {}.constructor;
  
  							const tslCode = `let output = null;\n${ editor.getValue() }\nreturn { output };`;
  							const nodes = await ( new (AsyncFunction as any)( 'THREE', tslCode )( THREE ) );
  
  							mesh.material.fragmentNode = nodes.output;
  							mesh.material.needsUpdate = true;
  
  							compiling = true;
  
  							mesh.visible = false;
  
  							if ( options.output === 'WGSL' ) {
  
  								rawShader = await renderer.debug.getShaderAsync( scene, camera, mesh );
  
  
  							} else if ( options.output === 'GLSL ES 3.0' ) {
  
  								rawShader = await webGLRenderer.debug.getShaderAsync( scene, camera, mesh );
  
  							}
  
  							mesh.visible = true;
  
  							compiling = false;
  
  							showCode();
  
  							// extra debug info
  
  							/*const style = 'background-color: #333; color: white; font-style: italic; border: 2px solid #777; font-size: 22px;';
  
  							console.log( '%c  [ WGSL ] Vertex Shader      ', style );
  							console.log( rawShader.vertexShader );
  							console.log( '%c  [ WGSL ] Fragment Shader    ', style );
  							console.log( rawShader.fragmentShader );/**/
  
  						} catch ( e: any ) {
  
  							result.setValue( 'Error: ' + e.message );
  
  						}
  
  					};
  
  					build();
  
  					editor.getModel().onDidChangeContent( () => {
  
  						if ( timeout ) clearTimeout( timeout );
  
  						timeout = setTimeout( build, 1000 );
  
  					} );
  
  					// gui
  
  					gui = new GUI();
  
  					gui.add( options, 'output', [ 'WGSL', 'GLSL ES 3.0' ] ).onChange( build );
  					gui.add( options, 'shader', [ 'vertex', 'fragment' ] ).onChange( showCode );
  
  					gui.add( options, 'outputColorSpace', [ THREE.LinearSRGBColorSpace, THREE.SRGBColorSpace ] ).onChange( ( value: any ) => {
  
  						renderer.outputColorSpace = value;
  
  						build();
  
  					} );
  
  					gui.add( options, 'preview' ).onChange( ( value: any ) => {
  
  						rendererDOM.style.display = value ? '' : 'none';
  
  					} );
  
  				} );
  
  			
  
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
