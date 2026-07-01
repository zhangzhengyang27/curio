<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[2.5, 1, 3]"
    :camera-look-at="[0, 1, 0]"
    :camera-options="{ fov: 50, near: 0.01, far: 30 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, color, mx_worley_noise_float, time, screenUV, vec2, uv, normalWorld, mx_fractal_noise_vec3 } from 'three/tsl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Portal</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  			let sceneMain, scenePortal;
  
  
  			const mixers = [];
  
  			
  
  
  				//
  
  				sceneMain = new THREE.Scene();
  				sceneMain.background = new THREE.Color( 0x222222 );
  				sceneMain.backgroundNode = normalWorld.y.mix( color( 0x0066ff ), color( 0xff0066 ) );
  
  				scenePortal = new THREE.Scene();
  				scenePortal.backgroundNode = mx_worley_noise_float( normalWorld.mul( 20 ).add( vec2( 0, time.oneMinus() ) ) ).mul( color( 0x0066ff ) );
  				scenePortal.name = 'Portal Scene';
  
  				//
  
  				
  
  				camera.position.multiplyScalar( .8 );
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// lights
  
  				const light = new THREE.PointLight( 0xffffff, 1 );
  				light.position.set( 0, 1, 5 );
  				light.power = 17000;
  
  				sceneMain.add( new THREE.HemisphereLight( 0xff0066, 0x0066ff, 7 ) );
  				sceneMain.add( light );
  				scenePortal.add( light.clone() );
  
  				// models
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Xbot.glb', function ( gltf ) {
  
  					const createModel = ( colorNode = null ) => {
  
  
  			
  						if ( mixers.length === 0 ) {
  
  							object = gltf.scene;
  
  						} else {
  
  							object = gltf.scene.clone();
  
  							const children = object.children[ 0 ].children;
  
  							const applyFX = ( index ) => {
  
  								children[ index ].material = children[ index ].material.clone();
  								children[ index ].material.colorNode = colorNode;
  								children[ index ].material.wireframe = true;
  
  							};
  
  							applyFX( 0 );
  							applyFX( 1 );
  
  						}
  
  						const mixer = new THREE.AnimationMixer( object );
  
  						const action = mixer.clipAction( gltf.animations[ 6 ] );
  						action.play();
  
  						mixers.push( mixer );
  
  						return object;
  
  					};
  
  					const colorNode = mx_fractal_noise_vec3( uv().mul( 20 ).add( time ) );
  
  					const modelMain = createModel();
  					const modelPortal = createModel( colorNode );
  
  					// model portal
  
  					sceneMain.add( modelMain );
  					scenePortal.add( modelPortal );
  
  				} );
  
  				// portal
  
  				const geometry = new THREE.PlaneGeometry( 1.7, 2 );
  
  				const material = new THREE.MeshBasicNodeMaterial();
  				material.colorNode = pass( scenePortal, camera ).context( { getUV: () => screenUV } );
  				material.opacityNode = uv().distance( .5 ).remapClamp( .3, .5 ).oneMinus();
  				material.side = THREE.DoubleSide;
  				material.transparent = true;
  
  				const plane = new THREE.Mesh( geometry, material );
  				plane.position.set( 0, 1, .8 );
  				sceneMain.add( plane );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.LinearToneMapping;
  				renderer.toneMappingExposure = 0.15;
  				renderer.inspector = new Inspector();
  
  
  				//
  
  
  				controls.target.set( 0, 1, 0 );
  				controls.update();
  
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				for ( const mixer of mixers ) {
    					mixer.update( delta );
    				}
  })
  
  		
}
</script>
