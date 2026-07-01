<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 10, 20]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three/webgpu';
import { WebGLNodesHandler } from 'three/examples/jsm/tsl/WebGLNodesHandler.js';
import { WebGLRenderer } from 'three';
import { mx_fractal_noise_float, mx_fractal_noise_vec3, positionLocal, positionWorld, Fn, color } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Shadow Map</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let dirLight, spotLight;
  			let torusKnot, dirGroup;
  
  			
  
  
  				
  
  
  				
  				scene.backgroundNode = color( 0x222244 );
  				scene.fog = new THREE.Fog( 0x222244, 50, 100 );
  
  				// lights
  
  				scene.add( new THREE.AmbientLight( 0x444444, 2 ) );
  
  				spotLight = new THREE.SpotLight( 0xff8888, 400 );
  				spotLight.angle = Math.PI / 5;
  				spotLight.penumbra = 0.3;
  				spotLight.position.set( 8, 10, 5 );
  				spotLight.castShadow = true;
  				spotLight.shadow.camera.near = 8;
  				spotLight.shadow.camera.far = 200;
  				spotLight.shadow.mapSize.width = 2048;
  				spotLight.shadow.mapSize.height = 2048;
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
  				dirLight.shadow.mapSize.width = 2048;
  				dirLight.shadow.mapSize.height = 2048;
  				dirLight.shadow.radius = 4;
  
  				dirGroup = new THREE.Group();
  				dirGroup.add( dirLight );
  				scene.add( dirGroup );
  
  				// geometry
  
  				const geometry = new THREE.TorusKnotGeometry( 25, 8, 75, 80 );
  				const material = new THREE.MeshPhongNodeMaterial( {
  					color: 0x999999,
  					shininess: 0,
  					specular: 0x222222
  				} );
  
  				const materialCustomShadow = material.clone();
  				materialCustomShadow.transparent = true;
  
  				const discardNode = mx_fractal_noise_float( positionLocal.mul( 0.1 ) ).x.greaterThan( 0.0 );
  
  				materialCustomShadow.maskNode = discardNode;
  
  				torusKnot = new THREE.Mesh( geometry, materialCustomShadow );
  				torusKnot.scale.multiplyScalar( 1 / 18 );
  				torusKnot.position.y = 3;
  				torusKnot.castShadow = true;
  				torusKnot.receiveShadow = true;
  				scene.add( torusKnot );
  
  				const cylinderGeometry = new THREE.CylinderGeometry( 0.75, 0.75, 7, 32 );
  
  				const pillar1 = new THREE.Mesh( cylinderGeometry, material );
  				pillar1.position.set( 8, 3.5, 8 );
  				pillar1.castShadow = true;
  
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
  
  				const planeMaterial = new THREE.MeshPhongNodeMaterial();
  				planeMaterial.color.setHex( 0x999999 );
  				planeMaterial.shininess = 0;
  				planeMaterial.specular.setHex( 0x111111 );
  
  				planeMaterial.colorNode = Fn( () => {
  
  					const pos = positionWorld.toVar();
  					pos.xz.addAssign( mx_fractal_noise_vec3( positionWorld.mul( 2 ) ).saturate().xz );
  					return mx_fractal_noise_vec3( positionWorld.mul( 2 ) ).saturate().zzz.mul( 0.2 ).add( .5 );
  
  				} )();
  
  				const ground = new THREE.Mesh( planeGeometry, planeMaterial );
  				ground.rotation.x = - Math.PI / 2;
  				ground.scale.multiplyScalar( 3 );
  				ground.castShadow = true;
  				ground.receiveShadow = true;
  				scene.add( ground );
  
  				// renderer
  
  				
  				renderer.setNodesHandler( new WebGLNodesHandler() );
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				// Mouse control
  
  				controls.target.set( 0, 2, 0 );
  				controls.minDistance = 7;
  				controls.maxDistance = 40;
  				controls.update();
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  			
  
  
  			function resize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			function animate( time ) {
  
  				timer.update();
  
  				const delta = timer.getDelta();
  
  				torusKnot.rotation.x += 0.25 * delta;
  				torusKnot.rotation.y += 0.5 * delta;
  				torusKnot.rotation.z += 1 * delta;
  
  				dirGroup.rotation.y += 0.7 * delta;
  				dirLight.position.z = 17 + Math.sin( time * 0.001 ) * 5;
  
  
  
  			}
  
  		
}
</script>
