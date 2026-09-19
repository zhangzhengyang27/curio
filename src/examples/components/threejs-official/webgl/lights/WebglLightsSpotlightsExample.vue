<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[4.6, 2.2, -2.1]"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - SpotLights<br/>\n\t\t\tby <a href=\"http://master-domain.com\" target=\"_blank\" rel=\"noopener\">Master James</a>"
function onReady(__stage: any) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			const matFloor = new THREE.MeshPhongMaterial( { color: 0x808080 } );
  			const matBox = new THREE.MeshPhongMaterial( { color: 0xaaaaaa } );
  
  			const geoFloor = new THREE.PlaneGeometry( 100, 100 );
  			const geoBox = new THREE.BoxGeometry( 0.3, 0.1, 0.2 );
  
  			const mshFloor = new THREE.Mesh( geoFloor, matFloor );
  			mshFloor.rotation.x = - Math.PI * 0.5;
  			const mshBox = new THREE.Mesh( geoBox, matBox );
  
  			const ambient = new THREE.AmbientLight( 0x444444 );
  
  			const spotLight1 = createSpotlight( 0xFF7F00 );
  			const spotLight2 = createSpotlight( 0x00FF7F );
  			const spotLight3 = createSpotlight( 0x7F00FF );
  
  			let lightHelper1, lightHelper2, lightHelper3;
  
  			
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFShadowMap;
  
  
  
  				spotLight1.position.set( 1.5, 4, 4.5 );
  				spotLight2.position.set( 0, 4, 3.5 );
  				spotLight3.position.set( - 1.5, 4, 4.5 );
  
  				lightHelper1 = new THREE.SpotLightHelper( spotLight1 );
  				lightHelper2 = new THREE.SpotLightHelper( spotLight2 );
  				lightHelper3 = new THREE.SpotLightHelper( spotLight3 );
  
  				mshFloor.receiveShadow = true;
  				mshFloor.position.set( 0, - 0.05, 0 );
  
  				mshBox.castShadow = true;
  				mshBox.receiveShadow = true;
  				mshBox.position.set( 0, 0.5, 0 );
  
  				scene.add( mshFloor );
  				scene.add( mshBox );
  				scene.add( ambient );
  				scene.add( spotLight1, spotLight2, spotLight3 );
  				scene.add( lightHelper1, lightHelper2, lightHelper3 );
  
  
  				
  
  				controls.target.set( 0, 0.5, 0 );
  				controls.maxPolarAngle = Math.PI / 2;
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.update();
  
  			
  
  
  			function createSpotlight( color: any ) {
  
  				const newObj = new THREE.SpotLight( color, 10 );
  
  				newObj.castShadow = true;
  				newObj.angle = 0.3;
  				newObj.penumbra = 0.2;
  				newObj.decay = 2;
  				newObj.distance = 50;
  
  				return newObj;
  
  			}
  
  			
  
  			function tween( light: any ) {
  
  				new TWEEN.Tween( light ).to( {
  					angle: ( Math.random() * 0.7 ) + 0.1,
  					penumbra: Math.random() + 1
  				}, Math.random() * 3000 + 2000 )
  					.easing( TWEEN.Easing.Quadratic.Out ).start();
  
  				new TWEEN.Tween( light.position ).to( {
  					x: ( Math.random() * 3 ) - 1.5,
  					y: ( Math.random() * 1 ) + 1.5,
  					z: ( Math.random() * 3 ) - 1.5
  				}, Math.random() * 3000 + 2000 )
  					.easing( TWEEN.Easing.Quadratic.Out ).start();
  
  			}
  
  			function updateTweens() {
  
  				tween( spotLight1 );
  				tween( spotLight2 );
  				tween( spotLight3 );
  
  				setTimeout( updateTweens, 5000 );
  
  			}
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    TWEEN.update();
    				if ( lightHelper1 ) lightHelper1.update();
    				if ( lightHelper2 ) lightHelper2.update();
    				if ( lightHelper3 ) lightHelper3.update();
  })
  
  			updateTweens();
  
  		
}
</script>
