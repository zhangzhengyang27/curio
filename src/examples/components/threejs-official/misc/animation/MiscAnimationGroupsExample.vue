<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[50, 50, 100]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';

let mixer: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - animation - groups"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats, timer;
  
  
  			
  
  
  				
  
  				//
  
  				
  
  
  
  				// all objects of this animation group share a common animation state
  
  				const animationGroup = new THREE.AnimationObjectGroup();
  
  				//
  
  				const geometry = new THREE.BoxGeometry( 5, 5, 5 );
  				const material = new THREE.MeshBasicMaterial( { transparent: true } );
  
  				//
  
  				for ( let i = 0; i < 5; i ++ ) {
  
  					for ( let j = 0; j < 5; j ++ ) {
  
  						const mesh = new THREE.Mesh( geometry, material );
  
  						mesh.position.x = 32 - ( 16 * i );
  						mesh.position.y = 0;
  						mesh.position.z = 32 - ( 16 * j );
  
  						scene.add( mesh );
  						animationGroup.add( mesh );
  
  					}
  
  				}
  
  				// create some keyframe tracks
  
  				const xAxis = new THREE.Vector3( 1, 0, 0 );
  				const qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, 0 );
  				const qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, Math.PI );
  				const quaternionKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [ 0, 1, 2 ], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w, qInitial.x, qInitial.y, qInitial.z, qInitial.w ] );
  
  				const colorKF = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 1, 2 ], [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ], THREE.InterpolateDiscrete );
  				const opacityKF = new THREE.NumberKeyframeTrack( '.material.opacity', [ 0, 1, 2 ], [ 1, 0, 1 ] );
  
  				// create clip
  
  				const clip = new THREE.AnimationClip( 'default', 3, [ quaternionKF, colorKF, opacityKF ] );
  
  				// apply the animation group to the mixer as the root object
  
  				mixer = new THREE.AnimationMixer( animationGroup );
  
  				const clipAction = mixer.clipAction( clip );
  				clipAction.play();
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) {
    					mixer.update( delta );
    				}
    				stats.update();
  })
  
  		
}
</script>
