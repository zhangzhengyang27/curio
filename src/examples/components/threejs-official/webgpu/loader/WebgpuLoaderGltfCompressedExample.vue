<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[2, 2, 2]"
    :camera-options="{ fov: 50, near: 1, far: 20 }"
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>glTF + Compression Extensions</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xEEEEEE );
  
  				//lights
  
  				const light = new THREE.PointLight( 0xffffff );
  				light.power = 1300;
  				camera.add( light );
  				scene.add( camera );
  
  				//renderer
  
  				
  
  
  				renderer.toneMapping = THREE.ReinhardToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  				controls.minDistance = 3;
  				controls.maxDistance = 6;
  				controls.update();
  
  				const ktx2Loader = await new KTX2Loader()
  					.detectSupport( renderer );
  
  				const loader = new GLTFLoader();
  				loader.setKTX2Loader( ktx2Loader );
  				loader.setMeshoptDecoder( MeshoptDecoder );
  				loader.load( ASSET_HOST + 'models/gltf/coffeemat.glb', function ( gltf ) {
  
  					const gltfScene = gltf.scene;
  					gltfScene.position.y = - .8;
  					gltfScene.scale.setScalar( .01 );
  
  					scene.add( gltfScene );
  
  				} );
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
