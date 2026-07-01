<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-4, 2, 6]"
    :camera-options="{ fov: 45, near: 0.1, far: 40 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Fn, mix } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Opacity Shadow Map</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  			async 
  
  
  				
  
  				
  
  
  				
  
  
  				renderer.toneMapping = THREE.AgXToneMapping;
  				renderer.toneMappingExposure = 1.5;
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.transmitted = true;
  				renderer.inspector = new Inspector();
  
  
  				
  				scene.background = new THREE.Color( 0x9e9eff );
  
  				// light + shadow
  
  				const hemi = new THREE.AmbientLight( 0xffffff, .5 );
  				scene.add( hemi );
  
  				const dirLight = new THREE.DirectionalLight( 0x6666ff, 10 );
  				dirLight.position.set( 3, 5, 17 );
  				dirLight.castShadow = true;
  				dirLight.shadow.camera.near = 0.1;
  				dirLight.shadow.camera.far = 50;
  				dirLight.shadow.camera.right = 5;
  				dirLight.shadow.camera.left = - 5;
  				dirLight.shadow.camera.top	= 5;
  				dirLight.shadow.camera.bottom = - 5;
  				dirLight.shadow.mapSize.width = 2048;
  				dirLight.shadow.mapSize.height = 2048;
  				dirLight.shadow.radius = 4;
  
  				dirLight.shadow.autoUpdate = false;
  				dirLight.shadow.needsUpdate = true;
  
  				scene.add( dirLight );
  
  				//
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/DragonAttenuation.glb' );
  				gltf.scene.position.set( 0, 0, - .5 );
  
  				const floor = gltf.scene.children[ 0 ];
  				floor.scale.x += 4;
  				floor.scale.y += 4;
  
  				const dragon = gltf.scene.children[ 1 ];
  				dragon.position.set( - 1.5, - 0.8, 1 );
  
  				const dragon2 = dragon.clone();
  				dragon2.material = dragon.material.clone();
  				dragon2.material.attenuationColor = new THREE.Color( 0xff0000 );
  				dragon2.position.x += 4;
  				gltf.scene.add( dragon2 );
  
  				// shadow node
  
  				const customShadow = Fn( ( [ color, opacity = 1 ] ) => {
  
  					//return vec4( color, opacity ); // opacity by blending
  					return mix( 1, color, opacity ); // opacity by color
  
  				} );
  
  				// apply shadow
  
  				floor.receiveShadow = true;
  
  				dragon.castShadow = dragon2.castShadow = true;
  				dragon.receiveShadow = dragon2.receiveShadow = true;
  
  				dragon.material.castShadowNode = customShadow( dragon.material.attenuationColor );
  				dragon2.material.castShadowNode = customShadow( dragon2.material.attenuationColor );
  
  				//
  
  				scene.add( gltf.scene );
  
  
  				controls.minDistance = 0.1;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
