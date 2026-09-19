<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    custom-render
    :camera-options="{ fov: 70, near: 0.1, far: 10 }"
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
import { texture, uniform, saturation, hue } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>WebGPU RTT</span>"
const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			const mouse = new THREE.Vector2();
  
  			let quadMesh, renderTarget;
  
  			let box;
  
  			const dpr = window.devicePixelRatio;
  
  			
  
  
  				
  				camera.position.z = 3;
  
  				
  				scene.background = new THREE.Color( 0x0066FF );
  
  				// textured mesh
  
  				const loader = new THREE.TextureLoader();
  				const uvTexture = loader.load( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  
  				const geometryBox = new THREE.BoxGeometry();
  				const materialBox = new THREE.MeshBasicNodeMaterial();
  				materialBox.colorNode = texture( uvTexture );
  
  				//
  
  				box = new THREE.Mesh( geometryBox, materialBox );
  				scene.add( box );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  				renderTarget = new THREE.RenderTarget( (__stage.container?.clientWidth || window.innerWidth) * dpr, (__stage.container?.clientHeight || window.innerHeight) * dpr );
  
  				window.addEventListener( 'mousemove', onWindowMouseMove );
  				
  
  				// FX
  
  				// modulate the final color based on the mouse position
  
  				const screenFXNode = uniform( mouse );
  
  				const materialFX = new THREE.MeshBasicNodeMaterial();
  
  				const scenePassTexture = texture( renderTarget.texture ).toInspector( 'Scene Pass' );
  				materialFX.colorNode = hue( saturation( scenePassTexture.rgb, screenFXNode.x.oneMinus() ), screenFXNode.y );
  
  				quadMesh = new THREE.QuadMesh( materialFX );
  				quadMesh.name = 'Post-Processing';
  
  			
  
  
  			function onWindowMouseMove( e: any ) {
  
  				mouse.x = e.offsetX / (__stage.container?.clientWidth || window.innerWidth);
  				mouse.y = e.offsetY / (__stage.container?.clientHeight || window.innerHeight);
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    box.rotation.x += 0.01;
    				box.rotation.y += 0.02;
    				renderer.setRenderTarget( renderTarget );
    				renderer.setRenderTarget( null );
    				quadMesh.render( renderer );
  })
  
  		
}
</script>
