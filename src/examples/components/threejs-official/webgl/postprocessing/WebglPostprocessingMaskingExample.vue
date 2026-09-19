<template>
  <ExampleScene
    camera="perspective"
    :clear-color="0xe0e0e0"
    :camera-options="{ fov: 50, near: 1, far: 1000 }"
    custom-render
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass.js';
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let composer;
  			let box, torus;
  
  			
  
  
  				
  				camera.position.z = 10;
  
  				const scene1 = new THREE.Scene();
  				const scene2 = new THREE.Scene();
  
  				box = new THREE.Mesh( new THREE.BoxGeometry( 4, 4, 4 ) );
  				scene1.add( box );
  
  				torus = new THREE.Mesh( new THREE.TorusGeometry( 3, 1, 16, 32 ) );
  				scene2.add( torus );
  
  				
  				renderer.setClearColor( 0xe0e0e0 );
  
  
  				renderer.autoClear = false;
  
  
  				//
  
  				const clearPass = new ClearPass();
  
  				const clearMaskPass = new ClearMaskPass();
  
  				const maskPass1 = new MaskPass( scene1, camera );
  				const maskPass2 = new MaskPass( scene2, camera );
  
  				const texture1 = new THREE.TextureLoader().load( ASSET_HOST + 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg' );
  				texture1.colorSpace = THREE.SRGBColorSpace;
  				texture1.minFilter = THREE.LinearFilter;
  				texture1.generateMipmaps = false;
  				const texture2 = new THREE.TextureLoader().load( ASSET_HOST + 'textures/2294472375_24a3b8ef46_o.jpg' );
  				texture2.colorSpace = THREE.SRGBColorSpace;
  
  				const texturePass1 = new TexturePass( texture1 );
  				const texturePass2 = new TexturePass( texture2 );
  
  				const outputPass = new OutputPass();
  
  				const parameters = {
  					stencilBuffer: true
  				};
  
  				const renderTarget = new THREE.WebGLRenderTarget( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight), parameters );
  
  				composer = new EffectComposer( renderer, renderTarget );
  				composer.addPass( clearPass );
  				composer.addPass( maskPass1 );
  				composer.addPass( texturePass1 );
  				composer.addPass( clearMaskPass );
  				composer.addPass( maskPass2 );
  				composer.addPass( texturePass2 );
  				composer.addPass( clearMaskPass );
  				composer.addPass( outputPass );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    const time = performance.now() * 0.001 + 6000;
    				box.position.x = Math.cos( time / 1.5 ) * 2;
    				box.position.y = Math.sin( time ) * 2;
    				box.rotation.x = time;
    				box.rotation.y = time / 2;
    				torus.position.x = Math.cos( time ) * 2;
    				torus.position.y = Math.sin( time / 1.5 ) * 2;
    				torus.rotation.x = time;
    				torus.rotation.y = time / 2;
    				renderer.clear();
    				composer.render( time );
  })
  
  		
}
</script>
