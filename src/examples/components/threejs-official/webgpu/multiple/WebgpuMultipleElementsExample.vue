<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :clear-color="0xffffff"
    :camera-options="{ fov: 50, near: 1, far: 10 }"
    custom-render
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three';
import { color } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - multiple elements"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			const scenes = [];
  
  			
  
  
  				canvas = renderer.domElement;
  
  				const geometries = [
  					new THREE.BoxGeometry( 1, 1, 1 ),
  					new THREE.SphereGeometry( 0.5, 12, 8 ),
  					new THREE.DodecahedronGeometry( 0.5 ),
  					new THREE.CylinderGeometry( 0.5, 0.5, 1, 12 )
  				];
  
  				const content = __stage.container;
  
  				for ( let i = 0; i < 40; i ++ ) {
  
  
  					scene.backgroundNode = color( 0xeeeeee );
  
  					// make a list item
  					const element = document.createElement( 'div' );
  					element.className = 'list-item';
  
  					const sceneElement = document.createElement( 'div' );
  					element.appendChild( sceneElement );
  
  					const descriptionElement = document.createElement( 'div' );
  					descriptionElement.innerText = 'Scene ' + ( i + 1 );
  					element.appendChild( descriptionElement );
  
  					// the element that represents the area we want to render the scene
  					scene.userData.element = sceneElement;
  					content.appendChild( element );
  
  
  					camera.position.z = 2;
  					scene.userData.camera = camera;
  
  
  					controls.minDistance = 2;
  					controls.maxDistance = 5;
  					controls.enablePan = false;
  					controls.enableZoom = false;
  					scene.userData.controls = controls;
  
  					// add one random mesh to each scene
  					const geometry = geometries[ geometries.length * Math.random() | 0 ];
  
  					const material = new THREE.MeshStandardMaterial( {
  
  						color: new THREE.Color().setHSL( Math.random(), 1, 0.75, THREE.SRGBColorSpace ),
  						roughness: 0.5,
  						metalness: 0,
  						flatShading: true
  
  					} );
  
  					scene.add( new THREE.Mesh( geometry, material ) );
  
  					scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444, 3 ) );
  
  					const light = new THREE.DirectionalLight( 0xffffff, 1.5 );
  					light.position.set( 1, 1, 1 );
  					scene.add( light );
  
  					scenes.push( scene );
  
  				}
  
  
  				
  				renderer.setClearColor( 0xffffff, 1 );
  
  				
  
  
  			function updateSize() {
  
  				const width = canvas.clientWidth;
  				const height = canvas.clientHeight;
  
  				if ( canvas.width !== width || canvas.height !== height ) {
  
  
  
  				}
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const width = canvas.clientWidth;
    				const height = canvas.clientHeight;
    				if ( canvas.width !== width || canvas.height !== height ) {
    				}
    }
    				canvas.style.transform = `translateY(${window.scrollY}px)`;
    				renderer.setClearColor( 0xffffff );
    				renderer.setScissorTest( false );
    				renderer.setViewport( 0, 0, canvas.width, canvas.height );
    				renderer.clear();
    				//renderer.setClearColor( 0xe0e0e0 );
    				renderer.setScissorTest( true );
    				scenes.forEach( function ( scene ) {
    					// so something moves
    					scene.children[ 0 ].rotation.y = Date.now() * 0.001;
    					// get the element that is a place holder for where we want to
    					// draw the scene
    					const element = scene.userData.element;
    					// get its position relative to the page's viewport
    					const rect = element.getBoundingClientRect();
    					// check if it's offscreen. If so skip it
    					if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
    						 rect.right < 0 || rect.left > renderer.domElement.clientWidth ) {
    						return; // it's off screen
    					}
    					// set the viewport
    					const width = rect.right - rect.left;
    					const height = rect.bottom - rect.top;
    					const left = rect.left;
    					const top = rect.top;
    					renderer.setViewport( left, top, width, height );
    					renderer.setScissor( left, top, width, height );
    					let camera = scene.userData.camera;
    					//camera.aspect = width / height; // not changing in this example
    					//camera.updateProjectionMatrix();
    				} );
  })
  
  		
}
</script>
