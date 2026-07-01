<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[-6, 5, 6]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
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
import { mix, pass, renderOutput, smoothstep, uniform, vec3 } from 'three/tsl';
import { boxBlur } from 'three/examples/jsm/tsl/display/boxBlur.js';
import { fxaa } from 'three/examples/jsm/tsl/display/FXAANode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>DoF Basic</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let timer, model, mixer, raycaster, renderPipeline;
  
  			const pointerCoords = new THREE.Vector2();
  			const focusPoint = new THREE.Vector3( 1, 1.75, - 0.4 );
  			const focusPointView = uniform( vec3() );
  
  			
  			async 
  
  
  				
  
  
  				
  				controls.target.set( 0, 2, 0 );
  				controls.enableDamping = true;
  				controls.update();
  
  				
  				scene.background = new THREE.Color( 0x90D5FF );
  
  				raycaster = new THREE.Raycaster();
  
  				timer = new THREE.Timer();
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  			
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  				const gltf = await loader.loadAsync( ASSET_HOST + 'models/gltf/bath_day.glb' );
  
  				model = gltf.scene;
  				scene.add( model );
  
  				mixer = new THREE.AnimationMixer( model );
  				const action = mixer.clipAction( gltf.animations[ 0 ] );
  				action.play();
  
  				//
  
  				const hdrLoader = new UltraHDRLoader();
  				const envMap = await hdrLoader.loadAsync( ASSET_HOST + 'textures/equirectangular/spruit_sunrise_2k.hdr.jpg' );
  				envMap.mapping = THREE.EquirectangularReflectionMapping;
  				scene.environmentRotation.y = Math.PI * - 0.5;
  				scene.environment = envMap;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputColorTransform = false;
  
  				// DOF uniforms
  
  				const blurSize = uniform( 2 ); // determines the kernel size of the blur
  				const blurSpread = uniform( 4 ); // determines how far the blur is spread
  				const minDistance = uniform( 1 ); // all positions at or below minDistance will be completely in focus.
  				const maxDistance = uniform( 3 ); // all positions at or beyond maxDistance will be completely out of focus.
  
  				// beauty and blur/out-of-focus pass
  
  				const scenePass = pass( scene, camera );
  			
  				const scenePassColor = scenePass.getTextureNode().toInspector( 'Color' );
  				const scenePassViewZ = scenePass.getViewZNode();
  				const scenePassBlurred = boxBlur( scenePassColor, { size: blurSize, separation: blurSpread } );
  
  				// simple DOF from https://lettier.github.io/3d-game-shaders-for-beginners/depth-of-field.html
  
  				const blur = smoothstep( minDistance, maxDistance, scenePassViewZ.sub( focusPointView.z ).abs() );
  				const dofPass = mix( scenePassColor, scenePassBlurred, blur );
  
  				const outputPass = renderOutput( dofPass );
  				const fxaaPass = fxaa( outputPass );
  
  				renderPipeline.outputNode = fxaaPass;
  
  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( minDistance, 'value', 0, 3 ).name( 'min distance' );
  				gui.add( maxDistance, 'value', 0, 5 ).name( 'max distance' );
  				gui.add( blurSize, 'value', 1, 3, 1 ).name( 'blur size' );
  				gui.add( blurSpread, 'value', 1, 7, 1 ).name( 'blur spread' );
  
  				//
  
  				controls.connect( renderer.domElement );
  
  				renderer.domElement.addEventListener( 'pointerdown', onPointerDown );
  
  				
  
  			
  
  
  			function onPointerDown( event ) {
  
  				pointerCoords.set(
  					( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1,
  					- ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1
  				);
  
  				raycaster.setFromCamera( pointerCoords, camera );
  
  				const intersects = raycaster.intersectObject( model );
  
  				if ( intersects.length > 0 ) {
  
  					TWEEN.removeAll();
  
  					new TWEEN.Tween( focusPoint )
  						.to( intersects[ 0 ].point, 500 )
  						.easing( TWEEN.Easing.Cubic.InOut )
  						.start();
  
  				}
  			
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    TWEEN.update();
    				timer.update();
    				mixer.update( timer.getDelta() );
    				// since the focus point is expressed in view space, it must be updated on every
    				// camera change. for simplicity, do this every frame.
    				camera.updateMatrixWorld();
    				focusPointView.value.copy( focusPoint ).applyMatrix4( camera.matrixWorldInverse );
    				renderPipeline.render();
  })
  
  		
}
</script>
