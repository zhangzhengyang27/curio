<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.75, 0.7, 1.25]"
    :camera-options="{ fov: 45, near: 0.1, far: 20 }"
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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_sheen\" target=\"_blank\" rel=\"noopener\">KHR_materials_sheen</a><br />\n\t\t\tSheen Chair from <a href=\"https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/SheenChair\" target=\"_blank\" rel=\"noopener\">glTF-Sample-Models</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  				
  
  
  				
  
  				// model
  
  				new GLTFLoader()
  					.setPath( ASSET_HOST + 'models/gltf/' )
  					.load( 'SheenChair.glb', function ( gltf ) {
  
  						scene.add( gltf.scene );
  
  						const object = gltf.scene.getObjectByName( 'SheenChair_fabric' );
  
  						const gui = new GUI();
  
  						gui.add( object.material, 'sheen', 0, 1 );
  						gui.open();
  
  					} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.background = new THREE.Color( 0xbbbbbb );
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0.35, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function animate() {
  
  				controls.update(); // required if damping enabled
  
  
  
  			}
  
  		
}
</script>
