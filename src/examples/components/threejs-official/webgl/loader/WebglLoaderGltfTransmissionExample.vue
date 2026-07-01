<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0.4, 0.7]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
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
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission\" target=\"_blank\" rel=\"noopener\">KHR_materials_transmission</a><br />\n\t\t\tIridescent Dish With Olives by <a href=\"https://github.com/echadwick-wayfair\" target=\"_blank\" rel=\"noopener\">Eric Chadwick</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=royal_esplanade\" target=\"_blank\" rel=\"noopener\">Royal Esplanade</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let timer, mixer;
  
  			
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  				
  
  
  				
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.backgroundBlurriness = 0.35;
  
  						scene.environment = texture;
  
  						// model
  
  						new GLTFLoader()
  							.setPath( ASSET_HOST + 'models/gltf/' )
  							.setDRACOLoader( new DRACOLoader().setDecoderPath( DRACO_GLTF_CONFIG ) )
  							.load( 'IridescentDishWithOlives.glb', function ( gltf ) {
  
  								mixer = new THREE.AnimationMixer( gltf.scene );
  								mixer.clipAction( gltf.animations[ 0 ] ).play();
  
  								scene.add( gltf.scene );
  
  							} );
  
  					} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  				
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = - 0.75;
  				controls.enableDamping = true;
  				controls.minDistance = 0.5;
  				controls.maxDistance = 1;
  				controls.target.set( 0, 0.1, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				if ( mixer ) mixer.update( timer.getDelta() );
  })
  
  		
}
</script>
