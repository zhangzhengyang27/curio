<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[1, 2, 3]"
    :camera-look-at="[0, 1, 0]"
    :camera-options="{ fov: 50, near: 0.01, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, screenUV, mrt, output, pass, vec4 } from 'three/tsl';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>MRT Mask</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let renderPipeline;
  			let spheres, rotate = true;
  			let mixer, timer;
  
  			
  
  
  				
  
  
  				
  				scene.backgroundNode = screenUV.y.mix( color( 0x66bbff ), color( 0x4466ff ) ).mul( .05 );
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// lights
  
  				const light = new THREE.SpotLight( 0xffffff, 1 );
  				light.power = 2000;
  				camera.add( light );
  				scene.add( camera );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					const object = gltf.scene;
  					mixer = new THREE.AnimationMixer( object );
  
  					const material = object.children[ 0 ].children[ 0 ].material;
  
  					// add glow effect
  					material.mrtNode = mrt( { mask: output.add( 1 ) } );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					scene.add( object );
  
  				} );
  
  				// spheres
  
  				const geometry = new THREE.SphereGeometry( .3, 32, 16 );
  
  				spheres = new THREE.Group();
  				scene.add( spheres );
  
  				function addSphere( color, mrtNode = null ) {
  
  					const distance = 1;
  					const id = spheres.children.length;
  					const rotation = THREE.MathUtils.degToRad( id * 90 );
  
  					const material = new THREE.MeshStandardNodeMaterial( { color } );
  					material.mrtNode = mrtNode;
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set(
  						Math.cos( rotation ) * distance,
  						1,
  						Math.sin( rotation ) * distance
  					);
  
  					spheres.add( mesh );
  
  				}
  
  				addSphere( 0x0000ff, mrt( { mask: output } ) );
  				addSphere( 0x00ff00 );
  				addSphere( 0xff0000 );
  				addSphere( 0x00ffff );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 0.4;
  
  
  				// post processing
  
  				const scenePass = pass( scene, camera );
  				scenePass.setMRT( mrt( {
  					output: output.renderOutput(),
  					mask: vec4( 0 ) // empty as default, custom materials can set this
  				} ) );
  
  				const colorPass = scenePass.getTextureNode();
  				const maskPass = scenePass.getTextureNode( 'mask' );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputColorTransform = false;
  				renderPipeline.outputNode = colorPass.add( gaussianBlur( maskPass, 1, 20 ).mul( .3 ) ).renderOutput();
  
  				// controls
  
  
  				controls.target.set( 0, 1, 0 );
  				controls.addEventListener( 'start', () => rotate = false );
  				controls.addEventListener( 'end', () => rotate = true );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
    				if ( rotate ) spheres.rotation.y += delta * 0.5;
    				renderPipeline.render();
  })
  
  		
}
</script>
