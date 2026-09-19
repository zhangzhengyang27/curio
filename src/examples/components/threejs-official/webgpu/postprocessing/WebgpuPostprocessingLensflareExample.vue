<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 0.5, -0.5]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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
import { pass, mrt, output, emissive, uniform } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { lensflare } from 'three/examples/jsm/tsl/display/LensflareNode.js';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Lensflares</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let renderPipeline;
  
  			
  
  
  				//
  
  				
  
  
  				
  
  				const texture = await new UltraHDRLoader().loadAsync( ASSET_HOST + 'textures/equirectangular/ice_planet_close.jpg' );
  
  				texture.mapping = THREE.EquirectangularReflectionMapping;
  
  				scene.background = texture;
  				scene.environment = texture;
  
  				scene.backgroundIntensity = 2;
  				scene.environmentIntensity = 15;
  
  				// model
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/space_ship_hallway.glb' );
  
  				const object = gltf.scene;
  
  				const aabb = new THREE.Box3().setFromObject( object );
  				const center = aabb.getCenter( new THREE.Vector3() );
  
  				object.position.x += ( object.position.x - center.x );
  				object.position.y += ( object.position.y - center.y );
  				object.position.z += ( object.position.z - center.z );
  
  				scene.add( object );
  			
  				//
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				const scenePass = pass( scene, camera );
  				scenePass.setMRT( mrt( {
  					output,
  					emissive
  				} ) );
  
  				const outputPass = scenePass.getTextureNode().toInspector( 'Color' );
  				const emissivePass = scenePass.getTextureNode( 'emissive' ).toInspector( 'Emissive' );
  
  				const bloomPass = bloom( emissivePass, 1, 1 ).toInspector( 'Bloom' );
  
  				const threshold = uniform( 0.5 );
  				const ghostAttenuationFactor = uniform( 25 );
  				const ghostSpacing = uniform( 0.25 );
  
  				const flarePass = lensflare( bloomPass, {
  					threshold,
  					ghostAttenuationFactor,
  					ghostSpacing
  				} );
  
  				const blurPass = gaussianBlur( flarePass, 8 ); // optional (blurring produces better flare quality but also adds some overhead)
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = outputPass.add( bloomPass ).add( blurPass );
  
  				//
  
  				
  				controls.enableDamping = true;
  				controls.enablePan = false;
  				controls.enableZoom = false;
  				controls.target.copy( camera.position );
  				controls.target.z -= 0.01;
  				controls.update();
  
  				
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				const bloomFolder = gui.addFolder( 'bloom' );
  				bloomFolder.add( bloomPass.strength, 'value', 0.0, 2.0 ).name( 'strength' );
  				bloomFolder.add( bloomPass.radius, 'value', 0.0, 1.0 ).name( 'radius' );
  			
  				const lensflareFolder = gui.addFolder( 'lensflare' );
  				lensflareFolder.add( threshold, 'value', 0.0, 1.0 ).name( 'threshold' );
  				lensflareFolder.add( ghostAttenuationFactor, 'value', 10.0, 50.0 ).name( 'attenuation' );
  				lensflareFolder.add( ghostSpacing, 'value', 0.0, 0.3 ).name( 'spacing' );
  
  				const toneMappingFolder = gui.addFolder( 'tone mapping' );
  				toneMappingFolder.add( renderer, 'toneMappingExposure', 0.1, 2 ).name( 'exposure' );
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderPipeline.render();
  })
  
  		
}
</script>
