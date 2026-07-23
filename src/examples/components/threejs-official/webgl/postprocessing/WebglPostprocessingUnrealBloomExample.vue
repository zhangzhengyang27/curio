<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-5, 2.5, -3.5]"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Bloom pass by <a href=\"http://eduperiment.com\" target=\"_blank\" rel=\"noopener\">Prashant Sharma</a> and <a href=\"https://clara.io\" target=\"_blank\" rel=\"noopener\">Ben Houston</a>\n\t\t\t<br/>\n\t\t\tModel: <a href=\"https://blog.sketchfab.com/art-spotlight-primary-ion-drive/\" target=\"_blank\" rel=\"noopener\">Primary Ion Drive</a> by\n\t\t\t<a href=\"http://mjmurdock.com/\" target=\"_blank\" rel=\"noopener\">Mike Murdock</a>, CC Attribution."
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  			let composer, mixer, timer;
  
  			const params = {
  				threshold: 0,
  				strength: 1,
  				radius: 0.5,
  				exposure: 1
  			};
  
  			
  			async 
  
  
  				const container = document.getElementById( 'container' );
  
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
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				//
  
  				const renderScene = new RenderPass( scene, camera );
  
  				const bloomPass = new UnrealBloomPass( new THREE.Vector2( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) ), 1.5, 0.4, 0.85 );
  				bloomPass.threshold = params.threshold;
  				bloomPass.strength = params.strength;
  				bloomPass.radius = params.radius;
  
  				const outputPass = new OutputPass();
  
  				composer = new EffectComposer( renderer );
  				composer.addPass( renderScene );
  				composer.addPass( bloomPass );
  				composer.addPass( outputPass );
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  
  				controls.maxPolarAngle = Math.PI * 0.5;
  				controls.minDistance = 3;
  				controls.maxDistance = 8;
  
  				//
  
  				gui = new GUI();
  
  				const bloomFolder = gui.addFolder( 'bloom' );
  
  				bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {
  
  					bloomPass.threshold = Number( value );
  
  				} );
  
  				bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {
  
  					bloomPass.strength = Number( value );
  
  				} );
  
  				gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
  
  					bloomPass.radius = Number( value );
  
  				} );
  
  				const toneMappingFolder = gui.addFolder( 'tone mapping' );
  
  				toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
  
  					renderer.toneMappingExposure = Math.pow( value, 4.0 );
  
  				} );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				mixer.update( delta );
    				stats.update();
    				composer.render();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
