<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.35, -0.2, 0.35]"
    :camera-options="{ fov: 40, near: 0.01, far: 10 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_anisotropy\" target=\"_blank\" rel=\"noopener\">KHR_materials_anisotropy</a><br />\n\t\t\tAnisotropy Barn Lamp from <a href=\"https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/AnisotropyBarnLamp\" target=\"_blank\" rel=\"noopener\">glTF-Sample-Models</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=royal_esplanade\" target=\"_blank\" rel=\"noopener\">Royal Esplanade</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1.35;
  
  
  				
  
  				
  
  
  				
  				controls.target.set( 0, - 0.08, 0.11 );
  				controls.minDistance = 0.1;
  				controls.maxDistance = 2;
  				controls.addEventListener( 'change', render );
  				controls.update();
  
  				const hdrLoader = new UltraHDRLoader().setPath( ASSET_HOST + 'textures/equirectangular/' );
  				const gltfLoader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/' );
  
  				const [ texture, gltf ] = await Promise.all( [
  					hdrLoader.loadAsync( 'royal_esplanade_2k.hdr.jpg' ),
  					gltfLoader.loadAsync( 'AnisotropyBarnLamp.glb' ),
  				] );
  
  				// environment
  
  				texture.mapping = THREE.EquirectangularReflectionMapping;
  
  				scene.background = texture;
  				scene.backgroundBlurriness = 0.5;
  				scene.environment = texture;
  
  				// model
  
  				scene.add( gltf.scene );
  
  				render();
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
