<template>
  <WebGPUExampleScene
    camera="perspective"
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
import { float, vec3, color, viewportSharedTexture, hue, blendOverlay, posterize, grayscale, saturation, viewportSafeUV, screenUV, checker, uv, time, oscSine, output } from 'three/tsl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Backdrop</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let portals, rotate = true;
  			let mixer, timer;
  
  			
  
  
  				
  
  
  				
  				scene.backgroundNode = screenUV.y.mix( color( 0x66bbff ), color( 0x4466ff ) );
  
  
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
  					material.outputNode = oscSine( time.mul( .1 ) ).mix( output, posterize( output.add( .1 ), 4 ).mul( 2 ) );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					scene.add( object );
  
  				} );
  
  				// portals
  
  				const geometry = new THREE.SphereGeometry( .3, 32, 16 );
  
  				portals = new THREE.Group();
  				scene.add( portals );
  
  				function addBackdropSphere( backdropNode, backdropAlphaNode = null ) {
  
  					const distance = 1;
  					const id = portals.children.length;
  					const rotation = THREE.MathUtils.degToRad( id * 45 );
  
  					const material = new THREE.MeshStandardNodeMaterial( { color: 0x0066ff } );
  					material.roughnessNode = float( .2 );
  					material.metalnessNode = float( 0 );
  					material.backdropNode = backdropNode;
  					material.backdropAlphaNode = backdropAlphaNode;
  					material.transparent = true;
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set(
  						Math.cos( rotation ) * distance,
  						1,
  						Math.sin( rotation ) * distance
  					);
  
  					portals.add( mesh );
  
  				}
  
  				addBackdropSphere( hue( viewportSharedTexture().bgr, oscSine().mul( Math.PI ) ) );
  				addBackdropSphere( viewportSharedTexture().rgb.oneMinus() );
  				addBackdropSphere( grayscale( viewportSharedTexture().rgb ) );
  				addBackdropSphere( saturation( viewportSharedTexture().rgb, 10 ), oscSine() );
  				addBackdropSphere( blendOverlay( viewportSharedTexture().rgb, checker( uv().mul( 10 ) ) ) );
  				addBackdropSphere( viewportSharedTexture( viewportSafeUV( screenUV.mul( 40 ).floor().div( 40 ) ) ) );
  				addBackdropSphere( viewportSharedTexture( viewportSafeUV( screenUV.mul( 80 ).floor().div( 80 ) ) ).add( color( 0x0033ff ) ) );
  				addBackdropSphere( vec3( 0, 0, viewportSharedTexture().b ) );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 0.3;
  
  
  
  				controls.target.set( 0, 1, 0 );
  				controls.addEventListener( 'start', () => rotate = false );
  				controls.addEventListener( 'end', () => rotate = true );
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
    				if ( rotate ) portals.rotation.y += delta * 0.5;
  })
  
  		
}
</script>
