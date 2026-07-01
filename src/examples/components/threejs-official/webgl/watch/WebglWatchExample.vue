<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.8, 0.5, -1.5]"
    :camera-options="{ fov: 55, near: 0.1, far: 20 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Rolex + aomap - 1200 ko"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let gui, dirLight, pointLight, bloomPass, taaPass;
  			let ready = false;
  
  			const meshes = {};
  			const materials = {};
  			const torad = Math.PI / 180;
  
  			const setting = {
  				roughness: 0.1,
  				metalness: 1.0,
  				opacity: 0.8,
  				threshold: 0,
  				strength: 0.007,
  				radius: 0.0,
  				postProcess: false
  			};
  
  			init();
  
  			function init() {
  
  				const container = document.getElementById( 'container' );
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 0.7;
  				renderer.shadowMap.enabled = true;
  
  
  				taaPass = new TAARenderPass( scene, camera );
  				taaPass.sampleLevel = 2;
  
  				bloomPass = new UnrealBloomPass( new THREE.Vector2( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) ), 1.5, 0.4, 0.85 );
  				bloomPass.threshold = setting.threshold;
  				bloomPass.strength = setting.strength;
  				bloomPass.radius = setting.radius;
  
  				new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'lobe.hdr', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  						scene.background = texture;
  						scene.environment = texture;
  						scene.backgroundBlurriness = 0.5;
  						scene.backgroundIntensity = 1.0;
  						scene.environmentIntensity = 1.5;
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/' );
  						loader.setDRACOLoader( new DRACOLoader().setDecoderPath( DRACO_GLTF_CONFIG ) );
  						loader.load( 'rolex.glb', function ( gltf ) {
  
  							gltf.scene.rotation.x = Math.PI * 0.25;
  
  							gltf.scene.traverse( ( child ) => {
  
  								if ( child.isMesh || child.isGroup ) {
  
  									if ( child.isMesh ) {
  
  										child.material.vertexColors = false;
  										if ( materials[ child.material.name ] ) child.material = materials[ child.material.name ];
  										else materials[ child.material.name ] = child.material;
  										if ( child.name !== 'glass' && child.name !== 'floor' ) {
  
  											child.receiveShadow = true;
  										    child.castShadow = true;
  
  										}
  
  									}
  
  									meshes[ child.name ] = child;
  
  								}
  
  							} );
  
  							scene.add( gltf.scene );
  
  							meshes.glass.material = new THREE.MeshPhysicalMaterial( {
  								color: 0x020205,
  								transparent: true, opacity: setting.opacity,
  								metalness: 0, roughness: 0,
  								iridescence: 0.3,
  								clearcoat: 1.0,
  								blending: THREE.AdditiveBlending
  							} );
  
  							ready = true;
  
  							createGUI();
  
  						} );
  
  					} );
  
  
  
  				
  				controls.minDistance = 0.3;
  				controls.maxDistance = 10;
  				controls.target.set( 0, - 0.1, 0 );
  				controls.enableDamping = true;
  				controls.dampingFactor = 0.05;
  				controls.update();
  
  				dirLight = new THREE.DirectionalLight( 0xFFFFFF, 6 );
  				dirLight.position.set( 0.2, 0.6, 0.4 );
  				dirLight.castShadow = true;
  				scene.add( dirLight );
  				const shadow = dirLight.shadow;
  				shadow.mapSize.width = shadow.mapSize.height = 2048;
  				shadow.radius = 8;
  				shadow.bias = - 0.0005;
  				const shadowCam = shadow.camera, s = 0.5;
  				shadowCam.near = 0.1;
  				shadowCam.far = 2;
  				shadowCam.right = shadowCam.top	= s;
  				shadowCam.left = shadowCam.bottom = - s;
  				// debug shadow
  				//scene.add(  new THREE.CameraHelper(shadowCam) );
  
  				pointLight = new THREE.PointLight( 0x7b8cad, 1, 0, 2 );
  				pointLight.position.set( - 0.3, - 0.2, - 0.2 );
  				scene.add( pointLight );
  
  				
  
  				moveCamera();
  
  			}
  
  			function moveCamera() {
  
  				controls.enabled = false;
  				controls.enableDamping = false;
  
  				const sph = new THREE.Spherical();
  				const target = controls.target;
  				const tmp = {
  				    distance: controls.getDistance(),
  				    phi: controls.getPolarAngle(),
  				    theta: controls.getAzimuthalAngle()
  				};
  
  				new TWEEN.Tween( tmp )
  					.to( { distance: 1, theta: - Math.PI * 0.2 }, 6000 )
  					.easing( TWEEN.Easing.Quadratic.Out )
  					.onUpdate( function ( n ) {
  
  						sph.set( n.distance, n.phi, n.theta );
  						camera.position.setFromSpherical( sph ).add( target );
  
  
  					} )
  					.onComplete( function () {
  
  						controls.enabled = true;
  						controls.enableDamping = true;
  
  					} )
  					.start();
  
  			}
  
  			function postProcess( b ) {
  
  				if ( b ) {
  
  					renderer.setEffects( [ taaPass, bloomPass ] );
  
  				} else {
  
  					renderer.setEffects( null );
  
  				}
  
  			}
  
  			function createGUI() {
  
  				gui = new GUI();
  				gui.add( setting, 'roughness', 0, 1, 0.01 ).onChange( upMaterial );
  				gui.add( setting, 'metalness', 0, 1, 0.01 ).onChange( upMaterial );
  				gui.add( setting, 'opacity', 0, 1, 0.01 ).onChange( upMaterial );
  
  				//
  
  				gui.add( setting, 'postProcess' ).onChange( postProcess );
  				gui.add( setting, 'threshold', 0, 1, 0.01 ).onChange( upBloom );
  				gui.add( setting, 'strength', 0, 0.1, 0.001 ).onChange( upBloom );
  				gui.add( setting, 'radius', 0, 1, 0.01 ).onChange( upBloom );
  
  			}
  
  			function upMaterial() {
  
  				materials.Gold.metalness = materials.Silver.metalness = setting.metalness;
  				materials.Gold.roughness = materials.Silver.roughness = setting.roughness;
  				meshes.glass.material.opacity = setting.opacity;
  
  			}
  
  			function upBloom() {
  
  				if ( ! bloomPass ) return;
  				bloomPass.threshold = setting.threshold;
  				bloomPass.strength = setting.strength;
  				bloomPass.radius = setting.radius;
  
  			}
  
  			function getTime() {
  
  				const currentDate = new Date();
  				let hour = currentDate.getHours();
  				const minute = currentDate.getMinutes();
  				const second = currentDate.getSeconds();
  				let day = currentDate.getDay();
  				const month = currentDate.getMonth();
  				const milli = currentDate.getMilliseconds();
  				if ( hour >= 12 ) hour -= 12;
  				if ( day > 30 ) day = 30;
  
  				meshes.hour.rotation.y = - hour * 30 * torad;
  				meshes.minute.rotation.y = - minute * 6 * torad;
  				meshes.second.rotation.y = - second * 6 * torad;
  				meshes.mini_03.rotation.y = - day * 12 * torad;
  				meshes.mini_02.rotation.y = - month * 30 * torad;
  				meshes.mini_01.rotation.y = - milli * 0.36 * torad;
  
  			}
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    TWEEN.update();
    				if ( ready ) getTime();
  })
  
  		
}
</script>
