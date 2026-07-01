<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[3, 0.15, 3]"
    :camera-options="{ fov: 35, near: 1, far: 15 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\tSTL loader test by <a href=\"https://github.com/aleeper\" target=\"_blank\" rel=\"noopener\">aleeper</a>.<br/>\n\t\t\tPR2 head from <a href=\"http://www.ros.org/wiki/pr2_description\">www.ros.org</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  			let cameraTarget;
  
  			
  
  
  				
  
  
  				cameraTarget = new THREE.Vector3( 0, - 0.25, 0 );
  
  				
  				scene.background = new THREE.Color( 0x72645b );
  				scene.fog = new THREE.Fog( 0x72645b, 2, 15 );
  
  				// Ground
  
  				const plane = new THREE.Mesh(
  					new THREE.PlaneGeometry( 40, 40 ),
  					new THREE.MeshPhongMaterial( { color: 0xcbcbcb, specular: 0x474747 } )
  				);
  				plane.rotation.x = - Math.PI / 2;
  				plane.position.y = - 0.5;
  				scene.add( plane );
  
  				plane.receiveShadow = true;
  
  
  				// ASCII file
  
  				const loader = new STLLoader();
  				loader.load( './models/stl/ascii/slotted_disk.stl', function ( geometry ) {
  
  					const material = new THREE.MeshPhongMaterial( { color: 0xff9c7c, specular: 0x494949, shininess: 200 } );
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.set( 0, - 0.25, 0.6 );
  					mesh.rotation.set( 0, - Math.PI / 2, 0 );
  					mesh.scale.set( 0.5, 0.5, 0.5 );
  
  					mesh.castShadow = true;
  					mesh.receiveShadow = true;
  
  					scene.add( mesh );
  
  				} );
  
  
  				// Binary files
  
  				const material = new THREE.MeshPhongMaterial( { color: 0xd5d5d5, specular: 0x494949, shininess: 200 } );
  
  				loader.load( './models/stl/binary/pr2_head_pan.stl', function ( geometry ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.set( 0, - 0.37, - 0.6 );
  					mesh.rotation.set( - Math.PI / 2, 0, 0 );
  					mesh.scale.set( 2, 2, 2 );
  
  					mesh.castShadow = true;
  					mesh.receiveShadow = true;
  
  					scene.add( mesh );
  
  				} );
  
  				loader.load( './models/stl/binary/pr2_head_tilt.stl', function ( geometry ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.set( 0.136, - 0.37, - 0.6 );
  					mesh.rotation.set( - Math.PI / 2, 0.3, 0 );
  					mesh.scale.set( 2, 2, 2 );
  
  					mesh.castShadow = true;
  					mesh.receiveShadow = true;
  
  					scene.add( mesh );
  
  				} );
  
  				// Colored binary STL
  				loader.load( './models/stl/binary/colored.stl', function ( geometry ) {
  
  					let meshMaterial = material;
  
  					if ( geometry.hasColors ) {
  
  						meshMaterial = new THREE.MeshPhongMaterial( { opacity: geometry.alpha, vertexColors: true } );
  
  					}
  
  					const mesh = new THREE.Mesh( geometry, meshMaterial );
  
  					mesh.position.set( 0.5, 0.2, 0 );
  					mesh.rotation.set( - Math.PI / 2, Math.PI / 2, 0 );
  					mesh.scale.set( 0.3, 0.3, 0.3 );
  
  					mesh.castShadow = true;
  					mesh.receiveShadow = true;
  
  					scene.add( mesh );
  
  				} );
  
  
  				// Lights
  
  				scene.add( new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 ) );
  
  				addShadowedLight( 1, 1, 1, 0xffffff, 3.5 );
  				addShadowedLight( 0.5, 1, - 1, 0xffd500, 3 );
  				// renderer
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  
  
  				// stats
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			function addShadowedLight( x, y, z, color, intensity ) {
  
  				const directionalLight = new THREE.DirectionalLight( color, intensity );
  				directionalLight.position.set( x, y, z );
  				scene.add( directionalLight );
  
  				directionalLight.castShadow = true;
  
  				const d = 1;
  				directionalLight.shadow.camera.left = - d;
  				directionalLight.shadow.camera.right = d;
  				directionalLight.shadow.camera.top = d;
  				directionalLight.shadow.camera.bottom = - d;
  
  				directionalLight.shadow.camera.near = 1;
  				directionalLight.shadow.camera.far = 4;
  
  				directionalLight.shadow.bias = - 0.002;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const timer = Date.now() * 0.0005;
    				camera.position.x = Math.cos( timer ) * 3;
    				camera.position.z = Math.sin( timer ) * 3;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const timer = Date.now() * 0.0005;
  
  				camera.position.x = Math.cos( timer ) * 3;
  				camera.position.z = Math.sin( timer ) * 3;
  
  
  
  
  
  			}
  
  		
}
</script>
