<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[1, 2, 3]"
    :camera-options="{ fov: 50, near: 1, far: 100 }"
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
import { pass, luminance, saturation } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Difference</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			const params = {
  				speed: 0
  			};
  
  			let renderPipeline;
  			let timer, mesh;
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  				//
  
  				
  
  
  
  				scene.fog = new THREE.Fog( 0x0487e2, 7, 25 );
  				scene.background = new THREE.Color( 0x0487e2 );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/crate.gif' );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const geometry = new THREE.BoxGeometry();
  				const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera );
  
  				const currentTexture = scenePass.getTextureNode();
  				const previousTexture = scenePass.getPreviousTextureNode();
  
  				const frameDiff = previousTexture.sub( currentTexture ).abs();
  
  				const saturationAmount = luminance( frameDiff ).mul( 1000 ).clamp( 0, 3 );
  
  				renderPipeline.outputNode = saturation( currentTexture, saturationAmount );
  
  				//
  
  				
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.enableDamping = true;
  				controls.dampingFactor = 0.01;
  
  				
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( params, 'speed', 0, 2 );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				mesh.rotation.y += timer.getDelta() * 5 * params.speed;
    				renderPipeline.render();
  })
  
  		
}
</script>
