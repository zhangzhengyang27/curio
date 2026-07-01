<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 100, 0]"
    :camera-options="{ fov: 45, near: 1, far: 2000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + compression extensions<br />\n\t\t\t<a href=\"https://sketchfab.com/3d-models/coffeemat-7fb196a40a6e4697aad9ca2f75c8b33d\" target=\"_blank\" rel=\"noopener\">Coffeemat</a> by\n\t\t\t<a href=\"https://sketchfab.com/OFFcours1\" target=\"_blank\" rel=\"noopener\">Roman Red</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  			render();
  
  			
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  				
  
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				
  				scene.background = new THREE.Color( 0xbbbbbb );
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  				environment.dispose();
  
  				const grid = new THREE.GridHelper( 500, 10, 0xffffff, 0xffffff );
  				grid.material.opacity = 0.5;
  				grid.material.depthWrite = false;
  				grid.material.transparent = true;
  				scene.add( grid );
  
  				const ktx2Loader = new KTX2Loader()
  					.detectSupport( renderer );
  
  				const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/' );
  				loader.setKTX2Loader( ktx2Loader );
  				loader.setMeshoptDecoder( MeshoptDecoder );
  				loader.load( 'coffeemat.glb', function ( gltf ) {
  
  					// coffeemat.glb was produced from the source scene using gltfpack:
  					// gltfpack -i coffeemat/scene.gltf -o coffeemat.glb -cc -tc
  					// The resulting model uses EXT_meshopt_compression (for geometry) and KHR_texture_basisu (for texture compression using ETC1S/BasisLZ)
  
  					gltf.scene.position.y = 8;
  
  					scene.add( gltf.scene );
  
  					render();
  
  				} );
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 400;
  				controls.maxDistance = 1000;
  				controls.target.set( 10, 90, - 16 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
