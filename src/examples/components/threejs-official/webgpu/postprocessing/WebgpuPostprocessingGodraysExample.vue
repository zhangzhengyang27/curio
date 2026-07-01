<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[-175, 50, 0]"
    :camera-options="{ fov: 60, near: 0.1, far: 1000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, uniform, float, int, color } from 'three/tsl';
import { godrays } from 'three/examples/jsm/tsl/display/GodraysNode.js';
import { bilateralBlur } from 'three/examples/jsm/tsl/display/BilateralBlurNode.js';
import { depthAwareBlend } from 'three/examples/jsm/tsl/display/depthAwareBlend.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Godrays</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let renderPipeline;
  
  			const params = {
  				enabledBlur: true,
  			};
  
  			
  			async 
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				// asset
  
  				const loader = new GLTFLoader();
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/godrays_demo.glb' );
  				scene.add( gltf.scene );
  
  				const pillars = gltf.scene.getObjectByName( 'concrete' );
  				pillars.material = new THREE.MeshStandardMaterial( {
  					color: 0x333333,
  				} );
  
  				const base = gltf.scene.getObjectByName( 'base' );
  				base.material = new THREE.MeshStandardMaterial( {
  					color: 0x333333,
  					side: THREE.DoubleSide,
  				} );
  
  				// lights
  
  				const lightPos = new THREE.Vector3( 0, 50, 0 );
  				const lightSphereMaterial = new THREE.MeshBasicMaterial( {
  					color: 0xffffff,
  				} );
  				const lightSphere = new THREE.Mesh( new THREE.SphereGeometry( 0.5, 16, 16 ), lightSphereMaterial );
  				lightSphere.position.copy( lightPos );
  				scene.add( lightSphere );
  
  				scene.add( new THREE.AmbientLight( 0xcccccc, 0.4 ) );
  
  				const pointLight = new THREE.PointLight( 0xf6287d, 10000 );
  				pointLight.castShadow = true;
  				pointLight.shadow.bias = - 0.00001;
  				pointLight.shadow.mapSize.width = 2048;
  				pointLight.shadow.mapSize.height = 2048;
  				pointLight.position.copy( lightPos );
  				scene.add( pointLight );
  
  				setupBackdrop();
  
  				// shadow setup
  
  				scene.traverse( obj => {
  
  					if ( obj.isMesh === true ) {
  
  						obj.castShadow = true;
  						obj.receiveShadow = true;
  
  					}
  
  				} );
  
  				lightSphere.castShadow = false;
  				lightSphere.receiveShadow = false;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.shadowMap.enabled = true;
  
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				// beauty
  
  				const scenePass = pass( scene, camera );
  				const scenePassColor = scenePass.getTextureNode( 'output' );
  				const scenePassDepth = scenePass.getTextureNode( 'depth' );
  
  				// godrays
  			
  				const godraysPass = godrays( scenePassDepth, camera, pointLight );
  				const godraysPassColor = godraysPass.getTextureNode();
  
  				// blur
  
  				const blurPass = bilateralBlur( godraysPassColor );
  				const blurPassColor = blurPass.getTextureNode();
  
  				// composite
  
  				const blendColor = uniform( color( 0xf6287d ) );
  				const edgeRadius = uniform( int( 2 ) );
  				const edgeStrength = uniform( float( 2 ) );
  
  				const outputBlurred = depthAwareBlend( scenePassColor, blurPassColor, scenePassDepth, camera, { blendColor, edgeRadius, edgeStrength } );
  				const outputRaw = depthAwareBlend( scenePassColor, godraysPassColor, scenePassDepth, camera, { blendColor, edgeRadius, edgeStrength } );
  			
  				renderPipeline.outputNode = outputBlurred;
  
  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				const godraysFolder = gui.addFolder( 'Godrays' );
  				godraysFolder.add( godraysPass.raymarchSteps, 'value', 24, 120 ).step( 1 ).name( 'raymarch steps' );
  				godraysFolder.add( godraysPass.density, 'value', 0, 1 ).name( 'density' );
  				godraysFolder.add( godraysPass.maxDensity, 'value', 0, 1 ).name( 'max density' );
  				godraysFolder.add( godraysPass.distanceAttenuation, 'value', 0, 5 ).name( 'distance attenuation' );
  			
  				const compositeFolder = gui.addFolder( 'composite' );
  				compositeFolder.add( edgeRadius, 'value', 0, 5, 1 ).name( 'edge radius' );
  				compositeFolder.add( edgeStrength, 'value', 0, 5 ).name( 'edge strength' );
  			
  				const blurFolder = gui.addFolder( 'blur' );
  				blurFolder.add( params, 'enabledBlur' ).name( 'enabled' ).onChange( ( value ) => {
  
  					if ( value === true ) {
  
  						renderPipeline.outputNode = outputBlurred;
  
  					} else {
  
  						renderPipeline.outputNode = outputRaw;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  				} );
  
  				//
  
  				
  				controls.target.set( 0, 0.5, 0 );
  				controls.enableDamping = true;
  				controls.maxDistance = 200;
  				controls.update();
  
  				
  
  			
  
  
  
  			function setupBackdrop() {
  
  				 const backdropDistance = 200;
  				// Add backdrop walls `backdropDistance` units away from the origin
  				const backdropGeometry = new THREE.PlaneGeometry( 400, 200 );
  				const backdropMaterial = new THREE.MeshBasicMaterial( {
  					color: 0x000000,
  					side: THREE.DoubleSide,
  				} );
  				const backdropLeft = new THREE.Mesh( backdropGeometry, backdropMaterial );
  				backdropLeft.position.set( - backdropDistance, 100, 0 );
  				backdropLeft.rotateY( Math.PI / 2 );
  				scene.add( backdropLeft );
  			
  				const backdropRight = new THREE.Mesh( backdropGeometry, backdropMaterial );
  				backdropRight.position.set( backdropDistance, 100, 0 );
  				backdropRight.rotateY( Math.PI / 2 );
  				scene.add( backdropRight );
  			
  				const backdropFront = new THREE.Mesh( backdropGeometry, backdropMaterial );
  				backdropFront.position.set( 0, 100, - backdropDistance );
  				scene.add( backdropFront );
  			
  				const backdropBack = new THREE.Mesh( backdropGeometry, backdropMaterial );
  				backdropBack.position.set( 0, 100, backdropDistance );
  				scene.add( backdropBack );
  			
  				const backdropTop = new THREE.Mesh( backdropGeometry, backdropMaterial );
  				backdropTop.position.set( 0, 200, 0 );
  				backdropTop.rotateX( Math.PI / 2 );
  				backdropTop.scale.set( 3, 6, 1 );
  				scene.add( backdropTop );
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  		
}
</script>
