<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 40, near: 1, far: 5000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture, uniform, vec3 } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>SSS</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container;
  
  			let model;
  
  			
  
  
  				
  
  
  				
  
  				// Lights
  
  				scene.add( new THREE.AmbientLight( 0xc1c1c1 ) );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.03 );
  				directionalLight.position.set( 0.0, 0.5, 0.5 ).normalize();
  				scene.add( directionalLight );
  
  				const pointLight1 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xc1c1c1 } ) );
  				pointLight1.add( new THREE.PointLight( 0xc1c1c1, 4.0, 300, 0 ) );
  				scene.add( pointLight1 );
  				pointLight1.position.x = 0;
  				pointLight1.position.y = - 50;
  				pointLight1.position.z = 350;
  
  				const pointLight2 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xc1c100 } ) );
  				pointLight2.add( new THREE.PointLight( 0xc1c100, 0.75, 500, 0 ) );
  				scene.add( pointLight2 );
  				pointLight2.position.x = - 100;
  				pointLight2.position.y = 20;
  				pointLight2.position.z = - 260;
  
  				
  
  
  				//
  
  				renderer.inspector = new Inspector();
  				document.body.appendChild( renderer.inspector.domElement );
  
  				//
  
  
  				controls.minDistance = 500;
  				controls.maxDistance = 3000;
  
  				
  
  				initMaterial();
  
  			
  
  
  			function initMaterial() {
  
  				const loader = new THREE.TextureLoader();
  				const imgTexture = loader.load( ASSET_HOST + 'models/fbx/white.jpg' );
  				imgTexture.colorSpace = THREE.SRGBColorSpace;
  
  				const thicknessTexture = loader.load( ASSET_HOST + 'models/fbx/bunny_thickness.jpg' );
  				imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
  
  				const material = new THREE.MeshSSSNodeMaterial();
  				material.color = new THREE.Color( 1.0, 0.2, 0.2 );
  				material.roughness = 0.3;
  				material.thicknessColorNode = texture( thicknessTexture ).mul( vec3( 0.5, 0.3, 0.0 ) );
  				material.thicknessDistortionNode = uniform( 0.1 );
  				material.thicknessAmbientNode = uniform( 0.4 );
  				material.thicknessAttenuationNode = uniform( 0.8 );
  				material.thicknessPowerNode = uniform( 2.0 );
  				material.thicknessScaleNode = uniform( 16.0 );
  
  				// LOADER
  
  				const loaderFBX = new FBXLoader();
  				loaderFBX.load( ASSET_HOST + 'models/fbx/stanford-bunny.fbx', function ( object ) {
  
  					model = object.children[ 0 ];
  					model.position.set( 0, 0, 10 );
  					model.scale.setScalar( 1 );
  					model.material = material;
  					scene.add( model );
  
  				} );
  
  				initGUI( material );
  
  			}
  
  			function initGUI( material ) {
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				const ThicknessControls = function () {
  
  					this.distortion = material.thicknessDistortionNode.value;
  					this.ambient = material.thicknessAmbientNode.value;
  					this.attenuation = material.thicknessAttenuationNode.value;
  					this.power = material.thicknessPowerNode.value;
  					this.scale = material.thicknessScaleNode.value;
  
  				};
  
  				const thicknessControls = new ThicknessControls();
  
  				gui.add( thicknessControls, 'distortion', 0.01, 1, 0.01 ).onChange( function () {
  
  					material.thicknessDistortionNode.value = thicknessControls.distortion;
  
  				} );
  
  				gui.add( thicknessControls, 'ambient', 0.01, 5.0, 0.05 ).onChange( function () {
  
  					material.thicknessAmbientNode.value = thicknessControls.ambient;
  
  				} );
  
  				gui.add( thicknessControls, 'attenuation', 0.01, 5.0, 0.05 ).onChange( function () {
  
  					material.thicknessAttenuationNode.value = thicknessControls.attenuation;
  
  				} );
  
  				gui.add( thicknessControls, 'power', 0.01, 16.0, 0.1 ).onChange( function () {
  
  					material.thicknessPowerNode.value = thicknessControls.power;
  
  				} );
  
  				gui.add( thicknessControls, 'scale', 0.01, 50.0, 0.1 ).onChange( function () {
  
  					material.thicknessScaleNode.value = thicknessControls.scale;
  
  				} );
  
  			}
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( model ) model.rotation.y = performance.now() / 5000;
  })
  
  		
}
</script>
