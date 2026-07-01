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
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> - post-processing SMAA"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let composer, stats, smaaPass;
  
  			const params = {
  				enabled: true,
  				autoRotate: true
  
  			};
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  
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
  				texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const material2 = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh2 = new THREE.Mesh( geometry, material2 );
  				mesh2.position.x = 100;
  				scene.add( mesh2 );
  
  				// postprocessing
  
  				composer = new EffectComposer( renderer );
  				composer.addPass( new RenderPass( scene, camera ) );
  
  				smaaPass = new SMAAPass();
  				composer.addPass( smaaPass );
  
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  				
  
  				const gui = new GUI();
  
  				const smaaFolder = gui.addFolder( 'SMAA' );
  				smaaFolder.add( params, 'enabled' );
  
  				const sceneFolder = gui.addFolder( 'Scene' );
  				sceneFolder.add( params, 'autoRotate' );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    				if ( params.autoRotate === true ) {
    					for ( let i = 0; i < scene.children.length; i ++ ) {
    						const child = scene.children[ i ];
    						child.rotation.x += 0.005;
    						child.rotation.y += 0.01;
    					}
    				}
    				smaaPass.enabled = params.enabled;
    				composer.render();
    				stats.end();
  })
  
  		
}
</script>
