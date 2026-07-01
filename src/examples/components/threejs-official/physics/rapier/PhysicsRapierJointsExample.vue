<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 3, 10]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RapierPhysics } from 'three/examples/jsm/physics/RapierPhysics.js';
import { RapierHelper } from 'three/examples/jsm/helpers/RapierHelper.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> physics - <a href=\"https://github.com/dimforge/rapier.js\" target=\"_blank\">rapier</a> joints"
async function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let stats;
  			let physics, pivot, physicsHelper;
  
  			
  			async 
  
  
  				
  				scene.background = new THREE.Color( 0xbfd1e5 );
  
  				
  
  
  				const ambient = new THREE.HemisphereLight( 0x555555, 0xFFFFFF );
  
  				scene.add( ambient );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 4 );
  
  				light.position.set( 0, 12.5, 12.5 );
  				light.castShadow = true;
  				light.shadow.radius = 3;
  				light.shadow.blurSamples = 8;
  				light.shadow.mapSize.width = 1024;
  				light.shadow.mapSize.height = 1024;
  
  				const size = 10;
  				light.shadow.camera.left = - size;
  				light.shadow.camera.bottom = - size;
  				light.shadow.camera.right = size;
  				light.shadow.camera.top = size;
  				light.shadow.camera.near = 1;
  				light.shadow.camera.far = 50;
  
  				scene.add( light );
  			
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  				controls.target = new THREE.Vector3( 0, 2, 0 );
  				controls.update();
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//Create pivot point
  				const geometry = new THREE.SphereGeometry( 0.5 );
  				const material = new THREE.MeshStandardMaterial( { color: 0xFF0000 } );
  			
  				pivot = new THREE.Mesh( geometry, material );
  
  				pivot.position.y = 6;
  				pivot.userData.physics = { mass: 0 };
  
  				scene.add( pivot );
  			
  				initPhysics();
  			
  				onWindowResize();
  
  				window.addEventListener( 'resize', onWindowResize, false );
  
  			
  
  
  			async function initPhysics() {
  
  				//Initialize physics engine using the script in the jsm/physics folder
  				physics = await RapierPhysics();
  
  				physics.addScene( scene );
  
  				//Optionally display collider outlines
  				physicsHelper = new RapierHelper( physics.world );
  				scene.add( physicsHelper );
  
  				const link1 = addLink( pivot, 0 );
  				const link2 = addLink( link1, 2 );
  				addLink( link2, 4 );
  
  			}
  
  			//link - the mesh that the new link will be attached to
  			//x    - used to position the new link
  			function addLink( link, x ) {
  
  				const geometry = new THREE.CapsuleGeometry( 0.25, 1.8 );
  				const material = new THREE.MeshStandardMaterial( { color: 0xCCCC00 } );
  			
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.rotateZ( Math.PI * 0.5 );
  
  				mesh.position.set( x + 0.9, 5.8, 0 );
  
  				scene.add( mesh );
  
  				physics.addMesh( mesh, 1, 0.5 );
  
  				const jointParams = physics.RAPIER.JointData.spherical(
  					( link == pivot ) ? new physics.RAPIER.Vector3( 0, - 0.5, 0 ) : new physics.RAPIER.Vector3( 0, - 1.15, 0 ), // Joint position in world space
  					new physics.RAPIER.Vector3( 0, 1.15, 0 ) // Corresponding attachment on sphere
  				);
  				const body1 = link.userData.physics.body;
  				const body2 = mesh.userData.physics.body;
  				body2.setAngularDamping( 10.0 );
  
  				physics.world.createImpulseJoint( jointParams, body1, body2, true );
  
  				return mesh;
  
  			}
  
  			function onWindowResize( ) {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( physicsHelper ) physicsHelper.update();
    				stats.update();
  })
  
  		
}
</script>
