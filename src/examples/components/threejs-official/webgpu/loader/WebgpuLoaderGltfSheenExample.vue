<template>
  <WebGPUExampleScene
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
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>glTF + Anisotropy</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  				
  
  
  				
  				//scene.add( new THREE.DirectionalLight( 0xffffff, 2 ) );
  
  				// model
  
  				new GLTFLoader()
  					.setPath( ASSET_HOST + 'models/gltf/' )
  					.load( 'SheenChair.glb', function ( gltf ) {
  
  						scene.add( gltf.scene );
  
  						const object = gltf.scene.getObjectByName( 'SheenChair_fabric' );
  
  						const gui = renderer.inspector.createParameters( 'SheenChair_fabric' );
  
  						gui.add( (object as any).material, 'sheen', 0, 1 );
  
  					} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  				renderer.inspector = new Inspector();
  
  
  				scene.background = new THREE.Color( 0xAAAAAA );
  
  				new UltraHDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'royal_esplanade_2k.hdr.jpg', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						//scene.backgroundBlurriness = 1; // @TODO: Needs PMREM
  						scene.environment = texture;
  
  					} );
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0.35, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    render();
  })
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
