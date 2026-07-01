<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[7, 4, 1]"
    :camera-options="{ fov: 40, near: 0.1, far: 100 }"
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
import { Fn, color, mx_worley_noise_float, time } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Projector Light</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let projectorLight, lightHelper;
  
  			
  
  
  				// Renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  				
  
  				
  
  
  				// Controls
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.maxPolarAngle = Math.PI / 2;
  				controls.target.set( 0, 1, 0 );
  				controls.update();
  
  				// Textures
  
  				const loader = new THREE.TextureLoader().setPath( 'textures/' );
  
  				// Lights
  
  				const causticEffect = Fn( ( [ projectorUV ] ) => {
  
  					const waterLayer0 = mx_worley_noise_float( projectorUV.mul( 10 ).add( time ) );
  
  					const caustic = waterLayer0.mul( color( 0x5abcd8 ) ).mul( 2 );
  
  					return caustic;
  
  				} );
  
  
  				const ambient = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 0.15 );
  				scene.add( ambient );
  
  				projectorLight = new THREE.ProjectorLight( 0xffffff, 100 );
  				projectorLight.colorNode = causticEffect;
  				projectorLight.position.set( 2.5, 5, 2.5 );
  				projectorLight.angle = Math.PI / 6;
  				projectorLight.penumbra = 1;
  				projectorLight.decay = 2;
  				projectorLight.distance = 0;
  
  				projectorLight.castShadow = true;
  				projectorLight.shadow.mapSize.width = 1024;
  				projectorLight.shadow.mapSize.height = 1024;
  				projectorLight.shadow.camera.near = 1;
  				projectorLight.shadow.camera.far = 10;
  				projectorLight.shadow.focus = 1;
  				scene.add( projectorLight );
  
  				lightHelper = new THREE.SpotLightHelper( projectorLight );
  				scene.add( lightHelper );
  
  				//
  
  				const geometry = new THREE.PlaneGeometry( 200, 200 );
  				const material = new THREE.MeshLambertMaterial( { color: 0xbcbcbc } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.position.set( 0, - 1, 0 );
  				mesh.rotation.x = - Math.PI / 2;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				// Models
  
  				new PLYLoader().load( ASSET_HOST + 'models/ply/binary/Lucy100k.ply', function ( geometry ) {
  
  					geometry.scale( 0.0024, 0.0024, 0.0024 );
  					geometry.computeVertexNormals();
  
  					const material = new THREE.MeshLambertMaterial();
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.rotation.y = - Math.PI / 2;
  					mesh.position.y = 0.8;
  					mesh.castShadow = true;
  					mesh.receiveShadow = true;
  					scene.add( mesh );
  
  				} );
  
  				
  
  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Projector Light' );
  
  				const params = {
  					type: 'procedural',
  					color: projectorLight.color.getHex(),
  					intensity: projectorLight.intensity,
  					distance: projectorLight.distance,
  					angle: projectorLight.angle,
  					penumbra: projectorLight.penumbra,
  					decay: projectorLight.decay,
  					focus: projectorLight.shadow.focus,
  					shadows: true,
  				};
  
  				let videoTexture, mapTexture;
  
  				gui.add( params, 'type', [ 'procedural', 'video', 'texture' ] ).onChange( function ( val ) {
  
  					projectorLight.colorNode = null;
  					projectorLight.map = null;
  
  					if ( val === 'procedural' ) {
  
  						projectorLight.colorNode = causticEffect;
  
  						focus.setValue( 1 );
  
  					} else if ( val === 'video' ) {
  
  						if ( videoTexture === undefined ) {
  
  							const video = document.getElementById( 'video' );
  							video.play();
  
  							videoTexture = new THREE.VideoTexture( video );
  							videoTexture.colorSpace = THREE.SRGBColorSpace;
  
  						}
  
  						projectorLight.map = videoTexture;
  
  						focus.setValue( .46 );
  
  					} else if ( val === 'texture' ) {
  
  						mapTexture = loader.load( 'colors.png' );
  						mapTexture.minFilter = THREE.LinearFilter;
  						mapTexture.magFilter = THREE.LinearFilter;
  						mapTexture.generateMipmaps = false;
  						mapTexture.colorSpace = THREE.SRGBColorSpace;
  
  						projectorLight.map = mapTexture;
  
  						focus.setValue( 1 );
  
  					}
  
  				} );
  
  				gui.addColor( params, 'color' ).onChange( function ( val ) {
  
  					projectorLight.color.setHex( val );
  
  				} );
  
  				gui.add( params, 'intensity', 0, 500 ).onChange( function ( val ) {
  
  					projectorLight.intensity = val;
  
  				} );
  
  
  				gui.add( params, 'distance', 0, 20 ).onChange( function ( val ) {
  
  					projectorLight.distance = val;
  
  				} );
  
  				gui.add( params, 'angle', 0, Math.PI / 3 ).onChange( function ( val ) {
  
  					projectorLight.angle = val;
  
  				} );
  
  				gui.add( params, 'penumbra', 0, 1 ).onChange( function ( val ) {
  
  					projectorLight.penumbra = val;
  
  				} );
  
  				gui.add( params, 'decay', 1, 2 ).onChange( function ( val ) {
  
  					projectorLight.decay = val;
  
  				} );
  
  				const focus = gui.add( params, 'focus', 0, 1 ).onChange( function ( val ) {
  
  					projectorLight.shadow.focus = val;
  
  				} );
  
  				gui.add( params, 'shadows' ).onChange( function ( val ) {
  
  					renderer.shadowMap.enabled = val;
  
  					scene.traverse( function ( child ) {
  
  						if ( child.material ) {
  
  							child.material.needsUpdate = true;
  
  						}
  
  					} );
  
  				} );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now() / 3000;
    				projectorLight.position.x = Math.cos( time ) * 2.5;
    				projectorLight.position.z = Math.sin( time ) * 2.5;
    				lightHelper.update();
  })
  
  		
}
</script>
