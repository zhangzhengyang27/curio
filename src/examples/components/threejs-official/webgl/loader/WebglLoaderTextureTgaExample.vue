<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1, 5]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
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
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - TGA texture example by <a href=\"https://github.com/DaoshengMu/\" target=\"_blank\" rel=\"noopener\">Daosheng Mu</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  
  			
  
  
  				
  
  				
  
  
  				
  
  				//
  
  				const loader = new TGALoader();
  				const geometry = new THREE.BoxGeometry();
  
  				// add box 1 - grey8 texture
  
  				const texture1 = loader.load( ASSET_HOST + 'textures/crate_grey8.tga' );
  				texture1.colorSpace = THREE.SRGBColorSpace;
  				const material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
  
  				const mesh1 = new THREE.Mesh( geometry, material1 );
  				mesh1.position.x = - 1;
  
  				scene.add( mesh1 );
  
  				// add box 2 - tga texture
  
  				const texture2 = loader.load( ASSET_HOST + 'textures/crate_color8.tga' );
  				texture2.colorSpace = THREE.SRGBColorSpace;
  				const material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2 } );
  
  				const mesh2 = new THREE.Mesh( geometry, material2 );
  				mesh2.position.x = 1;
  
  				scene.add( mesh2 );
  
  				//
  
  				const ambientLight = new THREE.AmbientLight( 0xffffff, 1.5 );
  				scene.add( ambientLight );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 2.5 );
  				light.position.set( 1, 1, 1 );
  				scene.add( light );
  
  				//
  
  				
  
  
  				//
  
  
  				controls.enableZoom = false;
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
  })
  
  		
}
</script>
