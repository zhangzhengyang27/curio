<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 5, -15]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/examples/jsm/lights/RectAreaLightTexturesLib.js';
import { checker, uv } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Rect Area Light</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let rectLight1, rectLight2, rectLight3;
  
  
  			
  
  
  				THREE.RectAreaLightNode.setLTC( RectAreaLightTexturesLib.init() );
  
  				timer = new THREE.Timer();
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  
  
  				
  
  				rectLight1 = new THREE.RectAreaLight( 0xff0000, 5, 4, 10 );
  				rectLight1.position.set( - 5, 6, 5 );
  				scene.add( rectLight1 );
  
  				rectLight2 = new THREE.RectAreaLight( 0x00ff00, 5, 4, 10 );
  				rectLight2.position.set( 0, 6, 5 );
  				scene.add( rectLight2 );
  
  				rectLight3 = new THREE.RectAreaLight( 0x0000ff, 5, 4, 10 );
  				rectLight3.position.set( 5, 6, 5 );
  				scene.add( rectLight3 );
  
  				scene.add( new RectAreaLightHelper( rectLight1 ) );
  				scene.add( new RectAreaLightHelper( rectLight2 ) );
  				scene.add( new RectAreaLightHelper( rectLight3 ) );
  
  				const geoFloor = new THREE.BoxGeometry( 2000, 0.1, 2000 );
  				const matStdFloor = new THREE.MeshStandardMaterial( { color: 0x444444 } );
  				matStdFloor.roughnessNode = checker( uv().mul( 400 ) );
  				const mshStdFloor = new THREE.Mesh( geoFloor, matStdFloor );
  				scene.add( mshStdFloor );
  
  				const geoKnot = new THREE.TorusKnotGeometry( 1.5, 0.5, 200, 16 );
  				const matKnot = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0, metalness: 0 } );
  				const meshKnot = new THREE.Mesh( geoKnot, matKnot );
  				meshKnot.position.set( 0, 5.5, 0 );
  				scene.add( meshKnot );
  
  
  				controls.target.copy( meshKnot.position );
  				controls.update();
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				rectLight1.rotation.y += - delta;
    				rectLight2.rotation.y += delta * .5;
    				rectLight3.rotation.y += delta;
  })
  
  		
}
</script>
