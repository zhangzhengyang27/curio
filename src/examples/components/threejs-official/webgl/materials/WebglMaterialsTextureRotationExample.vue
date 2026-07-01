<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 15, 25]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - texture rotation"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let gui;
  
  			const API = {
  				offsetX: 0,
  				offsetY: 0,
  				repeatX: 0.25,
  				repeatY: 0.25,
  				rotation: Math.PI / 4, // positive is counterclockwise
  				centerX: 0.5,
  				centerY: 0.5
  			};
  
  			
  
  
  				
  
  
  
  
  				
  
  				
  
  				scene.add( camera );
  
  
  				controls.addEventListener( 'change', render );
  				controls.minDistance = 20;
  				controls.maxDistance = 50;
  				controls.maxPolarAngle = Math.PI / 2;
  
  				const geometry = new THREE.BoxGeometry( 10, 10, 10 );
  
  				new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_opengl.jpg', function ( texture ) {
  
  					texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  					texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					//texture.matrixAutoUpdate = false; // default is true; set to false to update texture.matrix manually
  
  					const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  					mesh = new THREE.Mesh( geometry, material );
  					scene.add( mesh );
  
  					updateUvTransform();
  
  					initGui();
  
  					render();
  
  				} );
  
  				
  
  			
  
  
  			function render() {
  
  
  
  			}
  
  			
  
  			function updateUvTransform() {
  
  				const texture = mesh.material.map;
  
  				if ( texture.matrixAutoUpdate === true ) {
  
  					texture.offset.set( API.offsetX, API.offsetY );
  					texture.repeat.set( API.repeatX, API.repeatY );
  					texture.center.set( API.centerX, API.centerY );
  					texture.rotation = API.rotation; // rotation is around center
  
  				} else {
  
  					// setting the matrix uv transform directly
  					texture.matrix.setUvTransform( API.offsetX, API.offsetY, API.repeatX, API.repeatY, API.rotation, API.centerX, API.centerY );
  
  				}
  
  				render();
  
  			}
  
  			function initGui() {
  
  				gui = new GUI();
  
  				gui.add( API, 'offsetX', 0.0, 1.0 ).name( 'offset.x' ).onChange( updateUvTransform );
  				gui.add( API, 'offsetY', 0.0, 1.0 ).name( 'offset.y' ).onChange( updateUvTransform );
  				gui.add( API, 'repeatX', 0.25, 2.0 ).name( 'repeat.x' ).onChange( updateUvTransform );
  				gui.add( API, 'repeatY', 0.25, 2.0 ).name( 'repeat.y' ).onChange( updateUvTransform );
  				gui.add( API, 'rotation', - 2.0, 2.0 ).name( 'rotation' ).onChange( updateUvTransform );
  				gui.add( API, 'centerX', 0.0, 1.0 ).name( 'center.x' ).onChange( updateUvTransform );
  				gui.add( API, 'centerY', 0.0, 1.0 ).name( 'center.y' ).onChange( updateUvTransform );
  
  			}
  
  		
}
</script>
