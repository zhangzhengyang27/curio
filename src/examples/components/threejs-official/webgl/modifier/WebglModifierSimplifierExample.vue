<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				const info = document.createElement( 'div' );
  				info.style.position = 'absolute';
  				info.style.top = '10px';
  				info.style.width = '100%';
  				info.style.textAlign = 'center';
  				info.innerHTML = '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> - Vertex Reduction using SimplifyModifier';
  				document.body.appendChild( info );
  
  				
  
  
  
  
  				
  
  				
  				camera.position.z = 15;
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.enablePan = false;
  				controls.enableZoom = false;
  
  				scene.add( new THREE.AmbientLight( 0xffffff, 0.6 ) );
  
  				const light = new THREE.PointLight( 0xffffff, 400 );
  				camera.add( light );
  				scene.add( camera );
  
  				new GLTFLoader().load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					const mesh = gltf.scene.children[ 0 ];
  					mesh.position.x = - 3;
  					mesh.rotation.y = Math.PI / 2;
  					scene.add( mesh );
  
  					const modifier = new SimplifyModifier();
  
  					const simplified = mesh.clone() as any;
  					simplified.material = simplified.material.clone();
  					simplified.material.flatShading = true;
  					const count = Math.floor( simplified.geometry.attributes.position.count * 0.875 ); // number of vertices to remove
  					simplified.geometry = modifier.modify( simplified.geometry, count );
  
  					simplified.position.x = 3;
  					simplified.rotation.y = - Math.PI / 2;
  					scene.add( simplified );
  
  					render();
  
  				} );
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
