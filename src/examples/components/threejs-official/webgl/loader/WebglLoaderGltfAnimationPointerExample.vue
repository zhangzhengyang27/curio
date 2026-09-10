<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-3, 2, 6]"
    :camera-options="{ fov: 40, near: 0.2, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { GLTFAnimationPointerExtension } from '@needle-tools/three-animation-pointer';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> + <a href=\"https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_animation_pointer\" target=\"_blank\" rel=\"noopener\">KHR_animation_pointer</a> using <a href=\"https://www.npmjs.com/package/@needle-tools/three-animation-pointer\" target=\"_blank\" rel=\"noopener\">@needle-tools/three-animation-pointer</a><br/>\n\t\t\tDragonDispersion from <a href=\"https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DragonDispersion\" target=\"_blank\" rel=\"noopener\">glTF-Sample-Assets</a>"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let mixer;
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  			const container = __stage.container;
  
  			const stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  
  
  
  
  
  			const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  
  			scene.background = new THREE.Color( 0xbfe3dd );
  			scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  
  
  
  
  			controls.target.set( 0, 0.5, 0 );
  			controls.update();
  			controls.enablePan = false;
  			controls.enableDamping = true;
  
  			const dracoLoader = new DRACOLoader();
  			dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  			
  
  			const ktx2Loader = new KTX2Loader()
  				.detectSupport( renderer );
  
  			const loader = new GLTFLoader();
  			loader.setDRACOLoader( dracoLoader );
  			loader.setKTX2Loader( ktx2Loader );
  
  			loader.register( p => {
  
  				return new GLTFAnimationPointerExtension( p );
  
  			} );
  
  			loader.load( '/threejs-official/models/gltf-needle/Z23hmXB27L6Db-optimized.glb', function ( gltf ) {
  
  				const model = gltf.scene;
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
