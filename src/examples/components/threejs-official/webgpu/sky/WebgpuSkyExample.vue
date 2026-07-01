<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 100, 2000]"
    :camera-options="{ fov: 60, near: 100, far: 2000000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Sky</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let sky, sun;
  
  			
  			function initSky() {
  
  				// Add Sky
  				sky = new SkyMesh();
  				sky.scale.setScalar( 450000 );
  				scene.add( sky );
  
  				sun = new THREE.Vector3();
  
  				/// GUI
  
  				const effectController = {
  					turbidity: 10,
  					rayleigh: 3,
  					mieCoefficient: 0.005,
  					mieDirectionalG: 0.7,
  					elevation: 2,
  					azimuth: 180,
  					exposure: renderer.toneMappingExposure,
  					cloudCoverage: 0.4,
  					cloudDensity: 0.4,
  					cloudElevation: 0.5,
  					showSunDisc: true
  				};
  
  				function guiChanged() {
  
  					sky.turbidity.value = effectController.turbidity;
  					sky.rayleigh.value = effectController.rayleigh;
  					sky.mieCoefficient.value = effectController.mieCoefficient;
  					sky.mieDirectionalG.value = effectController.mieDirectionalG;
  					sky.cloudCoverage.value = effectController.cloudCoverage;
  					sky.cloudDensity.value = effectController.cloudDensity;
  					sky.cloudElevation.value = effectController.cloudElevation;
  					sky.showSunDisc.value = effectController.showSunDisc;
  
  					const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
  					const theta = THREE.MathUtils.degToRad( effectController.azimuth );
  
  					sun.setFromSphericalCoords( 1, phi, theta );
  
  					sky.sunPosition.value.copy( sun );
  
  					renderer.toneMappingExposure = effectController.exposure;
  
  				}
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
  				gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
  				gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
  				gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
  				gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
  				gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
  				gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );
  				gui.add( effectController, 'showSunDisc' ).onChange( guiChanged );
  
  				const folderClouds = gui.addFolder( 'Clouds' );
  				folderClouds.add( effectController, 'cloudCoverage', 0, 1, 0.01 ).name( 'coverage' ).onChange( guiChanged );
  				folderClouds.add( effectController, 'cloudDensity', 0, 1, 0.01 ).name( 'density' ).onChange( guiChanged );
  				folderClouds.add( effectController, 'cloudElevation', 0, 1, 0.01 ).name( 'elevation' ).onChange( guiChanged );
  
  				guiChanged();
  
  			}
  
  			
  
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 0.5;
  				renderer.inspector = new Inspector();
  
  
  
  				//controls.maxPolarAngle = Math.PI / 2;
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				initSky();
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
