<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[7, 0, 0]"
    :camera-options="{ near: 0.1, far: 50 }"
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
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">threejs</a> - Example of <a href=\"https://cloud.needle.tools/hdris\" target=\"_blank\">FastHDR</a>, loading 10x faster and using 95% less GPU memory than EXR.<br/>Photography by <a href=\"https://cloud.needle.tools/hdris?img=Ballroom\" target=\"_blank\" rel=\"noopener\">Sergej Majboroda</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			const params = {
  				'image': 'ballroom',
  				'fov': 40,
  				'exposure': 1.0,
  				'backgroundBlurriness': 0.0
  			};
  
  			let container, stats;
  
  
  			
  
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  				//
  
  				const sphereGeometry = new THREE.SphereGeometry( 0.45, 64, 32 );
  
  				const sphere01 = new THREE.Mesh( sphereGeometry, new THREE.MeshPhysicalMaterial( {
  					transmission: 1.0,
  					thickness: 2.0,
  					metalness: 0.0,
  					roughness: 0.0,
  				} ) );
  				sphere01.position.z += 2;
  				scene.add( sphere01 );
  
  				const sphere02 = new THREE.Mesh( sphereGeometry, new THREE.MeshStandardMaterial( {
  					metalness: 0.0,
  					roughness: 1.0,
  				} ) );
  				sphere02.position.z += 1;
  				scene.add( sphere02 );
  
  				const sphere03 = new THREE.Mesh( sphereGeometry, new THREE.MeshStandardMaterial( {
  					metalness: 1.0,
  					roughness: 0.0,
  				} ) );
  				sphere03.position.z += 0;
  				scene.add( sphere03 );
  
  				const sphere04 = new THREE.Mesh( sphereGeometry, new THREE.MeshStandardMaterial( {
  					metalness: 1.0,
  					roughness: 0.5,
  					color: 0x888888
  				} ) );
  				sphere04.position.z -= 1;
  				scene.add( sphere04 );
  
  				const sphere05 = new THREE.Mesh( sphereGeometry, new THREE.MeshStandardMaterial( {
  					metalness: 0.0,
  					roughness: 0.0,
  					color: 0x6ab440
  				} ) );
  				sphere05.position.z -= 2;
  				scene.add( sphere05 );
  
  				const loader = new KTX2Loader()
  					.detectSupport( renderer );
  
  				function loadTexture( url ) {
  
  					loader.load( url, ( texture ) => {
  
  						texture.mapping = THREE.CubeUVReflectionMapping;
  						scene.environment = texture;
  						scene.background = texture;
  
  					} );
  
  				}
  
  				loadTexture( 'https://cdn.needle.tools/static/hdris/ballroom_2k.pmrem.ktx2' );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				controls.minDistance = .1;
  				controls.maxDistance = 20;
  				controls.enableDamping = true;
  
  				
  
  				const gui = new GUI();
  
  				gui.add( params, 'image', {
  					'ballroom': 'https://cdn.needle.tools/static/hdris/ballroom_2k.pmrem.ktx2',
  					'brown photostudio': 'https://cdn.needle.tools/static/hdris/brown_photostudio_02_2k.pmrem.ktx2',
  					'cape hill': 'https://cdn.needle.tools/static/hdris/cape_hill_2k.pmrem.ktx2',
  					'cannon': 'https://cdn.needle.tools/static/hdris/cannon_2k.pmrem.ktx2',
  					'metro noord': 'https://cdn.needle.tools/static/hdris/metro_noord_2k.pmrem.ktx2',
  					'the sky is on fire': 'https://cdn.needle.tools/static/hdris/the_sky_is_on_fire_2k.pmrem.ktx2',
  					'studio small 09': 'https://cdn.needle.tools/static/hdris/studio_small_09_2k.pmrem.ktx2',
  					'wide street 01': 'https://cdn.needle.tools/static/hdris/wide_street_01_2k.pmrem.ktx2'
  				} ).onChange( () => {
  
  					loadTexture( params.image );
  
  				} );
  
  				gui.add( params, 'exposure', 0, 2, 0.01 );
  
  				gui.add( params, 'fov', 10, 100 ).onChange( () => {
  
  					camera.fov = params.fov;
  					camera.updateProjectionMatrix();
  
  				} );
  
  				gui.add( params, 'backgroundBlurriness', 0, 1, 0.01 ).name( 'background blurriness' );
  
  				gui.open();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    {
    renderer.toneMappingExposure = params.exposure;
    				scene.backgroundBlurriness = params.backgroundBlurriness;
    }
    				stats.end();
  })
  
  			function render() {
  
  				renderer.toneMappingExposure = params.exposure;
  				scene.backgroundBlurriness = params.backgroundBlurriness;
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
