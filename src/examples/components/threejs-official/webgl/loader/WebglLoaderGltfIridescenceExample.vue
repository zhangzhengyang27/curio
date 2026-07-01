<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.35, 0.05, 0.35]"
    :camera-options="{ fov: 50, near: 0.05, far: 20 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence\" target=\"_blank\" rel=\"noopener\">KHR_materials_iridescence</a><br />\n\t\t\tIridescence Lamp from <a href=\"https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/IridescenceLamp\" target=\"_blank\" rel=\"noopener\">glTF-Sample-Models</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=venice_sunset\" target=\"_blank\" rel=\"noopener\">Venice Sunset</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  			init().catch( function ( err ) {
  
  				console.error( err );
  
  			} );
  
  			async 
  
  
  				
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
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  			}
  
  		
}
</script>
