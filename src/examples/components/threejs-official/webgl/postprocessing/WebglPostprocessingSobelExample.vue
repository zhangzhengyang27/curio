<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 1, 3]"
    :camera-options="{ fov: 70, near: 0.1, far: 100 }"
    custom-render
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> - webgl - postprocessing<br/>\n\t\t\tsobel (edge detection)"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  			let composer;
  
  			let effectSobel;
  
  			const params = {
  				enable: true
  			};
  
  			
  
  
  				//
  
  				
  
  				
  
  
  
  				//
  
  				const geometry = new THREE.TorusKnotGeometry( 1, 0.3, 256, 32 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				//
  
  				const ambientLight = new THREE.AmbientLight( 0xe7e7e7 );
  				scene.add( ambientLight );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 20 );
  				camera.add( pointLight );
  				scene.add( camera );
  
  				//
  
  				
  
  
  				// postprocessing
  
  				composer = new EffectComposer( renderer );
  				const renderPass = new RenderPass( scene, camera );
  				composer.addPass( renderPass );
  
  				// color to grayscale conversion
  
  				const effectGrayScale = new ShaderPass( LuminosityShader );
  				composer.addPass( effectGrayScale );
  
  				// you might want to use a gaussian blur filter before
  				// the next pass to improve the result of the Sobel operator
  
  				// Sobel operator
  
  				effectSobel = new ShaderPass( SobelOperatorShader );
  				effectSobel.uniforms[ 'resolution' ].value.x = (__stage.container?.clientWidth || window.innerWidth) * window.devicePixelRatio;
  				effectSobel.uniforms[ 'resolution' ].value.y = (__stage.container?.clientHeight || window.innerHeight) * window.devicePixelRatio;
  				composer.addPass( effectSobel );
  
  
  				controls.enableZoom = false;
  
  				//
  
  				const gui = new GUI();
  
  				gui.add( params, 'enable' );
  				gui.open();
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( params.enable === true ) {
    					composer.render();
    				} else {
    				}
  })
  
  		
}
</script>
