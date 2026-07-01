<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.01, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> - gradually transform an orientation to a target orientation"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mesh, target;
  
  			const spherical = new THREE.Spherical();
  			const rotationMatrix = new THREE.Matrix4();
  			const targetQuaternion = new THREE.Quaternion();
  			const timer = new THREE.Timer();
  			timer.connect( document );
  			const speed = Math.PI / 2;
  
  			const params = {
  				useLookAt: false,
  			};
  
  			
  
  
  				
  				camera.position.z = 5;
  
  				
  
  				const geometry = new THREE.ConeGeometry( 0.1, 0.5, 8 );
  				geometry.rotateX( Math.PI * 0.5 );
  				const material = new THREE.MeshNormalMaterial();
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				//
  
  				const targetGeometry = new THREE.SphereGeometry( 0.05 );
  				const targetMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  				target = new THREE.Mesh( targetGeometry, targetMaterial );
  				scene.add( target );
  
  				//
  
  				const sphereGeometry = new THREE.SphereGeometry( 2, 32, 32 );
  				const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xcccccc, wireframe: true, transparent: true, opacity: 0.3 } );
  				const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  				scene.add( sphere );
  
  				//
  
  				
  
  
  				//
  
  				
  
  				//
  
  				const gui = new GUI();
  
  				gui.add( params, 'useLookAt' );
  				gui.open();
  
  				//
  
  				generateTarget();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mesh.quaternion.equals( targetQuaternion ) === false ) {
    					if ( params.useLookAt === true ) {
    						// using lookAt() will make the mesh instantly look at the target
    						mesh.lookAt( target.position );
    					} else {
    						// using rotateTowards() will gradually rotate the mesh towards the target
    						// the "speed" variable represents the rotation speed in radians per seconds
    						const step = speed * delta;
    						mesh.quaternion.rotateTowards( targetQuaternion, step );
    					}
    				}
  })
  
  			function generateTarget() {
  
  				// generate a random point on a sphere
  
  				spherical.theta = Math.random() * Math.PI * 2;
  				spherical.phi = Math.acos( ( 2 * Math.random() ) - 1 );
  				spherical.radius = 2;
  
  				target.position.setFromSpherical( spherical );
  
  				// compute target rotation
  
  				rotationMatrix.lookAt( target.position, mesh.position, mesh.up );
  				targetQuaternion.setFromRotationMatrix( rotationMatrix );
  
  				setTimeout( generateTarget, 2000 );
  
  			}
  
  	
}
</script>
