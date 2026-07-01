<template>
  <CSS3DExampleScene
    camera="perspective"
    :camera-position="[500, 350, 750]"
    :camera-options="{ fov: 50, near: 1, far: 5000 }"
    :enable-controls="false"
    @ready="onReady"
  />
</template>

<script setup>
import CSS3DExampleScene from '@/examples/components/CSS3DExampleScene.vue'
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			function Element( id, x, y, z, ry ) {
  
  				const div = document.createElement( 'div' );
  				div.style.width = '480px';
  				div.style.height = '360px';
  				div.style.backgroundColor = '#000';
  
  				const iframe = document.createElement( 'iframe' );
  				iframe.style.width = '480px';
  				iframe.style.height = '360px';
  				iframe.style.border = '0px';
  				iframe.src = [ 'https://www.youtube.com/embed/', id, '?rel=0' ].join( '' );
  				div.appendChild( iframe );
  
  				const object = new CSS3DObject( div );
  				object.position.set( x, y, z );
  				object.rotation.y = ry;
  
  				return object;
  
  			}
  
  				const container = document.getElementById( 'container' );
  
  				
  
  
  				
  
  				
  
  
  
  				const group = new THREE.Group();
  				group.add( new Element( 'SJOz3qjfQXU', 0, 0, 240, 0 ) );
  				group.add( new Element( 'Y2-xZ-1HE-Q', 240, 0, 0, Math.PI / 2 ) );
  				group.add( new Element( 'IrydklNpcFI', 0, 0, - 240, Math.PI ) );
  				group.add( new Element( '9ubytEsCaS0', - 240, 0, 0, - Math.PI / 2 ) );
  				scene.add( group );
  
  				
  				controls.rotateSpeed = 4;
  
  				
  
  				// Block iframe events when dragging camera
  
  				const blocker = document.getElementById( 'blocker' );
  				blocker.style.display = 'none';
  
  				controls.addEventListener( 'start', function () {
  
  					blocker.style.display = '';
  
  				} );
  				controls.addEventListener( 'end', function () {
  
  					blocker.style.display = 'none';
  
  				} );
  
  			
  
  
  			
  
  			function animate() {
  
  				requestAnimationFrame( animate );
  				controls.update();
  
  
  			}
  
  		
}
</script>
