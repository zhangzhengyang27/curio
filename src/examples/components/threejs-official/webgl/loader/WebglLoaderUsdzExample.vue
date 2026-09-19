<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0.75, -1.5]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
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
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { USDLoader } from 'three/examples/jsm/loaders/USDLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - USDZLoader"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  
  				
  
  				const hdrLoader = new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' );
  
  				const usdzLoader = new USDLoader()
  					.setPath( ASSET_HOST + 'models/usdz/' );
  
  				const [ texture, model ] = await Promise.all( [
  					hdrLoader.loadAsync( 'venice_sunset_1k.hdr' ),
  					usdzLoader.loadAsync( 'saeukkang.usdz' ),
  				] );
  
  				// environment
  
  				texture.mapping = THREE.EquirectangularReflectionMapping;
  
  				scene.background = texture;
  				scene.backgroundBlurriness = 0.5;
  				scene.environment = texture;
  
  				// model
  
  				model.position.y = 0.25;
  				model.position.z = - 0.25;
  				scene.add( model );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 2.0;
  
  
  
  				controls.minDistance = 1;
  				controls.maxDistance = 8;
  				// controls.target.y = 15;
  				// controls.update();
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
