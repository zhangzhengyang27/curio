<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-20, 7, 20]"
    :camera-look-at="[0, 4, 0]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
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
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { getGroundProjectedNormal } from 'three/examples/jsm/tsl/utils/GroundedSkybox.js';
import { cubeTexture, float } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Ground Projected Env Maps</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const params = {
  				height: 15,
  				radius: 100,
  				enabled: true,
  			};
  
  
  			
  			async 
  
  
  				
  
  
  
  				
  
  				const hdrLoader = new HDRLoader();
  				const envMap = await hdrLoader.loadAsync( ASSET_HOST + 'textures/equirectangular/blouberg_sunrise_2_1k.hdr' );
  				envMap.mapping = THREE.EquirectangularReflectionMapping;
  
  				scene.environment = envMap;
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  
  				const shadow = new THREE.TextureLoader().load( ASSET_HOST + 'models/gltf/ferrari_ao.png' );
  
  				loader.load( ASSET_HOST + 'models/gltf/ferrari.glb', function ( gltf ) {
  
  					const bodyMaterial = new THREE.MeshPhysicalMaterial( {
  						color: 0x000000, metalness: 1.0, roughness: 0.8,
  						clearcoat: 1.0, clearcoatRoughness: 0.2
  					} );
  
  					const detailsMaterial = new THREE.MeshStandardMaterial( {
  						color: 0xffffff, metalness: 1.0, roughness: 0.5
  					} );
  
  					const glassMaterial = new THREE.MeshPhysicalMaterial( {
  						color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
  					} );
  
  					const carModel = gltf.scene.children[ 0 ];
  					carModel.scale.multiplyScalar( 4 );
  					carModel.rotation.y = Math.PI;
  
  					carModel.getObjectByName( 'body' ).material = bodyMaterial;
  
  					carModel.getObjectByName( 'rim_fl' ).material = detailsMaterial;
  					carModel.getObjectByName( 'rim_fr' ).material = detailsMaterial;
  					carModel.getObjectByName( 'rim_rr' ).material = detailsMaterial;
  					carModel.getObjectByName( 'rim_rl' ).material = detailsMaterial;
  					carModel.getObjectByName( 'trim' ).material = detailsMaterial;
  
  					carModel.getObjectByName( 'glass' ).material = glassMaterial;
  
  					// shadow
  					const mesh = new THREE.Mesh(
  						new THREE.PlaneGeometry( 0.655 * 4, 1.3 * 4 ),
  						new THREE.MeshBasicMaterial( {
  							map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true
  						} )
  					);
  					mesh.rotation.x = - Math.PI / 2;
  					carModel.add( mesh );
  
  					scene.add( carModel );
  
  				} );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				// use a cube map to avoid visual artifacts at the skybox's poles
  
  				const size = envMap.image.height;
  				const cubeRenderTarget = new THREE.CubeRenderTarget( size );
  				cubeRenderTarget.fromEquirectangularTexture( renderer, envMap );
  				const cubeMap = cubeRenderTarget.texture;
  
  				// grounded skybox
  
  				const geometry = new THREE.IcosahedronGeometry( 1, 16 );
  				const material = new THREE.MeshBasicNodeMaterial( { side: THREE.DoubleSide } );
  				material.colorNode = cubeTexture( cubeMap, getGroundProjectedNormal( float( params.radius ), float( params.height ) ) );
  
  				const skybox = new THREE.Mesh( geometry, material );
  				skybox.scale.setScalar( params.radius );
  				scene.add( skybox );
  
  				//
  
  
  				controls.target.set( 0, 2, 0 );
  				controls.maxPolarAngle = THREE.MathUtils.degToRad( 90 );
  				controls.maxDistance = 80;
  				controls.minDistance = 20;
  				controls.enablePan = false;
  				controls.update();
  
  				
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  				gui.add( params, 'enabled' ).name( 'Grounded' ).onChange( function ( value ) {
  
  					if ( value ) {
  
  						scene.add( skybox );
  						scene.background = null;
  
  					} else {
  
  						scene.remove( skybox );
  						scene.background = scene.environment;
  
  					}
  
  				} );
  
  			
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  		
}
</script>
