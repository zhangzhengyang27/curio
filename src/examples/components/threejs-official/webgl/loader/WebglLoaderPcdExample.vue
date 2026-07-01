<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 1]"
    :camera-options="{ fov: 30, near: 0.01, far: 40 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t<a href=\"https://pointclouds.org/documentation/tutorials/pcd_file_format.html\" target=\"_blank\" rel=\"noopener\">PCD File format</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  			render();
  
  			
  
  
  				
  
  
  
  
  				
  
  				
  
  				scene.add( camera );
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 0.5;
  				controls.maxDistance = 10;
  
  				//scene.add( new THREE.AxesHelper( 1 ) );
  
  				const loader = new PCDLoader();
  
  				const loadPointCloud = function ( file ) {
  
  					loader.load( './models/pcd/' + file, function ( points ) {
  
  						points.geometry.center();
  						points.geometry.rotateX( Math.PI );
  						points.name = file;
  						scene.add( points );
  
  						const gui = new GUI();
  
  						gui.add( points.material, 'size', 0.001, 0.01 ).onChange( render );
  						gui.addColor( points.material, 'color' ).onChange( render );
  						gui.add( points, 'name', [
  							'ascii/simple.pcd',
  							'binary/Zaghetto.pcd',
  							'binary/Zaghetto_8bit.pcd',
  							'binary_compressed/pcl_logo.pcd',
  						] ).name( 'type' ).onChange( e => {
  
  							gui.destroy();
  							scene.remove( points );
  							loadPointCloud( e );
  			
  						} );
  						gui.open();
  
  						render();
  
  					} );
  
  				};
  
  				loadPointCloud( 'binary/Zaghetto.pcd' );
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
