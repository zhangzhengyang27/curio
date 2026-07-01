<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 0.1, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { mrt, output, pass, velocity } from 'three/tsl';
import { traa } from 'three/examples/jsm/tsl/display/TRAANode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>TRAA</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let renderPipeline;
  			let index = 0;
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				camera.position.z = 2.5;
  
  				
  
  				const geometry = new THREE.BoxGeometry();
  				const material1 = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
  
  				const mesh1 = new THREE.Mesh( geometry, material1 );
  				mesh1.position.x = - 1;
  				scene.add( mesh1 );
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/brick_diffuse.jpg' );
  				texture.minFilter = THREE.NearestFilter;
  				texture.magFilter = THREE.NearestFilter;
  				texture.generateMipmaps = false;
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const material2 = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh2 = new THREE.Mesh( geometry, material2 );
  				mesh2.position.x = 1;
  				scene.add( mesh2 );
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				const scenePass = pass( scene, camera );
  				scenePass.setMRT( mrt( {
  					output: output,
  					velocity: velocity
  				} ) );
  
  				const scenePassColor = scenePass.getTextureNode( 'output' ).toInspector( 'Color' );
  				const scenePassDepth = scenePass.getTextureNode( 'depth' ).toInspector( 'Depth', () => {
  
  					return scenePass.getLinearDepthNode();
  
  				} );
  				const scenePassVelocity = scenePass.getTextureNode( 'velocity' ).toInspector( 'Velocity' );
  
  				const traaNode = traa( scenePassColor, scenePassDepth, scenePassVelocity, camera );
  			
  				renderPipeline.outputNode = traaNode;
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    index ++;
    				if ( Math.round( index / 200 ) % 2 === 0 ) {
    					for ( let i = 0; i < scene.children.length; i ++ ) {
    						const child = scene.children[ i ];
    						child.rotation.x += 0.005;
    						child.rotation.y += 0.01;
    					}
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
