<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.9, 0.41, -0.89]"
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

<script setup lang="ts">
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md\" target=\"_blank\" rel=\"noopener\">EXT_mesh_gpu_instancing</a><br />\n\t\t\tBattle Damaged Sci-fi Helmet by\n\t\t\t<a href=\"https://sketchfab.com/theblueturtle_\" target=\"_blank\" rel=\"noopener\">theblueturtle_</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=royal_esplanade\" target=\"_blank\" rel=\"noopener\">Royal Esplanade</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  			render();
  
  			
  
  
  				
  
  				
  
  
  				
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  						render();
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/DamagedHelmet/glTF-instancing/' );
  						loader.load( 'DamagedHelmetGpuInstancing.gltf', function ( gltf ) {
  
  							scene.add( gltf.scene );
  
  							render();
  
  						} );
  
  					} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 0.2;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0.25, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
