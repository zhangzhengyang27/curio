<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.175, 0.075, 0.175]"
    :camera-options="{ fov: 50, near: 0.01, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VOXLoader } from 'three/examples/jsm/loaders/VOXLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - vox loader (<a href=\"https://ephtracy.github.io/\" target=\"_blank\" rel=\"noopener\">Magica Voxel</a>)"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  			
  
  
  				
  
  
  				
  				scene.add( camera );
  
  				// light
  
  				const hemiLight = new THREE.HemisphereLight( 0xcccccc, 0x444444, 3 );
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
  				dirLight.position.set( 1.5, 3, 2.5 );
  				scene.add( dirLight );
  
  				const dirLight2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
  				dirLight2.position.set( - 1.5, - 3, - 2.5 );
  				scene.add( dirLight2 );
  
  				const loader = new VOXLoader();
  				loader.load( ASSET_HOST + 'models/vox/monu10.vox', function ( result ) {
  
  					const mesh = result.scene.children[ 0 ];
  					mesh.position.y = 0;
  					mesh.scale.setScalar( 0.0015 );
  					scene.add( mesh );
  
  				} );
  
  				// renderer
  
  				
  
  
  				// controls
  
  				
  				controls.minDistance = .1;
  				controls.maxDistance = 0.5;
  
  				//
  
  				
  
  			
  
  
  			/*
  			function displayPalette( palette ) {
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = 8;
  				canvas.height = 32;
  				canvas.style.position = 'absolute';
  				canvas.style.top = '0';
  				canvas.style.width = '100px';
  				canvas.style.imageRendering = 'pixelated';
  
  
  				const context = canvas.getContext( '2d' );
  
  				for ( let c = 0; c < 256; c ++ ) {
  
  					const x = c % 8;
  					const y = Math.floor( c / 8 );
  
  					const hex = palette[ c + 1 ];
  					const r = hex >> 0 & 0xff;
  					const g = hex >> 8 & 0xff;
  					const b = hex >> 16 & 0xff;
  					context.fillStyle = `rgba(${r},${g},${b},1)`;
  					context.fillRect( x, 31 - y, 1, 1 );
  
  				}
  
  			}
  			*/
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
