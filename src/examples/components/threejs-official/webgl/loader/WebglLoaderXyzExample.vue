<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[10, 7, 10]"
    :camera-options="{ fov: 50, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { XYZLoader } from 'three/examples/jsm/loaders/XYZLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - XYZ loader<br/>\n\t\tasset from <a href=\"https://people.math.sc.edu/Burkardt/data/xyz/xyz.html\" target=\"_blank\" rel=\"noopener\">people.math.sc.edu</a> via GNU LGPL"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let points;
  
  			
  
  
  				
  
  
  				
  				scene.add( camera );
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const loader = new XYZLoader();
  				loader.load( ASSET_HOST + 'models/xyz/helix_201.xyz', function ( geometry ) {
  
  					geometry.center();
  
  					const vertexColors = ( geometry.hasAttribute( 'color' ) === true );
  
  					const material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );
  
  					points = new THREE.Points( geometry, material );
  					scene.add( points );
  
  				} );
  
  				//
  
  				
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( points ) {
    					points.rotation.x += delta * 0.2;
    					points.rotation.y += delta * 0.5;
    				}
  })
  
  		
}
</script>
