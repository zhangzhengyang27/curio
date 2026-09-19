<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    custom-render
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let composer;
  			let mesh;
  
  			let afterimagePass;
  
  			const params = {
  
  				enable: true
  
  			};
  
  			
  
  
  				
  
  
  				camera.position.z = 400;
  
  				
  				scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
  
  				const geometry = new THREE.BoxGeometry( 150, 150, 150, 2, 2, 2 );
  				const material = new THREE.MeshNormalMaterial();
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				// postprocessing
  
  				composer = new EffectComposer( renderer );
  				composer.addPass( new RenderPass( scene, camera ) );
  
  				afterimagePass = new AfterimagePass();
  				composer.addPass( afterimagePass );
  
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  				
  
  				gui = new GUI( { title: 'Damp setting' } );
  				gui.add( afterimagePass, 'damp', 0, 1 ).step( 0.001 );
  				gui.add( params, 'enable' );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    mesh.rotation.x += 0.005;
    				mesh.rotation.y += 0.01;
    				afterimagePass.enabled = params.enable;
    				composer.render();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
