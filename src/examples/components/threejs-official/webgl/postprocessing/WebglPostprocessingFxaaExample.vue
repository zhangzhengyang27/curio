<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 1, far: 2000 }"
    custom-render
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - postprocessing - FXAA<br />\n\t\t\tLeft: No FXAA, Right: FXAA"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  			let composer1, composer2, fxaaPass;
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				
  				camera.position.z = 500;
  
  				
  
  				//
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
  				hemiLight.position.set( 0, 1000, 0 );
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( - 3000, 1000, - 1000 );
  				scene.add( dirLight );
  
  				//
  
  				const geometry = new THREE.TetrahedronGeometry( 10 );
  				const material = new THREE.MeshStandardMaterial( { color: 0xf73232, flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 100 );
  				const dummy = new THREE.Object3D();
  
  				for ( let i = 0; i < 100; i ++ ) {
  
  					dummy.position.x = Math.random() * 500 - 250;
  					dummy.position.y = Math.random() * 500 - 250;
  					dummy.position.z = Math.random() * 500 - 250;
  
  					dummy.scale.setScalar( Math.random() * 2 + 1 );
  
  					dummy.rotation.x = Math.random() * Math.PI;
  					dummy.rotation.y = Math.random() * Math.PI;
  					dummy.rotation.z = Math.random() * Math.PI;
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  				}
  
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.autoClear = false;
  				
  				controls.autoRotate = true;
  
  
  				//
  
  				const renderPass = new RenderPass( scene, camera );
  				renderPass.clearAlpha = 0;
  
  				//
  
  				fxaaPass = new FXAAPass();
  
  				const outputPass = new OutputPass();
  
  				composer1 = new EffectComposer( renderer );
  				composer1.addPass( renderPass );
  				composer1.addPass( outputPass );
  
  				//
  
  				composer2 = new EffectComposer( renderer );
  				composer2.addPass( renderPass );
  				composer2.addPass( outputPass );
  
  				// FXAA is engineered to be applied towards the end of engine post processing after conversion to low dynamic range and conversion to the sRGB color space for display.
  
  				composer2.addPass( fxaaPass );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const halfWidth = container.offsetWidth / 2;
    				renderer.setScissorTest( true );
    				renderer.setScissor( 0, 0, halfWidth - 1, container.offsetHeight );
    				composer1.render();
    				renderer.setScissor( halfWidth, 0, halfWidth, container.offsetHeight );
    				composer2.render();
    				renderer.setScissorTest( false );
  })
  
  		
}
</script>
