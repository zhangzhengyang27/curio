<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[25, 25, 50]"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - animation - basic use"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats, timer;
  
  
  			
  
  
  				
  
  				//
  
  				
  
  
  
  				//
  
  				const axesHelper = new THREE.AxesHelper( 10 );
  				scene.add( axesHelper );
  
  				//
  
  				const geometry = new THREE.BoxGeometry( 5, 5, 5 );
  				const material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true } );
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				// create a keyframe track (i.e. a timed sequence of keyframes) for each animated property
  				// Note: the keyframe track type should correspond to the type of the property being animated
  
  				// POSITION
  				const positionKF = new THREE.VectorKeyframeTrack( '.position', [ 0, 1, 2 ], [ 0, 0, 0, 30, 0, 0, 0, 0, 0 ] );
  
  				// SCALE
  				const scaleKF = new THREE.VectorKeyframeTrack( '.scale', [ 0, 1, 2 ], [ 1, 1, 1, 2, 2, 2, 1, 1, 1 ] );
  
  				// ROTATION
  				// Rotation should be performed using quaternions, using a THREE.QuaternionKeyframeTrack
  				// Interpolating Euler angles (.rotation property) can be problematic and is currently not supported
  
  				// set up rotation about x axis
  				const xAxis = new THREE.Vector3( 1, 0, 0 );
  
  				const qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, 0 );
  				const qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, Math.PI );
  				const quaternionKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [ 0, 1, 2 ], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w, qInitial.x, qInitial.y, qInitial.z, qInitial.w ] );
  
  				// COLOR
  				const colorKF = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 1, 2 ], [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ], THREE.InterpolateDiscrete );
  
  				// OPACITY
  				const opacityKF = new THREE.NumberKeyframeTrack( '.material.opacity', [ 0, 1, 2 ], [ 1, 0, 1 ] );
  
  				// create an animation sequence with the tracks
  				// If a negative time value is passed, the duration will be calculated from the times of the passed tracks array
  				const clip = new THREE.AnimationClip( 'Action', 3, [ scaleKF, positionKF, quaternionKF, colorKF, opacityKF ] );
  
  				// setup the THREE.AnimationMixer
  				mixer = new THREE.AnimationMixer( mesh );
  
  				// create a ClipAction and set it to play
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
