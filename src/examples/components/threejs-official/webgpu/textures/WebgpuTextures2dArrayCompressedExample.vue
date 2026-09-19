<template>
  <WebGPUExampleScene
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
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture, uniform, uv } from 'three/tsl';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Texture Gradient</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			//
  
  			let mesh: any, timer;
  
  			const depth = uniform( 0 );
  
  			const planeWidth = 50;
  			const planeHeight = 25;
  
  			let depthStep = 1;
  
  			
  
  
  				
  
  				
  				camera.position.z = 70;
  
  				
  
  				//
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  
  				//
  
  				const ktx2Loader = new KTX2Loader();
  				ktx2Loader.detectSupport( renderer );
  
  				ktx2Loader.load( ASSET_HOST + 'textures/spiritedaway.ktx2', function ( texturearray ) {
  
  					const material = new THREE.NodeMaterial();
  
  					material.colorNode = texture( texturearray, uv().flipY() ).depth( depth );
  					const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
  
  					mesh = new THREE.Mesh( geometry, material );
  
  					scene.add( mesh );
  
  				} );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				if ( mesh ) {
    					const delta = timer.getDelta() * 10;
    					depthStep += delta;
    					const value = depthStep % 5;
    					depth.value = value;
    				}
    {
    }
  })
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
