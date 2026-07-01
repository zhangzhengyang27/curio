<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-5, 2.5, -3.5]"
    :camera-options="{ fov: 40, near: 1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Bloom</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let renderPipeline, mixer, timer;
  
  			const params = {
  				threshold: 0,
  				strength: 1,
  				radius: 0,
  				exposure: 1
  			};
  
  			
  			async 
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  
  
  				
  
  				scene.add( camera );
  
  				scene.add( new THREE.AmbientLight( 0xcccccc ) );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 100 );
  				camera.add( pointLight );
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/PrimaryIonDrive.glb' );
  
  				const model = gltf.scene;
  				scene.add( model );
  
  				mixer = new THREE.AnimationMixer( model );
  				const clip = gltf.animations[ 0 ];
  				mixer.clipAction( clip.optimize() ).play();
  
  				//
  
  				
  
  
  				renderer.toneMapping = THREE.ReinhardToneMapping;
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera );
  				const scenePassColor = scenePass.getTextureNode( 'output' ).toInspector( 'Color' );
  
  				const bloomPass = bloom( scenePassColor ).toInspector( 'Bloom' );
  
  				renderPipeline.outputNode = scenePassColor.add( bloomPass );
  
  				//
  
  
  				controls.maxPolarAngle = Math.PI * 0.5;
  				controls.minDistance = 3;
  				controls.maxDistance = 8;
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				const bloomFolder = gui.addFolder( 'bloom' );
  
  				bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {
  
  					bloomPass.threshold.value = value;
  
  				} );
  
  				bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {
  
  					bloomPass.strength.value = value;
  
  				} );
  
  				bloomFolder.add( params, 'radius', 0.0, 1.0, 0.01 ).onChange( function ( value ) {
  
  					bloomPass.radius.value = value;
  
  				} );
  
  				const toneMappingFolder = gui.addFolder( 'tone mapping' );
  
  				toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
  
  					renderer.toneMappingExposure = Math.pow( value, 4.0 );
  
  				} );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				mixer.update( delta );
    				renderPipeline.render();
  })
  
  		
}
</script>
