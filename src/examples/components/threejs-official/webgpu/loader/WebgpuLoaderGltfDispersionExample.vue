<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.1, 0.05, 0.15]"
    :camera-options="{ fov: 45, near: 0.01, far: 5 }"
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

<script setup>
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

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>glTF + Dispersion</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ReinhardToneMapping; // TODO: Add THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  				const hdrTexture = await new HDRLoader().setPath( ASSET_HOST + 'textures/equirectangular/' ).loadAsync( 'pedestrian_overpass_1k.hdr' );
  				hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  
  				
  				scene.backgroundBlurriness = 0.5;
  				scene.environment = hdrTexture;
  				scene.background = hdrTexture;
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/DispersionTest.glb' );
  
  				scene.add( gltf.scene );
  
  
  				controls.minDistance = 0.1;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
