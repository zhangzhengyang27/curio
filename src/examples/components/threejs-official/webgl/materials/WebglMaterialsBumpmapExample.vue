<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 0.1, far: 100 }"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - bump mapping without tangents<br/>\n\t\t\t<a href=\"https://casual-effects.com/data/\" target=\"_blank\" rel=\"noopener\">Lee Perry-Smith</a> head"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let container, loader;
  
  
  			let mesh;
  
  			let spotLight;
  
  			const params = {
  				enableBumpMap: true
  			};
  
  			
  
  
  				//
  
  				
  				camera.position.z = 12;
  
  				
  				scene.background = new THREE.Color( 0x060708 );
  
  				// LIGHTS
  
  				scene.add( new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 ) );
  
  				spotLight = new THREE.SpotLight( 0xffffde, 200 );
  				spotLight.position.set( 3.5, 0, 7 );
  				scene.add( spotLight );
  
  				spotLight.castShadow = true;
  
  				spotLight.shadow.mapSize.width = 2048;
  				spotLight.shadow.mapSize.height = 2048;
  
  				spotLight.shadow.camera.near = 2;
  				spotLight.shadow.camera.far = 15;
  
  				spotLight.shadow.camera.fov = 40;
  
  				spotLight.shadow.bias = - 0.005;
  
  				//
  
  				const mapHeight = new THREE.TextureLoader().load( ASSET_HOST + 'models/gltf/LeePerrySmith/Infinite-Level_02_Disp_NoSmoothUV-4096.jpg' );
  
  				const material = new THREE.MeshPhongMaterial( {
  					color: 0x9c6e49,
  					specular: 0x666666,
  					shininess: 25,
  					bumpMap: mapHeight,
  					bumpScale: 10
  				} );
  
  				loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					createScene( gltf.scene.children[ 0 ].geometry, 1, material );
  
  				} );
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  				// EVENTS
  
  				
  
  				// GUI
  
  				gui = new GUI();
  
  				gui.add( params, 'enableBumpMap' ).name( 'enable bump map' ).onChange( ( value ) => {
  
  					mesh.material.bumpMap = ( value === true ) ? mapHeight : null;
  					mesh.material.needsUpdate = true;
  
  				} );
  				gui.add( material, 'bumpScale', 0, 40 ).name( 'bump scale' );
  				gui.open();
  
  				// CONTROLS
  
  				
  				controls.minDistance = 8;
  				controls.maxDistance = 50;
  				controls.enablePan = false;
  				controls.enableDamping = true;
  
  			
  
  
  			function createScene( geometry, scale, material ) {
  
  				mesh = new THREE.Mesh( geometry, material );
  
  				mesh.position.y = - 0.5;
  				mesh.scale.set( scale, scale, scale );
  
  				mesh.castShadow = true;
  				mesh.receiveShadow = true;
  
  				scene.add( mesh );
  
  			}
  
  			//
  
  			
  
  			//
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
