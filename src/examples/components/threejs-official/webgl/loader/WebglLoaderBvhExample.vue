<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 200, 300]"
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
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
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - BVH Loader<br/>\n\t\t\tanimation from <a href=\"http://mocap.cs.cmu.edu/\">http://mocap.cs.cmu.edu/</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			let mixer;
  
  			
  			const loader = new BVHLoader();
  			loader.load( ASSET_HOST + 'models/bvh/pirouette.bvh', function ( result ) {
  
  				const skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
  
  				scene.add( result.skeleton.bones[ 0 ] );
  				scene.add( skeletonHelper );
  
  				// play animation
  				mixer = new THREE.AnimationMixer( result.skeleton.bones[ 0 ] );
  				mixer.clipAction( result.clip ).play();
  
  			} );
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xeeeeee );
  
  				scene.add( new THREE.GridHelper( 400, 10 ) );
  
  				// renderer
  				
  
  
  				controls.minDistance = 300;
  				controls.maxDistance = 700;
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
  })
  
  		
}
</script>
