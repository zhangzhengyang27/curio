<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[8, 8, 8]"
    :camera-options="{ fov: 35, near: 0.1, far: 100 }"
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
import { MDDLoader } from 'three/examples/jsm/loaders/MDDLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - MDDLoader"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mixer, timer;
  
  			
  
  
  				
  
  				
  
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				//
  
  				const loader = new MDDLoader();
  				loader.load( ASSET_HOST + 'models/mdd/cube.mdd', function ( result ) {
  
  					const morphTargets = result.morphTargets;
  					const clip = result.clip;
  					// clip.optimize(); // optional
  
  					const geometry = new THREE.BoxGeometry();
  					geometry.morphAttributes.position = morphTargets; // apply morph targets
  
  					const material = new THREE.MeshNormalMaterial();
  
  					const mesh = new THREE.Mesh( geometry, material );
  					scene.add( mesh );
  
  					mixer = new THREE.AnimationMixer( mesh );
  					mixer.clipAction( clip ).play(); // use clip
  
  				} );
  
  				//
  
  				
  
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
  })
  
  		
}
</script>
