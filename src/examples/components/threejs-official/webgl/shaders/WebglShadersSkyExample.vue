<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 100, 2000]"
    :camera-options="{ fov: 60, near: 100, far: 2000000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - sky + sun shader"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let sky, sun;
  
  			
  			function initSky() {
  
  				// Add Sky
  				sky = new Sky();
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
  
  					const uniforms = sky.material.uniforms;
  					uniforms[ 'turbidity' ].value = effectController.turbidity;
  					uniforms[ 'rayleigh' ].value = effectController.rayleigh;
  					uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
  					uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;
  					uniforms[ 'cloudCoverage' ].value = effectController.cloudCoverage;
  					uniforms[ 'cloudDensity' ].value = effectController.cloudDensity;
  					uniforms[ 'cloudElevation' ].value = effectController.cloudElevation;
  					uniforms[ 'showSunDisc' ].value = effectController.showSunDisc;
  
  					const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
  					const theta = THREE.MathUtils.degToRad( effectController.azimuth );
  
  					sun.setFromSphericalCoords( 1, phi, theta );
  
  					uniforms[ 'sunPosition' ].value.copy( sun );
  
  					renderer.toneMappingExposure = effectController.exposure;
  
  				}
  
  				const gui = new GUI();
  
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
  
  			
  
  
  				
  
  
  				
  
  				const helper = new THREE.GridHelper( 10000, 2, 0xffffff, 0xffffff );
  				scene.add( helper );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 0.5;
  
  
  
  				//controls.maxPolarAngle = Math.PI / 2;
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				initSky();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    sky.material.uniforms[ 'time' ].value = performance.now() * 0.001;
  })
  
  		
}
</script>
