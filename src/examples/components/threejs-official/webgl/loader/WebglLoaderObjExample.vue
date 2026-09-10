<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 45, near: 0.1, far: 20 }"
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
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - OBJ/MTL loader"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  				camera.position.z = 2.5;
  
  				// scene
  
  				
  
  				const ambientLight = new THREE.AmbientLight( 0xffffff );
  				scene.add( ambientLight );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 15 );
  				camera.add( pointLight );
  				scene.add( camera );
  
  				// model
  
  				const mtlLoader = new MTLLoader().setPath( ASSET_HOST + 'models/obj/male02/' );
  				const materials = await mtlLoader.loadAsync( 'male02.mtl' );
  				materials.preload();
  
  				const objLoader = new OBJLoader().setPath( ASSET_HOST + 'models/obj/male02/' );
  				objLoader.setMaterials( materials ); // optional since OBJ assets can be loaded without an accompanying MTL file
  
  				const object = await objLoader.loadAsync( 'male02.obj' );
  
  				object.position.y = - 0.95;
  				object.scale.setScalar( 0.01 );
  				scene.add( object );
  
  				//
  
  				
  
  
  				//
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 2;
  				controls.maxDistance = 5;
  
  				//
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
