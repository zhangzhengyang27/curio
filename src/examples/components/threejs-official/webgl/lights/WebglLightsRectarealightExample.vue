<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 5, -15]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
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
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - THREE.RectAreaLight<br/>\n\t\t\tby <a href=\"http://github.com/abelnation\" target=\"_blank\" rel=\"noopener\">abelnation</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let rectLight1, rectLight2, rectLight3;
  			let timer, stats;
  
  			
  
  
  				timer = new THREE.Timer();
  
  				
  
  
  				RectAreaLightUniformsLib.init();
  
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
  				matStdFloor.roughnessMap = createCheckerTexture( 400 );
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
  
  				
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  			
  
  
  			function createCheckerTexture( repeat = 1 ) {
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = 2;
  				canvas.height = 2;
  
  				const ctx = canvas.getContext( '2d' );
  				ctx.fillStyle = '#000';
  				ctx.fillRect( 0, 0, 2, 2 );
  				ctx.fillStyle = '#fff';
  				ctx.fillRect( 0, 0, 1, 1 );
  				ctx.fillRect( 1, 1, 1, 1 );
  
  				const texture = new THREE.CanvasTexture( canvas );
  				texture.repeat.set( repeat, repeat );
  				texture.magFilter = THREE.NearestFilter;
  				texture.wrapS = THREE.RepeatWrapping;
  				texture.wrapT = THREE.RepeatWrapping;
  
  				return texture;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				rectLight1.rotation.y += - delta;
    				rectLight2.rotation.y += delta * .5;
    				rectLight3.rotation.y += delta;
    				stats.update();
  })
  
  		
}
</script>
