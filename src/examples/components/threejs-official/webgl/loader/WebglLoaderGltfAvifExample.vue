<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[1.5, 4, 9]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader +\n\t\t\t<a href=\"https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_avif\" target=\"_blank\" rel=\"noopener\" >EXT_texture_avif</a><br />\n\t\t\tForest House by <a href=\"https://sketchfab.com/peachyroyalty\" target=\"_blank\" rel=\"noopener\">peachyroyalty</a><br />"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  			render();
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xf6eedc );
  
  				//
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  				loader.setPath( ASSET_HOST + 'models/gltf/AVIFTest/' );
  				loader.load( 'forest_house.glb', function ( gltf ) {
  
  					scene.add( gltf.scene );
  
  					render();
  
  				} );
  
  				//
  
  				
  
  
  
  
  
  				controls.addEventListener( 'change', render );
  				controls.target.set( 0, 2, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  		
}
</script>
