<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 18]"
    :camera-options="{ fov: 40, near: 1, far: 30 }"
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
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\t\t<a href=\"https://google.github.io/filament/Filament.md.html#toc4.7.2\" target=\"_blank\" rel=\"noopener\">White Furnace</a> energy conservation test by <a href=\"https://jsantell.com/\" target=\"_blank\" rel=\"noopener\">Jordan Santell</a>\n\t\t\t\t<br>Roughness increases left to right\n\t\t\t\t<br>Metalness increases top to bottom"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let gui;
  
  			const COLOR = 0xcccccc;
  
  			
  
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  				const aspect = width / height;
  
  				// renderer
  
  				
  
  
  
  
  				// scene
  
  				
  
  				// camera
  				
  
  
  				//
  
  				initGui();
  
  				
  
  			
  
  
  			function createObjects() {
  
  				const geometry = new THREE.SphereGeometry( 0.4, 32, 16 );
  
  				for ( let x = 0; x <= 10; x ++ ) {
  
  					for ( let y = 0; y <= 10; y ++ ) {
  
  						const material = new THREE.MeshPhysicalMaterial( {
  							roughness: x / 10,
  							metalness: y / 10,
  							color: 0xffffff,
  							envMap: radianceMap,
  							envMapIntensity: 1,
  							transmission: 0,
  							ior: 1.5
  						} );
  
  						const mesh = new THREE.Mesh( geometry, material );
  						mesh.position.x = x - 5;
  						mesh.position.y = 5 - y;
  						scene.add( mesh );
  
  					}
  
  				}
  
  			}
  
  			function createEnvironment() {
  
  				const envScene = new THREE.Scene();
  				envScene.background = new THREE.Color( COLOR );
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				radianceMap = pmremGenerator.fromScene( envScene ).texture;
  				pmremGenerator.dispose();
  
  				scene.background = envScene.background;
  
  			}
  
  			
  
  			function render() {
  
  
  
  			}
  
  			function initGui() {
  
  				gui = new GUI();
  
  				const param = {
  					'tint': false
  				};
  
  				gui.add( param, 'tint' ).name( 'Tint for Visibility' ).onChange( function ( val ) {
  
  					scene.traverse( function ( child ) {
  
  						const tint = val ? 0xccccff : 0xffffff;
  
  						if ( child.isMesh ) child.material.color.setHex( tint );
  
  					} );
  
  					render();
  
  				} );
  
  			}
  
  			Promise.resolve()
  				.then( init )
  				.then( createEnvironment )
  				.then( createObjects )
  				.then( render );
  
  		
}
</script>
