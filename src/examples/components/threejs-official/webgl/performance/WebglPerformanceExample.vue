<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[60, 60, 60]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Performance<br />\n\t\t\tDungeon - Low Poly Game Level Challenge by\n\t\t\t<a href=\"https://sketchfab.com/warkarma\" target=\"_blank\" rel=\"noopener\">Warkarma</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=royal_esplanade\" target=\"_blank\" rel=\"noopener\">Royal Esplanade</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  
  			
  
  
  				
  
  				
  
  
  				
  
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.environment = texture;
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/' );
  						loader.load( 'dungeon_warkarma.glb', async function ( gltf ) {
  
  							const model = gltf.scene;
  
  							// wait until the model can be added to the scene without blocking due to shader compilation
  
  							await renderer.compileAsync( model, camera, scene );
  
  							scene.add( model );
  			
  						} );
  
  					} );
  
  			
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 60;
  				controls.target.set( 0, 0, - 0.2 );
  				controls.update();
  
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
  })
  
  		
}
</script>
