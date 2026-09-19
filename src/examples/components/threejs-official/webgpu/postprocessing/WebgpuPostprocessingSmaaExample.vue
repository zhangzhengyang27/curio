<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
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
import { pass } from 'three/tsl';
import { smaa } from 'three/examples/jsm/tsl/display/SMAANode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>SMAA</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let renderPipeline;
  
  			const params = {
  				enabled: true,
  				autoRotate: true
  
  			};
  
  			
  
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  				camera.position.z = 300;
  
  				
  
  				const geometry = new THREE.BoxGeometry( 120, 120, 120 );
  				const material1 = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
  
  				const mesh1 = new THREE.Mesh( geometry, material1 );
  				mesh1.position.x = - 100;
  				scene.add( mesh1 );
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/brick_diffuse.jpg' );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const material2 = new THREE.MeshBasicMaterial( { map: texture } );
  
  				const mesh2 = new THREE.Mesh( geometry, material2 );
  				mesh2.position.x = 100;
  				scene.add( mesh2 );
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera ).toInspector( 'Color' );
  				const smaaPass = smaa( scenePass );
  
  				renderPipeline.outputNode = smaaPass;
  
  				//
  
  				
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				const smaaFolder = gui.addFolder( 'SMAA' );
  				smaaFolder.add( params, 'enabled' ).onChange( ( value: any ) => {
  			
  					if ( value === true ) {
  
  						renderPipeline.outputNode = smaaPass;
  
  					} else {
  
  						renderPipeline.outputNode = scenePass;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  				} );
  
  				const sceneFolder = gui.addFolder( 'Scene' );
  				sceneFolder.add( params, 'autoRotate' );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    if ( params.autoRotate === true ) {
    					for ( let i = 0; i < scene.children.length; i ++ ) {
    						const child = scene.children[ i ];
    						child.rotation.x += 0.005;
    						child.rotation.y += 0.01;
    					}
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
