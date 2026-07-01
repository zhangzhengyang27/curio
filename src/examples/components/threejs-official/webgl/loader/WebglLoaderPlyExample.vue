<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[3, 0.15, 3]"
    :camera-options="{ fov: 35, near: 1, far: 15 }"
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
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\tPLY loader test by <a href=\"https://github.com/menway\" target=\"_blank\" rel=\"noopener\">Wei Meng</a>.<br/>\n\t\t\tImage from <a href=\"http://people.sc.fsu.edu/~jburkardt/data/ply/ply.html\">John Burkardt</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  			let cameraTarget;
  
  			
  
  
  				
  
  
  				cameraTarget = new THREE.Vector3( 0, - 0.1, 0 );
  
  				
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
  
  
  				// PLY file
  
  				const loader = new PLYLoader();
  				loader.load( './models/ply/ascii/dolphins.ply', function ( geometry ) {
  
  					geometry.computeVertexNormals();
  
  					const material = new THREE.MeshStandardMaterial( { color: 0x009cff, flatShading: true } );
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.y = - 0.2;
  					mesh.position.z = 0.3;
  					mesh.rotation.x = - Math.PI / 2;
  					mesh.scale.multiplyScalar( 0.001 );
  
  					mesh.castShadow = true;
  					mesh.receiveShadow = true;
  
  					scene.add( mesh );
  
  				} );
  
  				loader.load( './models/ply/binary/Lucy100k.ply', function ( geometry ) {
  
  					geometry.computeVertexNormals();
  
  					const material = new THREE.MeshStandardMaterial( { color: 0x009cff, flatShading: true } );
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.x = - 0.2;
  					mesh.position.y = - 0.02;
  					mesh.position.z = - 0.2;
  					mesh.scale.multiplyScalar( 0.0006 );
  
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
  
  				// resize
  
  				
  
  			
  
  
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
  
  				directionalLight.shadow.mapSize.width = 1024;
  				directionalLight.shadow.mapSize.height = 1024;
  
  				directionalLight.shadow.bias = - 0.001;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const timer = Date.now() * 0.0005;
    				camera.position.x = Math.sin( timer ) * 2.5;
    				camera.position.z = Math.cos( timer ) * 2.5;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const timer = Date.now() * 0.0005;
  
  				camera.position.x = Math.sin( timer ) * 2.5;
  				camera.position.z = Math.cos( timer ) * 2.5;
  
  
  
  
  
  			}
  
  		
}
</script>
