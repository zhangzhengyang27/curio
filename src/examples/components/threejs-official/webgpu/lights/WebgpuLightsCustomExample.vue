<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.1, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, lights } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Custom Lighting Model</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			class CustomLightingModel extends THREE.LightingModel {
  
  				direct( { lightColor, reflectedLight }/*, builder */ ) {
  
  					reflectedLight.directDiffuse.addAssign( lightColor );
  
  				}
  
  			}
  
  
  			let light1, light2, light3;
  
  			
  
  
  				
  				camera.position.z = 1.5;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				// lights
  
  				const sphereGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
  
  				const addLight = ( hexColor ) => {
  
  					const material = new THREE.NodeMaterial();
  					material.colorNode = color( hexColor );
  					material.lightsNode = lights(); // ignore scene lights
  
  					const mesh = new THREE.Mesh( sphereGeometry, material );
  
  					const light = new THREE.PointLight( hexColor, 0.1, 1 );
  					light.add( mesh );
  
  					scene.add( light );
  
  					return light;
  
  				};
  
  				light1 = addLight( 0xffaa00 );
  				light2 = addLight( 0x0040ff );
  				light3 = addLight( 0x80ff80 );
  
  				//light nodes ( selective lights )
  
  				const allLightsNode = lights( [ light1, light2, light3 ] );
  
  				// points
  
  				const points = [];
  
  				for ( let i = 0; i < 500000; i ++ ) {
  
  					const point = new THREE.Vector3().random().subScalar( 0.5 ).multiplyScalar( 3 );
  					points.push( point );
  
  				}
  
  				const geometryPoints = new THREE.BufferGeometry().setFromPoints( points );
  				const materialPoints = new THREE.PointsNodeMaterial();
  
  				// custom lighting model
  
  				const lightingModel = new CustomLightingModel();
  				const lightingModelContext = allLightsNode.context( { lightingModel } );
  
  				materialPoints.lightsNode = lightingModelContext;
  
  				//
  
  				const pointCloud = new THREE.Points( geometryPoints, materialPoints );
  				scene.add( pointCloud );
  
  				//
  
  				
  
  
  				// controls
  
  
  				controls.minDistance = 0;
  				controls.maxDistance = 4;
  
  				// events
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.001;
    				const scale = .5;
    				light1.position.x = Math.sin( time * 0.7 ) * scale;
    				light1.position.y = Math.cos( time * 0.5 ) * scale;
    				light1.position.z = Math.cos( time * 0.3 ) * scale;
    				light2.position.x = Math.cos( time * 0.3 ) * scale;
    				light2.position.y = Math.sin( time * 0.5 ) * scale;
    				light2.position.z = Math.sin( time * 0.7 ) * scale;
    				light3.position.x = Math.sin( time * 0.7 ) * scale;
    				light3.position.y = Math.cos( time * 0.3 ) * scale;
    				light3.position.z = Math.sin( time * 0.5 ) * scale;
    				scene.rotation.y = time * 0.1;
  })
  
  		
}
</script>
