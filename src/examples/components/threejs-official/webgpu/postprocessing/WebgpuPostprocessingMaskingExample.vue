<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 1, far: 1000 }"
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
import { pass, texture } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Masking</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let renderPipeline;
  			let box, torus;
  
  			
  
  
  				// scene
  
  				const baseScene = new THREE.Scene();
  				baseScene.background = new THREE.Color( 0xe0e0e0 );
  
  				const maskScene1 = new THREE.Scene();
  				box = new THREE.Mesh( new THREE.BoxGeometry( 4, 4, 4 ) );
  				maskScene1.add( box );
  
  				const maskScene2 = new THREE.Scene();
  				torus = new THREE.Mesh( new THREE.TorusGeometry( 3, 1, 16, 32 ) );
  				maskScene2.add( torus );
  
  				
  				camera.position.z = 10;
  
  				// textures
  
  				const texture1 = new THREE.TextureLoader().load( ASSET_HOST + 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg' );
  				texture1.colorSpace = THREE.SRGBColorSpace;
  				texture1.minFilter = THREE.LinearFilter;
  				texture1.generateMipmaps = false;
  				texture1.flipY = false;
  
  				const texture2 = new THREE.TextureLoader().load( ASSET_HOST + 'textures/2294472375_24a3b8ef46_o.jpg' );
  				texture2.colorSpace = THREE.SRGBColorSpace;
  				texture2.flipY = false;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  
  				// post processing
  
  				const base = pass( baseScene, camera );
  				const sceneMask1 = pass( maskScene1, camera ).a;
  				const sceneMask2 = pass( maskScene2, camera ).a;
  
  				let compose: any = base;
  				compose = sceneMask1.mix( compose, texture( texture1 ) );
  				compose = sceneMask2.mix( compose, texture( texture2 ) );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = compose;
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    const time = performance.now() * 0.001 + 6000;
    				box.position.x = Math.cos( time / 1.5 ) * 2;
    				box.position.y = Math.sin( time ) * 2;
    				box.rotation.x = time;
    				box.rotation.y = time / 2;
    				torus.position.x = Math.cos( time ) * 2;
    				torus.position.y = Math.sin( time / 1.5 ) * 2;
    				torus.rotation.x = time;
    				torus.rotation.y = time / 2;
    				renderPipeline.render();
  })
  
  		
}
</script>
