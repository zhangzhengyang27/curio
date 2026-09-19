<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 10, 30]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
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

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - VSM Shadows example by <a href=\"https://github.com/supereggbert\">Paul Brunt</a>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let timer: any, stats: any;
  			let dirLight: any, spotLight: any;
  			let torusKnot: any, dirGroup: any;
  
  			
  
  
  				initScene();
  				initMisc();
  
  				// Init gui
  				gui = new GUI();
  
  				const config = {
  					spotlightRadius: 4,
  					spotlightSamples: 8,
  					dirlightRadius: 4,
  					dirlightSamples: 8
  				};
  
  				const spotlightFolder = gui.addFolder( 'Spotlight' );
  				spotlightFolder.add( config, 'spotlightRadius' ).name( 'radius' ).min( 0 ).max( 25 ).onChange( function ( value: any ) {
  
  					spotLight.shadow.radius = value;
  
  				} );
  
  				spotlightFolder.add( config, 'spotlightSamples', 1, 25, 1 ).name( 'samples' ).onChange( function ( value: any ) {
  
  					spotLight.shadow.blurSamples = value;
  
  				} );
  				spotlightFolder.open();
  
  				const dirlightFolder = gui.addFolder( 'Directional Light' );
  				dirlightFolder.add( config, 'dirlightRadius' ).name( 'radius' ).min( 0 ).max( 25 ).onChange( function ( value: any ) {
  
  					dirLight.shadow.radius = value;
  
  				} );
  
  				dirlightFolder.add( config, 'dirlightSamples', 1, 25, 1 ).name( 'samples' ).onChange( function ( value: any ) {
  
  					dirLight.shadow.blurSamples = value;
  
  				} );
  				dirlightFolder.open();
  
  
  				
  
  			
  
  
  			function initScene() {
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x222244 );
  				scene.fog = new THREE.Fog( 0x222244, 50, 100 );
  
  				// Lights
  
  				scene.add( new THREE.AmbientLight( 0x444444 ) );
  
  				spotLight = new THREE.SpotLight( 0xff8888, 400 );
  				spotLight.angle = Math.PI / 5;
  				spotLight.penumbra = 0.3;
  				spotLight.position.set( 8, 10, 5 );
  				spotLight.castShadow = true;
  				spotLight.shadow.camera.near = 8;
  				spotLight.shadow.camera.far = 200;
  				spotLight.shadow.mapSize.width = 256;
  				spotLight.shadow.mapSize.height = 256;
  				spotLight.shadow.bias = - 0.002;
  				spotLight.shadow.radius = 4;
  				scene.add( spotLight );
  
  
  				dirLight = new THREE.DirectionalLight( 0x8888ff, 3 );
  				dirLight.position.set( 3, 12, 17 );
  				dirLight.castShadow = true;
  				dirLight.shadow.camera.near = 0.1;
  				dirLight.shadow.camera.far = 500;
  				dirLight.shadow.camera.right = 17;
  				dirLight.shadow.camera.left = - 17;
  				dirLight.shadow.camera.top	= 17;
  				dirLight.shadow.camera.bottom = - 17;
  				dirLight.shadow.mapSize.width = 512;
  				dirLight.shadow.mapSize.height = 512;
  				dirLight.shadow.radius = 4;
  				dirLight.shadow.bias = - 0.0005;
  
  				dirGroup = new THREE.Group();
  				dirGroup.add( dirLight );
  				scene.add( dirGroup );
  
  				// Geometry
  
  				const geometry = new THREE.TorusKnotGeometry( 25, 8, 75, 20 );
  				const material = new THREE.MeshPhongMaterial( {
  					color: 0x999999,
  					shininess: 0,
  					specular: 0x222222
  				} );
  
  				torusKnot = new THREE.Mesh( geometry, material );
  				torusKnot.scale.multiplyScalar( 1 / 18 );
  				torusKnot.position.y = 3;
  				torusKnot.castShadow = true;
  				torusKnot.receiveShadow = true;
  				scene.add( torusKnot );
  
  				const cylinderGeometry = new THREE.CylinderGeometry( 0.75, 0.75, 7, 32 );
  
  				const pillar1 = new THREE.Mesh( cylinderGeometry, material );
  				pillar1.position.set( 8, 3.5, 8 );
  				pillar1.castShadow = true;
  				pillar1.receiveShadow = true;
  
  				const pillar2 = pillar1.clone();
  				pillar2.position.set( 8, 3.5, - 8 );
  				const pillar3 = pillar1.clone();
  				pillar3.position.set( - 8, 3.5, 8 );
  				const pillar4 = pillar1.clone();
  				pillar4.position.set( - 8, 3.5, - 8 );
  
  				scene.add( pillar1 );
  				scene.add( pillar2 );
  				scene.add( pillar3 );
  				scene.add( pillar4 );
  
  				const planeGeometry = new THREE.PlaneGeometry( 200, 200 );
  				const planeMaterial = new THREE.MeshPhongMaterial( {
  					color: 0x999999,
  					shininess: 0,
  					specular: 0x111111
  				} );
  
  				const ground = new THREE.Mesh( planeGeometry, planeMaterial );
  				ground.rotation.x = - Math.PI / 2;
  				ground.scale.multiplyScalar( 3 );
  				ground.castShadow = true;
  				ground.receiveShadow = true;
  				scene.add( ground );
  
  			}
  
  			function initMisc() {
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.VSMShadowMap;
  
  				// Mouse control
  
  				controls.target.set( 0, 2, 0 );
  				controls.update();
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  			}
  
  			
  
  			function animate( time: any ) {
  
  				timer.update();
  
  				const delta = timer.getDelta();
  
  				torusKnot.rotation.x += 0.25 * delta;
  				torusKnot.rotation.y += 0.5 * delta;
  				torusKnot.rotation.z += 1 * delta;
  
  				dirGroup.rotation.y += 0.7 * delta;
  				dirLight.position.z = 17 + Math.sin( time * 0.001 ) * 5;
  
  
  
  				stats.update();
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
