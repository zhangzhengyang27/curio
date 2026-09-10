<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Temporal Anti-Aliasing (TAA) pass by <a href=\"https://clara.io\" target=\"_blank\" rel=\"noopener\">Ben Houston</a><br/><br/>\n\t\t\tWhen there is no motion in the scene, the TAA render pass accumulates jittered camera samples<br/>\n\t\t\tacross frames to create a high quality anti-aliased result.<br/><br/>\n\t\t\tTexture interpolation, mipmapping and anisotropic sampling is disabled to emphasize<br/> the effect SSAA levels have one the resulting render quality."
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let composer, taaRenderPass, renderPass;
  			let gui, stats;
  			let index = 0;
  
  			const param = { TAAEnabled: '1', TAASampleLevel: 0 };
  
  			
  			clearGui();
  
  			function clearGui() {
  
  				if ( gui ) gui.destroy();
  
  				gui = new GUI();
  
  				gui.add( param, 'TAAEnabled', {
  					'Disabled': '0',
  					'Enabled': '1'
  				} ).onFinishChange( function () {
  
  					if ( taaRenderPass ) {
  
  						taaRenderPass.enabled = ( param.TAAEnabled === '1' );
  						renderPass.enabled = ( param.TAAEnabled !== '1' );
  
  					}
  
  				} );
  
  				gui.add( param, 'TAASampleLevel', {
  					'Level 0: 1 Sample': 0,
  					'Level 1: 2 Samples': 1,
  					'Level 2: 4 Samples': 2,
  					'Level 3: 8 Samples': 3,
  					'Level 4: 16 Samples': 4,
  					'Level 5: 32 Samples': 5
  				} ).onFinishChange( function () {
  
  					if ( taaRenderPass ) {
  
  						taaRenderPass.sampleLevel = param.TAASampleLevel;
  
  					}
  
  				} );
  
  				gui.open();
  
  			}
  
  			
  
  
  				const container = __stage.container;
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  				camera.position.z = 300;
  
  				
  
  				const geometry = new THREE.BoxGeometry( 120, 120, 120 );
  				const material1 = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
  
  				const mesh1 = new THREE.Mesh( geometry, material1 );
  				mesh1.position.x = - 100;
  				scene.add( mesh1 );
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/brick_diffuse.jpg' );
  				texture.minFilter = THREE.NearestFilter;
  				texture.magFilter = THREE.NearestFilter;
  				texture.anisotropy = 1;
  				texture.generateMipmaps = false;
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const material2 = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh2 = new THREE.Mesh( geometry, material2 );
  				mesh2.position.x = 100;
  				scene.add( mesh2 );
  
  				// postprocessing
  
  				composer = new EffectComposer( renderer );
  
  				taaRenderPass = new TAARenderPass( scene, camera );
  				taaRenderPass.unbiased = false;
  				composer.addPass( taaRenderPass );
  
  				renderPass = new RenderPass( scene, camera );
  				renderPass.enabled = false;
  				composer.addPass( renderPass );
  
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    index ++;
    				if ( Math.round( index / 200 ) % 2 === 0 ) {
    					for ( let i = 0; i < scene.children.length; i ++ ) {
    						const child = scene.children[ i ];
    						child.rotation.x += 0.005;
    						child.rotation.y += 0.01;
    					}
    					if ( taaRenderPass ) taaRenderPass.accumulate = false;
    				} else {
    					if ( taaRenderPass ) taaRenderPass.accumulate = true;
    				}
    				composer.render();
    				stats.update();
  })
  
  		
}
</script>
