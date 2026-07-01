<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 50 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { If, vec4, uv, ivec2, texture, Fn } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Texture Gather</span>"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			// WebGPU Backend
  			init();
  
  			// WebGL Backend
  			init( true );
  
  			async function init( forceWebGL = false ) {
  
  				const aspect = ( (__stage.container?.clientWidth || window.innerWidth) / 2 ) / (__stage.container?.clientHeight || window.innerHeight);
  
  				camera.position.z = 2;
  
  
  
  				// texture
  
  				const material = new THREE.MeshBasicNodeMaterial( { color: 0xffffff } );
  
  				const colorNode = texture();
  				const depthNode = texture();
  
  				material.colorNode = Fn( () => {
  
  					const color = vec4( 1 ).toVar();
  
  					const vuv = uv().toVar();
  
  					If( vuv.y.greaterThan( 0.5 ), () => {
  
  						color.assign(
  							colorNode.sample( vuv.mul( 10 ) ).offset( ivec2( 0, 7 ) ).gather( 0 )
  						);
  
  					} ).Else( () => {
  
  						color.assign(
  							depthNode.sample( vuv ).offset( ivec2( 0, 7 ) ).gather( 0 ).compare( 1 )
  						);
  
  					} );
  
  					return color;
  
  				} )();
  
  				//
  
  				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), material );
  				scene.add( plane );
  
  
  
  
  				renderer.domElement.style.position = 'absolute';
  				renderer.domElement.style.top = '0';
  				renderer.domElement.style.left = '0';
  				renderer.domElement.style.width = '50%';
  				renderer.domElement.style.height = '100%';
  
  				if ( forceWebGL ) {
  
  					renderer.domElement.style.left = '50%';
  
  					scene.background = new THREE.Color( 0x212121 );
  
  				} else {
  
  					scene.background = new THREE.Color( 0x313131 );
  
  				}
  
  				//
  
  				const depthTexture = new THREE.DepthTexture();
  				depthTexture.compareFunction = THREE.LessEqualCompare;
  				const rt = new THREE.RenderTarget( 100, 100, {
  					depthTexture,
  					generateMipmaps: true,
  					minFilter: THREE.LinearMipmapLinearFilter
  				} );
  				rt.texture.wrapS = THREE.RepeatWrapping;
  				rt.texture.wrapT = THREE.RepeatWrapping;
  
  				const cameraZ = 2.5;
  				const rtScene = new THREE.Scene();
  				rtScene.background = new THREE.Color( 0x808080 );
  				const rtCamera = new THREE.PerspectiveCamera( 50, 1, cameraZ - 0.5 * Math.sqrt( 3 ), cameraZ + 0.5 * Math.sqrt( 3 ) );
  				rtCamera.position.z = cameraZ;
  
  				const dirLight = new THREE.DirectionalLight();
  				dirLight.position.set( 1, 1, 0 );
  				rtScene.add( dirLight );
  				rtScene.add( new THREE.AmbientLight( 0xffffff, 0.1 ) );
  
  				const box = new THREE.Mesh(
  					new THREE.BoxGeometry(),
  					new THREE.MeshStandardNodeMaterial( { color: 0xff0000 } )
  				);
  				box.rotation.set( Math.PI / 4, Math.PI / 4, 0 );
  				rtScene.add( box );
  
  				renderer.setRenderTarget( rt );
  				renderer.render( rtScene, rtCamera );
  				renderer.setRenderTarget( null );
  
  				colorNode.value = rt.texture;
  				depthNode.value = rt.depthTexture;
  
  				//
  
  				function animate() {
  
  
  
  				}
  
  				
  
  				
  
  			}
  
  		
}
</script>
