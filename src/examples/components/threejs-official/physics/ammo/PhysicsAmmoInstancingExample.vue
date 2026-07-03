<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1, 1.5, 2]"
    :camera-look-at="[0, 0.5, 0]"
    :camera-options="{ fov: 50, near: 0.1, far: 100 }"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
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
import { AmmoPhysics } from 'three/examples/jsm/physics/AmmoPhysics.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let _intervalId = null

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> physics - ammo.js instancing"
async function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let stats;
  			let physics, position;
  
  			let boxes, spheres;
  
  			
  			async 
  
  
  				physics = await AmmoPhysics();
  				position = new THREE.Vector3();
  
  				//
  
  				
  
  
  
  				
  				scene.background = new THREE.Color( 0x666666 );
  
  				const hemiLight = new THREE.HemisphereLight();
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( 5, 5, 5 );
  				dirLight.castShadow = true;
  				dirLight.shadow.camera.zoom = 2;
  				scene.add( dirLight );
  
  				const shadowPlane = new THREE.Mesh(
  					new THREE.PlaneGeometry( 10, 10 ),
  					new THREE.ShadowMaterial( {
  						color: 0x444444
  					} ),
  				);
  				shadowPlane.rotation.x = - Math.PI / 2;
  				shadowPlane.receiveShadow = true;
  				scene.add( shadowPlane );
  
  				const floorCollider = new THREE.Mesh(
  					new THREE.BoxGeometry( 10, 5, 10 ),
  					new THREE.MeshBasicMaterial( { color: 0x666666 } )
  				);
  				floorCollider.position.y = - 2.5;
  				floorCollider.userData.physics = { mass: 0 };
  				floorCollider.visible = false;
  				scene.add( floorCollider );
  
  				//
  
  				const material = new THREE.MeshLambertMaterial();
  
  				const matrix = new THREE.Matrix4();
  				const color = new THREE.Color();
  
  				// Boxes
  
  				const geometryBox = new THREE.BoxGeometry( 0.075, 0.075, 0.075 );
  				boxes = new THREE.InstancedMesh( geometryBox, material, 400 );
  				boxes.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
  				boxes.castShadow = true;
  				boxes.receiveShadow = true;
  				boxes.userData.physics = { mass: 1 };
  				scene.add( boxes );
  
  				for ( let i = 0; i < boxes.count; i ++ ) {
  
  					matrix.setPosition( Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5 );
  					boxes.setMatrixAt( i, matrix );
  					boxes.setColorAt( i, color.setHex( 0xffffff * Math.random() ) );
  
  				}
  
  				// Spheres
  
  				const geometrySphere = new THREE.IcosahedronGeometry( 0.05, 4 );
  				spheres = new THREE.InstancedMesh( geometrySphere, material, 400 );
  				spheres.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
  				spheres.castShadow = true;
  				spheres.receiveShadow = true;
  				spheres.userData.physics = { mass: 1 };
  				scene.add( spheres );
  
  				for ( let i = 0; i < spheres.count; i ++ ) {
  
  					matrix.setPosition( Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5 );
  					spheres.setMatrixAt( i, matrix );
  					spheres.setColorAt( i, color.setHex( 0xffffff * Math.random() ) );
  
  				}
  
  				physics.addScene( scene );
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  
  				controls.target.y = 0.5;
  				controls.update();
  
  				_intervalId = setInterval( () => {
  
  					let index = Math.floor( Math.random() * boxes.count );
  
  					position.set( 0, Math.random() + 1, 0 );
  					physics.setMeshPosition( boxes, position, index );
  
  					//
  
  					index = Math.floor( Math.random() * spheres.count );
  
  					position.set( 0, Math.random() + 1, 0 );
  					physics.setMeshPosition( spheres, position, index );
  
  				}, 1000 / 60 );
  
  			
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
  })
  
  		
}
function onBeforeDispose() { if (_intervalId) { clearInterval(_intervalId); _intervalId = null } }
</script>
