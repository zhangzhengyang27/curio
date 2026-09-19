<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
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
import { pass } from 'three/tsl';
import { dotScreen } from 'three/examples/jsm/tsl/display/DotScreenNode.js';
import { rgbShift } from 'three/examples/jsm/tsl/display/RGBShiftNode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Post Processing</span>"
function onReady(__stage: any) {
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let renderPipeline;
  			let object;
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  				camera.position.z = 400;
  
  
  				scene.background = new THREE.Color( 0x000000 );
  				scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
  
  				object = new THREE.Object3D();
  				scene.add( object );
  
  				const geometry = new THREE.SphereGeometry( 1, 4, 4 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
  
  				for ( let i = 0; i < 100; i ++ ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ).normalize();
  					mesh.position.multiplyScalar( Math.random() * 400 );
  					mesh.rotation.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );
  					mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
  					object.add( mesh );
  
  				}
  
  				scene.add( new THREE.AmbientLight( 0xcccccc ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 1, 1, 1 );
  				scene.add( light );
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera );
  				const scenePassColor = scenePass.getTextureNode().toInspector( 'Scene Color' );
  
  				const dotScreenPass = dotScreen( scenePassColor );
  				dotScreenPass.scale.value = 0.3;
  
  				const rgbShiftPass = rgbShift( dotScreenPass );
  				rgbShiftPass.amount.value = 0.001;
  
  				renderPipeline.outputNode = rgbShiftPass;
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    object.rotation.x += 0.005;
    				object.rotation.y += 0.01;
    				renderPipeline.render();
  })
  
  		
}
</script>
