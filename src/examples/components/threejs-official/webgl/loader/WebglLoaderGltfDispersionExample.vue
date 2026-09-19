<template>
  <ExampleScene
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
  </ExampleScene>
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_dispersion\" target=\"_blank\" rel=\"noopener\">KHR_materials_dispersion</a><br />"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

	  
	  
	  
	  				
	  				
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				
  				scene.backgroundBlurriness = 0.5;
  
  				const env = pmremGenerator.fromScene( environment, 0.04 ).texture;
  				scene.background = env;
  				scene.environment = env;
  				environment.dispose();
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/DispersionTest.glb' );
  
  				scene.add( gltf.scene );
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 0.1;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
