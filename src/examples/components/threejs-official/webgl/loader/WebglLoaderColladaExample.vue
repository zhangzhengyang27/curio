<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[8, 10, 8]"
    :camera-look-at="[0, 3, 0]"
    :camera-options="{ fov: 45, near: 0.1, far: 2000 }"
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
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> collada loader<br/>\n\t\t\tElf Girl by <a href=\"https://sketchfab.com/yellow09\" target=\"_blank\" rel=\"noopener\">halloween</a>, <a href=\"https://creativecommons.org/licenses/by/4.0/\" target=\"_blank\" rel=\"noopener\">CC Attribution</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats, timer;
  
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				
  
  
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// loading manager
  
  				const loadingManager = new THREE.LoadingManager( function () {
  
  					scene.add( elf );
  
  				} );
  
  				// collada
  
  				const loader = new ColladaLoader( loadingManager );
  				loader.load( './models/collada/elf/elf.dae', function ( collada ) {
  
  					elf = collada.scene;
  
  				} );
  
  				//
  
  				const ambientLight = new THREE.AmbientLight( 0xffffff );
  				scene.add( ambientLight );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
  				directionalLight.position.set( 1, 1, 0 ).normalize();
  				scene.add( directionalLight );
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    const delta = timer.getDelta();
    				if ( elf !== undefined ) {
    					elf.rotation.z += delta * 0.5;
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				const delta = timer.getDelta();
  
  				if ( elf !== undefined ) {
  
  					elf.rotation.z += delta * 0.5;
  
  				}
  
  
  
  			}
  
  		
}
</script>
