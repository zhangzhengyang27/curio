<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 10, 40]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>PointLight ShadowMap</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let pointLight, pointLight2;
  
  			init();
  
  			async function init() {
  
  				
  
  
  				
  				scene.add( new THREE.AmbientLight( 0x111122, 3 ) );
  
  				// lights
  
  				function createLight( color ) {
  
  					const intensity = 200;
  
  					const light = new THREE.PointLight( color, intensity, 20 );
  					light.castShadow = true;
  					light.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
  					light.shadow.mapSize.width = 128;
  					light.shadow.radius = 10;
  
  					let geometry = new THREE.SphereGeometry( 0.3, 12, 6 );
  					let material = new THREE.MeshBasicMaterial( { color: color } );
  					material.color.multiplyScalar( intensity );
  					let sphere = new THREE.Mesh( geometry, material );
  					light.add( sphere );
  
  					const texture = new THREE.CanvasTexture( generateTexture() );
  					texture.magFilter = THREE.NearestFilter;
  					texture.wrapT = THREE.RepeatWrapping;
  					texture.wrapS = THREE.RepeatWrapping;
  					texture.repeat.set( 1, 4.5 );
  
  					geometry = new THREE.SphereGeometry( 2, 32, 8 );
  					material = new THREE.MeshPhongNodeMaterial( {
  						side: THREE.DoubleSide,
  						alphaMap: texture,
  						alphaTest: 0.5
  					} );
  
  					sphere = new THREE.Mesh( geometry, material );
  					sphere.castShadow = true;
  					sphere.receiveShadow = true;
  					light.add( sphere );
  
  					return light;
  
  				}
  
  				pointLight = createLight( 0x0088ff );
  				scene.add( pointLight );
  
  				pointLight2 = createLight( 0xff8888 );
  				scene.add( pointLight2 );
  				//
  
  				const geometry = new THREE.BoxGeometry( 30, 30, 30 );
  
  				const material = new THREE.MeshPhongNodeMaterial( {
  					color: 0xa0adaf,
  					shininess: 10,
  					specular: 0x111111,
  					side: THREE.BackSide
  				} );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.position.y = 10;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				// renderer.shadowMap.type = THREE.BasicShadowMap;
  				renderer.inspector = new Inspector();
  
  
  				controls.target.set( 0, 10, 0 );
  				controls.update();
  
  
  
  				//
  
  				
  
  			}
  
  			
  
  			function generateTexture() {
  
  				const canvas = document.createElement( 'canvas' );
  				canvas.width = 2;
  				canvas.height = 2;
  
  				const context = canvas.getContext( '2d' );
  				context.fillStyle = 'white';
  				context.fillRect( 0, 1, 2, 1 );
  
  				return canvas;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    let time = performance.now() * 0.001;
    				pointLight.position.x = Math.sin( time * 0.6 ) * 9;
    				pointLight.position.y = Math.sin( time * 0.7 ) * 9 + 6;
    				pointLight.position.z = Math.sin( time * 0.8 ) * 9;
    				pointLight.rotation.x = time;
    				pointLight.rotation.z = time;
    				time += 10000;
    				pointLight2.position.x = Math.sin( time * 0.6 ) * 9;
    				pointLight2.position.y = Math.sin( time * 0.7 ) * 9 + 6;
    				pointLight2.position.z = Math.sin( time * 0.8 ) * 9;
    				pointLight2.rotation.x = time;
    				pointLight2.rotation.z = time;
  })
  
  		
}
</script>
