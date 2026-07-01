<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[20, 10, 25]"
    :camera-options="{ fov: 45, near: 1, far: 600 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { exponentialHeightFogFactor, uniform, fog, color } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Height Fog</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			
  
  
  				
  
  
  				
  
  				// height fog
  
  				const density = uniform( 0.04 );
  				const height = uniform( 2 );
  
  				const fogFactor = exponentialHeightFogFactor( density, height );
  			
  				scene.fogNode = fog( color( 0xffdfc1 ), fogFactor );
  				scene.backgroundNode = color( 0xffdfc1 );
  
  				// meshes
  
  				const geometry = new THREE.BoxGeometry( 1, 25, 1 );
  				const material = new THREE.MeshPhongNodeMaterial( { color: 0xcd959a } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 100 );
  				mesh.position.y = - 10;
  				scene.add( mesh );
  
  				const dummy = new THREE.Object3D();
  
  				let index = 0;
  
  				for ( let i = 0; i < 10; i ++ ) {
  
  					for ( let j = 0; j < 10; j ++ ) {
  
  						dummy.position.x = - 18 + ( i * 4 );
  						dummy.position.z = - 18 + ( j * 4 );
  
  						dummy.updateMatrix();
  
  						mesh.setMatrixAt( index ++, dummy.matrix );
  
  					}
  			
  				}
  
  				// lights
  
  				const directionalLight = new THREE.DirectionalLight( 0xffc0cb, 2 );
  				directionalLight.position.set( - 10, 10, 10 );
  				scene.add( directionalLight );
  
  				const ambientLight = new THREE.AmbientLight( 0xcccccc );
  				scene.add( ambientLight );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Fog Settings' );
  
  				gui.add( density, 'value', 0.001, 0.1 ).step( 0.0001 ).name( 'Density' );
  				gui.add( height, 'value', - 5, 5 ).name( 'Height' );
  
  				// controls
  
  				
  				controls.minDistance = 7;
  				controls.maxDistance = 100;
  				controls.maxPolarAngle = Math.PI / 2;
  				controls.enableDamping = true;
  
  				
  
  			
  
  
  			function resize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
