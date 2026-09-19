<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[15, 10, -15]"
    :camera-options="{ fov: 25, near: 1, far: 1000 }"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> collada loader - skinning<br/>\n\t\t\tDancing Stormtrooper by <a href=\"https://sketchfab.com/strykerdoesgames\" target=\"_blank\" rel=\"noopener\">StrykerDoesAnimation</a>, <a href=\"https://creativecommons.org/licenses/by/4.0/\" target=\"_blank\" rel=\"noopener\">CC Attribution</a>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  

  
  
  
  
  
  			let container, stats, timer: any;
  			let mixer: any;
  
  			
  
  
  				container = __stage.container;
  
  				
  
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// collada
  
  				const loader = new ColladaLoader();
  				loader.load( ASSET_HOST + 'models/collada/stormtrooper/stormtrooper.dae', function ( collada ) {
  
  					const avatar = collada!.scene;
  					const animations = avatar.animations;
  
  					mixer = new THREE.AnimationMixer( avatar );
  					mixer.clipAction( animations[ 0 ] ).play();
  
  					scene.add( avatar );
  
  				} );
  
  				//
  
  				const gridHelper = new THREE.GridHelper( 10, 20, 0xc1c1c1, 0x8d8d8d );
  				scene.add( gridHelper );
  
  				//
  
  				const ambientLight = new THREE.AmbientLight( 0xffffff, 0.6 );
  				scene.add( ambientLight );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				directionalLight.position.set( 1.5, 1, - 1.5 );
  				scene.add( directionalLight );
  
  				//
  
  				
  
  
  				//
  
  				
  				controls.screenSpacePanning = true;
  				controls.minDistance = 5;
  				controls.maxDistance = 40;
  				controls.target.set( 0, 2, 0 );
  				controls.update();
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    {
    const delta = timer.getDelta();
    				if ( mixer !== undefined ) {
    					mixer.update( delta );
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				const delta = timer.getDelta();
  
  				if ( mixer !== undefined ) {
  
  					mixer.update( delta );
  
  				}
  
  
  
  			}
  
  		
}
</script>
