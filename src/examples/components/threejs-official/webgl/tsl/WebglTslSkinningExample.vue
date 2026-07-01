<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[1, 2, 3]"
    :camera-look-at="[0, 1, 0]"
    :camera-options="{ fov: 50, near: 0.01, far: 100 }"
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
import * as THREE from 'three/webgpu';
import { WebGLNodesHandler } from 'three/examples/jsm/tsl/WebGLNodesHandler.js';
import { WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Skinning</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let mixer, timer;
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x3355aa );
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				//lights
  
  				const light = new THREE.PointLight( 0xffffff, 1, 100 );
  				light.power = 2500;
  				camera.add( light );
  				scene.add( camera );
  
  				const ambient = new THREE.AmbientLight( 0x4466ff, 1 );
  				scene.add( ambient );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					const object = gltf.scene;
  					mixer = new THREE.AnimationMixer( object );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					scene.add( object );
  
  				} );
  
  				//renderer
  
  				
  				renderer.setNodesHandler( new WebGLNodesHandler() );
  
  
  				renderer.toneMapping = THREE.LinearToneMapping;
  				renderer.toneMappingExposure = 0.4;
  
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
  })
  
  		
}
</script>
