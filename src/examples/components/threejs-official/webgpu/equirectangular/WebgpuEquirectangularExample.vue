<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[1, 0, 0]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
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
import { texture, equirectUV } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Equirectangular Panorama</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			
  
  
  				
  
  				
  
  
  				const equirectTexture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/2294472375_24a3b8ef46_o.jpg' );
  				equirectTexture.colorSpace = THREE.SRGBColorSpace;
  
  				
  				scene.backgroundNode = texture( equirectTexture, equirectUV(), 0 );
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.autoRotate = true;
  				controls.rotateSpeed = - 0.125; // negative, to track mouse pointer
  				controls.autoRotateSpeed = 1.0;
  
  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( scene, 'backgroundIntensity', 0, 1 ).name( 'background intensity' );
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
