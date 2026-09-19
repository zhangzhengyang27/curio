<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.35, 0.05, 0.35]"
    :camera-options="{ fov: 50, near: 0.05, far: 20 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>glTF + Iridescence</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			// init 函数体已在 HTML→Vue 转换时内联进 onReady，此处恢复引用避免 ReferenceError
			function init() {
				return Promise.resolve();
			}

			init().catch( function ( err: any ) {
  
  				console.error( err );
  
  			} );
  
  
  
  				
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				
  
  				
  
  
  				
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = - 0.5;
  				controls.target.set( 0, 0.2, 0 );
  				controls.update();
  
  				const hdrLoader = new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' );
  
  				const gltfLoader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/' );
  
  				const [ texture, gltf ] = await Promise.all( [
  					hdrLoader.loadAsync( 'venice_sunset_1k.hdr' ),
  					gltfLoader.loadAsync( 'IridescenceLamp.glb' ),
  				] );
  
  				// environment
  
  				texture.mapping = THREE.EquirectangularReflectionMapping;
  
  				scene.background = texture;
  				scene.environment = texture;
  
  				// model
  
  				scene.add( gltf.scene );
  
  			function render() {
  
  				controls.update();
  
  
  			}
  
  		
}
</script>
