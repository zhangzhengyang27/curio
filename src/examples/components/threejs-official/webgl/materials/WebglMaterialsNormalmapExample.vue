<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 27, near: 0.1, far: 100 }"
    custom-render
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BleachBypassShader } from 'three/examples/jsm/shaders/BleachBypassShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl normalmap demo.<br/>\n\t\t\t<a href=\"https://casual-effects.com/data/\" target=\"_blank\" rel=\"noopener\">Lee Perry-Smith</a> head."
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let container, loader;
  
  
  			let mesh;
  
  			let directionalLight, pointLight, ambientLight;
  
  			let composer;
  
  			const params = {
  				enableNormalMap: true,
  				normalScale: 1
  			};
  
  			
  
  
  				
  				camera.position.z = 12;
  
  				
  				scene.background = new THREE.Color( 0x494949 );
  
  				// LIGHTS
  
  				ambientLight = new THREE.AmbientLight( 0xffffff );
  				scene.add( ambientLight );
  
  				pointLight = new THREE.PointLight( 0xffffff, 30 );
  				pointLight.position.set( 0, 0, 6 );
  
  				scene.add( pointLight );
  
  				directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				directionalLight.position.set( 1, - 0.5, - 1 );
  				scene.add( directionalLight );
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const diffuseMap = textureLoader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/Map-COL.jpg' );
  				diffuseMap.colorSpace = THREE.SRGBColorSpace;
  
  				const specularMap = textureLoader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/Map-SPEC.jpg' );
  				specularMap.colorSpace = THREE.SRGBColorSpace;
  
  				const normalMap = textureLoader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg' );
  
  				const material = new THREE.MeshPhongMaterial( {
  					color: 0xefefef,
  					specular: 0x222222,
  					shininess: 35,
  					map: diffuseMap,
  					specularMap: specularMap,
  					normalMap: normalMap,
  					normalScale: new THREE.Vector2( params.normalScale, params.normalScale )
  				} );
  
  				loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					const geometry = gltf.scene.children[ 0 ].geometry;
  
  					mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.y = - 0.5;
  
  					scene.add( mesh );
  
  
  				} );
  
  				
  
  				// COMPOSER
  
  				renderer.autoClear = false;
  
  				const renderModel = new RenderPass( scene, camera );
  
  				const effectBleach = new ShaderPass( BleachBypassShader );
  				const effectColor = new ShaderPass( ColorCorrectionShader );
  				const outputPass = new OutputPass();
  				const effectFXAA = new FXAAPass();
  
  				effectBleach.uniforms[ 'opacity' ].value = 0.2;
  
  				effectColor.uniforms[ 'powRGB' ].value.set( 1.4, 1.45, 1.45 );
  				effectColor.uniforms[ 'mulRGB' ].value.set( 1.1, 1.1, 1.1 );
  
  				const renderTarget = new THREE.WebGLRenderTarget( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight), { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture() } );
  
  				composer = new EffectComposer( renderer, renderTarget );
  
  				composer.addPass( renderModel );
  				composer.addPass( effectBleach );
  				composer.addPass( effectColor );
  				composer.addPass( outputPass );
  				composer.addPass( effectFXAA );
  
  				// EVENTS
  
  				
  
  				// GUI
  
  				gui = new GUI();
  
  				gui.add( params, 'enableNormalMap' ).name( 'enable normal map' ).onChange( ( value ) => {
  
  					material.normalMap = ( value === true ) ? normalMap : null;
  					material.needsUpdate = true;
  
  				} );
  				gui.add( params, 'normalScale', 0, 2 ).name( 'normal scale' ).onChange( ( value )=> material.normalScale.setScalar( value ) );
  				gui.open();
  
  				// CONTROLS
  
  				
  				controls.minDistance = 8;
  				controls.maxDistance = 50;
  				controls.enablePan = false;
  				controls.enableDamping = true;
  
  			
  
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    composer.render();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
