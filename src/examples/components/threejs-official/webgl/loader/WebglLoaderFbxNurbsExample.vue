<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 18, 28]"
    :camera-options="{ fov: 45, near: 1, far: 2000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - FBXLoader - Nurbs"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  
  			
  
  
  				
  
  				
  
  
  				
  
  				// grid
  				const gridHelper = new THREE.GridHelper( 28, 28, 0x303030, 0x303030 );
  				scene.add( gridHelper );
  
  				// stats
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// model
  				const loader = new FBXLoader();
  				loader.load( ASSET_HOST + 'models/fbx/nurbs.fbx', function ( object ) {
  
  					scene.add( object );
  
  				} );
  
  				
  
  
  				controls.target.set( 0, 12, 0 );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
  })
  
  		
}
</script>
