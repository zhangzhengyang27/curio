<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 0.01, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { fog, rangeFogFactor, color, lights, texture, normalMap } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Selective Lights</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			let light1, light2, light3, light4;
  
  			
  
  
  				
  				camera.position.z = 7;
  
  				
  				scene.fogNode = fog( color( 0xFF00FF ), rangeFogFactor( 12, 30 ) );
  
  				const sphereGeometry = new THREE.SphereGeometry( 0.1, 16, 8 );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const normalMapTexture = textureLoader.load( './textures/water/Water_1_M_Normal.jpg' );
  				normalMapTexture.wrapS = THREE.RepeatWrapping;
  				normalMapTexture.wrapT = THREE.RepeatWrapping;
  
  				const alphaTexture = textureLoader.load( './textures/roughness_map.jpg' );
  				alphaTexture.wrapS = THREE.RepeatWrapping;
  				alphaTexture.wrapT = THREE.RepeatWrapping;
  
  				// lights
  
  				const addLight = ( hexColor, power = 1700, distance = 100 ) => {
  
  					const material = new THREE.MeshStandardNodeMaterial();
  					material.colorNode = color( hexColor );
  					material.lights = false;
  
  					const mesh = new THREE.Mesh( sphereGeometry, material );
  
  					const light = new THREE.PointLight( hexColor, 1, distance );
  					light.power = power;
  					light.add( mesh );
  
  					scene.add( light );
  
  					return light;
  
  				};
  
  				light1 = addLight( 0xff0040 );
  				light2 = addLight( 0x0040ff );
  				light3 = addLight( 0x80ff80 );
  				light4 = addLight( 0xffaa00 );
  
  				// light nodes ( selective lights )
  
  				const redLightsNode = lights( [ light1 ] );
  				const blueLightsNode = lights( [ light2 ] );
  
  				// models
  
  				const geometryTeapot = new TeapotGeometry( .8, 18 );
  
  				const leftObject = new THREE.Mesh( geometryTeapot, new THREE.MeshStandardNodeMaterial( { color: 0x555555 } ) );
  				leftObject.material.lightsNode = redLightsNode;
  				leftObject.material.roughnessNode = texture( alphaTexture );
  				leftObject.material.metalness = 0;
  				leftObject.position.x = - 3;
  				scene.add( leftObject );
  
  				const centerObject = new THREE.Mesh( geometryTeapot, new THREE.MeshStandardNodeMaterial( { color: 0x555555 } ) );
  				centerObject.material.normalNode = normalMap( texture( normalMapTexture ) );
  				centerObject.material.metalness = .5;
  				centerObject.material.roughness = .5;
  				scene.add( centerObject );
  
  				const rightObject = new THREE.Mesh( geometryTeapot, new THREE.MeshStandardNodeMaterial( { color: 0x555555 } ) );
  				rightObject.material.lightsNode = blueLightsNode;
  				rightObject.material.metalnessNode = texture( alphaTexture );
  				rightObject.position.x = 3;
  				scene.add( rightObject );
  
  				leftObject.rotation.y = centerObject.rotation.y = rightObject.rotation.y = Math.PI * - 0.5;
  				leftObject.position.y = centerObject.position.y = rightObject.position.y = - 1;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				
  				controls.minDistance = 3;
  				controls.maxDistance = 25;
  
  				// events
  
  				
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Material' );
  
  				gui.add( centerObject.material, 'roughness', 0, 1, 0.01 );
  				gui.add( centerObject.material, 'metalness', 0, 1, 0.01 );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now() / 1000;
    				const lightTime = time * 0.5;
    				light1.position.x = Math.sin( lightTime * 0.7 ) * 3;
    				light1.position.y = Math.cos( lightTime * 0.5 ) * 4;
    				light1.position.z = Math.cos( lightTime * 0.3 ) * 3;
    				light2.position.x = Math.cos( lightTime * 0.3 ) * 3;
    				light2.position.y = Math.sin( lightTime * 0.5 ) * 4;
    				light2.position.z = Math.sin( lightTime * 0.7 ) * 3;
    				light3.position.x = Math.sin( lightTime * 0.7 ) * 3;
    				light3.position.y = Math.cos( lightTime * 0.3 ) * 4;
    				light3.position.z = Math.sin( lightTime * 0.5 ) * 3;
    				light4.position.x = Math.sin( lightTime * 0.3 ) * 3;
    				light4.position.y = Math.cos( lightTime * 0.7 ) * 4;
    				light4.position.z = Math.sin( lightTime * 0.5 ) * 3;
    				/*
    				@TODO: Used to test scene light change ( currently unavailable )
    				if ( time > 2.0 && light1.parent === null ) scene.add( light1 );
    				if ( time > 2.5 && light2.parent === null ) scene.add( light2 );
    				if ( time > 3.0 && light3.parent === null ) scene.add( light3 );
    				if ( time > 3.5 && light4.parent === null ) scene.add( light4 );
    				*/
  })
  
  		
}
</script>
