<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    :enable-controls="false"
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
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - effects - ascii"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			let effect;
  
  			let sphere, plane;
  
  			const start = Date.now();
  
  			
  
  
  				
  				camera.position.y = 150;
  				camera.position.z = 500;
  
  				
  				scene.background = new THREE.Color( 0, 0, 0 );
  
  				const pointLight1 = new THREE.PointLight( 0xffffff, 3, 0, 0 );
  				pointLight1.position.set( 500, 500, 500 );
  				scene.add( pointLight1 );
  
  				const pointLight2 = new THREE.PointLight( 0xffffff, 1, 0, 0 );
  				pointLight2.position.set( - 500, - 500, - 500 );
  				scene.add( pointLight2 );
  
  				sphere = new THREE.Mesh( new THREE.SphereGeometry( 200, 20, 10 ), new THREE.MeshPhongMaterial( { flatShading: true } ) );
  				scene.add( sphere );
  
  				// Plane
  
  				plane = new THREE.Mesh( new THREE.PlaneGeometry( 400, 400 ), new THREE.MeshBasicMaterial( { color: 0xe0e0e0 } ) );
  				plane.position.y = - 200;
  				plane.rotation.x = - Math.PI / 2;
  				scene.add( plane );
  
  				
  
  				effect = new AsciiEffect( renderer, ' .:-+*=%@#', { invert: true } );
  				effect.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				effect.domElement.style.color = 'white';
  				effect.domElement.style.backgroundColor = 'black';
  
  				// Special case: append effect.domElement, instead of renderer.domElement.
  				// AsciiEffect creates a custom domElement (a div container) where the ASCII elements are placed.
  
  				document.body.appendChild( effect.domElement );
  
  				
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    const timer = Date.now() - start;
    				sphere.position.y = Math.abs( Math.sin( timer * 0.002 ) ) * 150;
    				sphere.rotation.x = timer * 0.0003;
    				sphere.rotation.z = timer * 0.0002;
    				effect.render( scene, camera );
  })
  
  		
}
</script>
