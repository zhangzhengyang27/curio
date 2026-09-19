<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1, 3]"
    :camera-options="{ fov: 70, near: 0.1, far: 100 }"
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
import { pass, renderOutput } from 'three/tsl';
import { sobel } from 'three/examples/jsm/tsl/display/SobelOperatorNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span> Sobel</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let renderPipeline;
  
  			const params = {
  				enabled: true
  			};
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				
  
  
  				//
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/DragonAttenuation.glb' );
  				const model = gltf.scene.children[ 1 ];
  				model.material = new THREE.MeshStandardNodeMaterial();
  
  				scene.add( model );
  			
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.toneMapping = THREE.LinearToneMapping;
  
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  				pmremGenerator.dispose();
  
  				//
  
  				
  				controls.enableDamping = true;
  				controls.enableZoom = false;
  				controls.target.set( 0, 0.5, 0 );
  				controls.update();
  
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputColorTransform = false;
  
  				const scenePass = pass( scene, camera );
  
  				renderPipeline.outputNode = sobel( renderOutput( scenePass ) );
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( params, 'enabled' );
  
  				//
  
  				
  
  			
  
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    if ( params.enabled === true ) {
    					renderPipeline.render();
    				} else {
    				}
  })
  
  		
}
</script>
