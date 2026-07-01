<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[5, 2, 8]"
    :camera-options="{ fov: 40, near: 1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - animation - keyframes<br/>\n\t\t\tModel: <a href=\"https://artstation.com/artwork/1AGwX\" target=\"_blank\" rel=\"noopener\">Littlest Tokyo</a> by\n\t\t\t<a href=\"https://artstation.com/glenatron\" target=\"_blank\" rel=\"noopener\">Glen Fox</a>, CC Attribution."
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let mixer;
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  			const container = document.getElementById( 'container' );
  
  			const stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  
  
  
  			renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  
  
  			// Sky
  
  			const sky = new Sky();
  			sky.scale.setScalar( 10000 );
  			scene.add( sky );
  
  			const uniforms = sky.material.uniforms;
  			uniforms[ 'turbidity' ].value = 0;
  			uniforms[ 'rayleigh' ].value = 3;
  			uniforms[ 'mieDirectionalG' ].value = 0.7;
  			uniforms[ 'cloudElevation' ].value = 1;
  			uniforms[ 'sunPosition' ].value.set( - 0.8, 0.19, 0.56 ); // elevation: 11, azimuth: -55
  
  			const pmremGenerator = new THREE.PMREMGenerator( renderer );
  			const environment = pmremGenerator.fromScene( sky ).texture;
  			scene.environment = environment;
  
  
  
  
  
  			controls.enableDamping = true;
  			controls.target.set( 0, 0.7, 0 );
  			controls.update();
  
  			const dracoLoader = new DRACOLoader();
  			dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  			const loader = new GLTFLoader();
  			loader.setDRACOLoader( dracoLoader );
  			loader.load( ASSET_HOST + 'models/gltf/LittlestTokyo.glb', function ( gltf ) {
  
  				const model = gltf.scene;
  				model.position.set( 1, 1, 0 );
  				model.scale.set( 0.01, 0.01, 0.01 );
  				scene.add( model );
  
  				mixer = new THREE.AnimationMixer( model );
  				mixer.clipAction( gltf.animations[ 0 ] ).play();
  
  				}, undefined, function ( e ) {
  
  				console.error( e );
  
  			} );
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				mixer.update( delta );
    				stats.update();
  })
  
  
  		
}
</script>
