<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[3, 2, 3]"
    :camera-look-at="[0, 1, 0]"
    :camera-options="{ fov: 50, near: 0.25, far: 25 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, positionWorld, linearDepth, viewportLinearDepth, viewportSharedTexture, screenUV, hue, time, checker, uv, modelScale } from 'three/tsl';
import { hashBlur } from 'three/examples/jsm/tsl/display/hashBlur.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Backdrop Area</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let mixer, timer;
  
  			
  
  
  				
  
  
  				
  				scene.backgroundNode = hue( screenUV.y.mix( color( 0x66bbff ), color( 0x4466ff ) ), time.mul( 0.1 ) );
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const ambient = new THREE.AmbientLight( 0xffffff, 2.5 );
  				scene.add( ambient );
  			
  				// model
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					const object = gltf.scene;
  					mixer = new THREE.AnimationMixer( object );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					scene.add( object );
  
  				} );
  
  				// volume
  
  				// compare depth from viewportLinearDepth with linearDepth() to create a distance field
  				// viewportLinearDepth return the linear depth of the scene
  				// linearDepth() returns the linear depth of the mesh
  				const depthDistance = viewportLinearDepth.distance( linearDepth() );
  
  				const depthAlphaNode = depthDistance.oneMinus().smoothstep( .90, 2 ).mul( 10 ).saturate();
  				const depthBlurred = hashBlur( viewportSharedTexture(), depthDistance.smoothstep( 0, .6 ).mul( 40 ).clamp().mul( .1 ) );
  
  				const blurredBlur = new THREE.MeshBasicNodeMaterial();
  				blurredBlur.backdropNode = depthBlurred.add( depthAlphaNode.mix( color( 0x003399 ).mul( .3 ), 0 ) );
  				blurredBlur.transparent = true;
  				blurredBlur.side = THREE.DoubleSide;
  
  				const depthMaterial = new THREE.MeshBasicNodeMaterial();
  				depthMaterial.backdropNode = depthAlphaNode;
  				depthMaterial.transparent = true;
  				depthMaterial.side = THREE.DoubleSide;
  
  				const checkerMaterial = new THREE.MeshBasicNodeMaterial();
  				checkerMaterial.backdropNode = hashBlur( viewportSharedTexture(), .05 );
  				checkerMaterial.backdropAlphaNode = checker( uv().mul( 3 ).mul( modelScale.xy ) );
  				checkerMaterial.opacityNode = checkerMaterial.backdropAlphaNode;
  				checkerMaterial.transparent = true;
  				checkerMaterial.side = THREE.DoubleSide;
  
  				const pixelMaterial = new THREE.MeshBasicNodeMaterial();
  				pixelMaterial.backdropNode = viewportSharedTexture( screenUV.mul( 100 ).floor().div( 100 ) );
  				pixelMaterial.transparent = true;
  
  				// box / floor
  
  				const box = new THREE.Mesh( new THREE.BoxGeometry( 2, 2, 2 ), blurredBlur );
  				box.position.set( 0, 1, 0 );
  				box.renderOrder = 1;
  				scene.add( box );
  
  				const floor = new THREE.Mesh( new THREE.BoxGeometry( 5, .01, 5 ), new THREE.MeshBasicNodeMaterial( {
  					color: 0xff6600,
  					opacityNode: positionWorld.xz.distance( 0 ).oneMinus().clamp(),
  					transparent: true,
  					depthWrite: false
  				} ) );
  				floor.position.set( 0, 0, 0 );
  				scene.add( floor );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = .9;
  				renderer.inspector = new Inspector();
  
  
  
  				controls.target.set( 0, 1, 0 );
  				controls.update();
  
  				
  
  				// gui
  
  				const materials = {
  					'blurred': blurredBlur,
  					'depth': depthMaterial,
  					'checker': checkerMaterial,
  					'pixel': pixelMaterial
  				};
  
  				const options = { material: 'blurred' };
  				box.material = materials[ options.material ];
  
  				const gui = renderer.inspector.createParameters( 'Scene settings' );
  				gui.add( box.scale, 'x', 0.1, 2, 0.01 ).name( 'box scale x' );
  				gui.add( box.scale, 'y', 0.1, 2, 0.01 ).name( 'box scale y' );
  				gui.add( options, 'material', Object.keys( materials ) ).onChange( name => {
  
  					box.material = materials[ name ];
  
  				} );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
  })
  
  		
}
</script>
