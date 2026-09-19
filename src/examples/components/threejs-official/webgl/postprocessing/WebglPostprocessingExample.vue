<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    custom-render
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage: any) {
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let composer;
  			let object;
  
  			
  
  
  				
  
  
  				//
  
  				
  				camera.position.z = 400;
  
  
  				scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
  
  				object = new THREE.Object3D();
  				scene.add( object );
  
  				const geometry = new THREE.SphereGeometry( 1, 4, 4 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
  
  				for ( let i = 0; i < 100; i ++ ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ).normalize();
  					mesh.position.multiplyScalar( Math.random() * 400 );
  					mesh.rotation.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );
  					mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
  					object.add( mesh );
  
  				}
  
  				scene.add( new THREE.AmbientLight( 0xcccccc ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 1, 1, 1 );
  				scene.add( light );
  
  				// postprocessing
  
  				composer = new EffectComposer( renderer );
  				composer.addPass( new RenderPass( scene, camera ) );
  
  				const effect1 = new ShaderPass( DotScreenShader );
  				effect1.uniforms[ 'scale' ].value = 4;
  				composer.addPass( effect1 );
  
  				const effect2 = new ShaderPass( RGBShiftShader );
  				effect2.uniforms[ 'amount' ].value = 0.0015;
  				composer.addPass( effect2 );
  
  				const effect3 = new OutputPass();
  				composer.addPass( effect3 );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    object.rotation.x += 0.005;
    				object.rotation.y += 0.01;
    				composer.render();
  })
  
  		
}
</script>
