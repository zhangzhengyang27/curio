<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.1, far: 100 }"
    @ready="onReady"
  />
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let mesh;
  
  			
  
  
  				
  				camera.position.z = 2;
  
  				
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/crate.gif' );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const geometry = new THREE.BoxGeometry();
  				const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    mesh.rotation.x += 0.005;
    				mesh.rotation.y += 0.01;
  })
  
  		
}
</script>
