<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 2, 8]"
    :camera-options="{ fov: 40, near: 1, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Ground Truth Ambient Occlusion (GTAO) by <a href=\"https://github.com/Rabbid76\" target=\"_blank\" rel=\"noopener\">Rabbid76</a><br/>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			let composer, timer, stats, mixer;
  
  			
  
  
  				const dracoLoader = new DRACOLoader();
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  				loader.setPath( ASSET_HOST + 'models/gltf/' );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  				
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				
  				scene.background = new THREE.Color( 0xbfe3dd );
  				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  				
  
  
  				
  				controls.target.set( 0, 0.5, 0 );
  				controls.update();
  				controls.enablePan = false;
  				controls.enableDamping = true;
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				composer = new EffectComposer( renderer );
  
  				const renderPass = new RenderPass( scene, camera );
  				composer.addPass( renderPass );
  
  				const gtaoPass = new GTAOPass( scene, camera, width, height );
  				gtaoPass.output = GTAOPass.OUTPUT.Denoise;
  				composer.addPass( gtaoPass );
  
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  				//
  
  				loader.load( 'LittlestTokyo.glb', ( gltf ) => {
  
  					const model = gltf.scene;
  					model.position.set( 1, 1, 0 );
  					model.scale.set( 0.01, 0.01, 0.01 );
  					scene.add( model );
  
  					mixer = new THREE.AnimationMixer( model );
  					mixer.clipAction( gltf.animations[ 0 ] ).play();
  
  					const box = new THREE.Box3().setFromObject( scene );
  					gtaoPass.setSceneClipBox( box );
  
  				}, undefined, ( e ) => console.error( e ) );
  
  				// Init gui
  				const gui = new GUI();
  
  				gui.add( gtaoPass, 'output', {
  					'Default': GTAOPass.OUTPUT.Default,
  					'Diffuse': GTAOPass.OUTPUT.Diffuse,
  					'AO Only': GTAOPass.OUTPUT.AO,
  					'AO Only + Denoise': GTAOPass.OUTPUT.Denoise,
  					'Depth': GTAOPass.OUTPUT.Depth,
  					'Normal': GTAOPass.OUTPUT.Normal
  				} ).onChange( function ( value ) {
  
  					gtaoPass.output = value;
  
  				} );
  
  				const aoParameters = {
  					radius: 0.25,
  					distanceExponent: 1.,
  					thickness: 1.,
  					scale: 1.,
  					samples: 16,
  					distanceFallOff: 1.,
  					screenSpaceRadius: false,
  				};
  				const pdParameters = {
  					lumaPhi: 10.,
  					depthPhi: 2.,
  					normalPhi: 3.,
  					radius: 4.,
  					radiusExponent: 1.,
  					rings: 2.,
  					samples: 16,
  				};
  				gtaoPass.updateGtaoMaterial( aoParameters );
  				gtaoPass.updatePdMaterial( pdParameters );
  				gui.add( gtaoPass, 'blendIntensity' ).min( 0 ).max( 1 ).step( 0.01 );
  				gui.add( aoParameters, 'radius' ).min( 0.01 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( aoParameters, 'distanceExponent' ).min( 1 ).max( 4 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( aoParameters, 'thickness' ).min( 0.01 ).max( 10 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( aoParameters, 'distanceFallOff' ).min( 0 ).max( 1 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( aoParameters, 'scale' ).min( 0.01 ).max( 2.0 ).step( 0.01 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( aoParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( aoParameters, 'screenSpaceRadius' ).onChange( () => gtaoPass.updateGtaoMaterial( aoParameters ) );
  				gui.add( pdParameters, 'lumaPhi' ).min( 0 ).max( 20 ).step( 0.01 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  				gui.add( pdParameters, 'depthPhi' ).min( 0.01 ).max( 20 ).step( 0.01 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  				gui.add( pdParameters, 'normalPhi' ).min( 0.01 ).max( 20 ).step( 0.01 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  				gui.add( pdParameters, 'radius' ).min( 0 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  				gui.add( pdParameters, 'radiusExponent' ).min( 0.1 ).max( 4. ).step( 0.1 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  				gui.add( pdParameters, 'rings' ).min( 1 ).max( 16 ).step( 0.125 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  				gui.add( pdParameters, 'samples' ).min( 2 ).max( 32 ).step( 1 ).onChange( () => gtaoPass.updatePdMaterial( pdParameters ) );
  			
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) {
    					mixer.update( delta );
    				}
    				stats.begin();
    				composer.render();
    				stats.end();
  })
  
  		
}
</script>
