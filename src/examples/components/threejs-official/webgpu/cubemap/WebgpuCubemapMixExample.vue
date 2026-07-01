<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1.8, 0.6, 2.7]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { mix, oscSine, time, pmremTexture, float } from 'three/tsl';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Cubemap Mix</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  			async 
  
  
  				
  
  
  				
  
  				const hdrUrls = [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr' ];
  				const cube1Texture = new HDRCubeTextureLoader()
  					.setPath( './textures/cube/pisaHDR/' )
  					.load( hdrUrls );
  
  				cube1Texture.generateMipmaps = true;
  				cube1Texture.minFilter = THREE.LinearMipmapLinearFilter;
  
  				const cube2Urls = [ 'dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg' ];
  				const cube2Texture = await new THREE.CubeTextureLoader()
  					.setPath( './textures/cube/MilkyWay/' )
  					.loadAsync( cube2Urls );
  
  				cube2Texture.generateMipmaps = true;
  				cube2Texture.minFilter = THREE.LinearMipmapLinearFilter;
  
  				scene.environmentNode = mix( pmremTexture( cube2Texture ), pmremTexture( cube1Texture ), oscSine( time.mul( .1 ) ) );
  
  				scene.backgroundNode = scene.environmentNode.context( {
  					getTextureLevel: () => float( .5 )
  				} );
  
  				const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/DamagedHelmet/glTF/' );
  				const gltf = await loader.loadAsync( 'DamagedHelmet.gltf' );
  
  				scene.add( gltf.scene );
  
  				
  
  
  
  				renderer.toneMapping = THREE.LinearToneMapping;
  				renderer.inspector = new Inspector();
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
