<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js webgl</a> - materials - dynamic cube reflection"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let stats;
  			let cube, sphere, torus, material;
  
  			let cubeCamera, cubeRenderTarget;
  
  
  			
  
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				camera.position.z = 75;
  
  				
  				scene.rotation.y = 0.5; // avoid flying objects occluding the sun
  
  				new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'quarry_01_1k.hdr', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  					} );
  
  				//
  
  				cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
  				cubeRenderTarget.texture.type = THREE.HalfFloatType;
  
  				cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
  
  				//
  
  				material = new THREE.MeshStandardMaterial( {
  					envMap: cubeRenderTarget.texture,
  					roughness: 0.05,
  					metalness: 1
  				} );
  
  				gui = new GUI();
  				gui.add( material, 'roughness', 0, 1 );
  				gui.add( material, 'metalness', 0, 1 );
  				gui.add( renderer, 'toneMappingExposure', 0, 2 ).name( 'exposure' );
  
  				sphere = new THREE.Mesh( new THREE.IcosahedronGeometry( 15, 8 ), material );
  				scene.add( sphere );
  
  				const material2 = new THREE.MeshStandardMaterial( {
  					roughness: 0.1,
  					metalness: 0
  				} );
  
  				cube = new THREE.Mesh( new THREE.BoxGeometry( 15, 15, 15 ), material2 );
  				scene.add( cube );
  
  				torus = new THREE.Mesh( new THREE.TorusKnotGeometry( 8, 3, 128, 16 ), material2 );
  				scene.add( torus );
  
  				//
  
  				
  				controls.autoRotate = true;
  
  			
  
  
  			function onWindowResized() {
  
  
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  			}
  
  			function animate( msTime ) {
  
  				const time = msTime / 1000;
  
  				cube.position.x = Math.cos( time ) * 30;
  				cube.position.y = Math.sin( time ) * 30;
  				cube.position.z = Math.sin( time ) * 30;
  
  				cube.rotation.x += 0.02;
  				cube.rotation.y += 0.03;
  
  				torus.position.x = Math.cos( time + 10 ) * 30;
  				torus.position.y = Math.sin( time + 10 ) * 30;
  				torus.position.z = Math.sin( time + 10 ) * 30;
  
  				torus.rotation.x += 0.02;
  				torus.rotation.y += 0.03;
  
  				cubeCamera.update( renderer, scene );
  
  				controls.update();
  
  
  
  				stats.update();
  
  			}
  
  		
  __stage.setCamera(camera)
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
