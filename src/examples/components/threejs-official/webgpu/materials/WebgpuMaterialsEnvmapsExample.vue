<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 0, 2.5]"
    :camera-options="{ fov: 70, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Environment Mapping</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  			let textureEquirec, textureCube;
  			let sphereMesh, sphereMaterial, params;
  
  			
  
  
  				// CAMERAS
  
  				
  
  
  				// SCENE
  
  				
  
  				// Textures
  
  				const loader = new THREE.CubeTextureLoader();
  				loader.setPath( ASSET_HOST + 'textures/cube/Bridge2/' );
  
  				textureCube = loader.load( [ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ] );
  
  				const textureLoader = new THREE.TextureLoader();
  
  				textureEquirec = textureLoader.load( ASSET_HOST + 'textures/2294472375_24a3b8ef46_o.jpg' );
  				textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
  				textureEquirec.colorSpace = THREE.SRGBColorSpace;
  
  				scene.background = textureCube;
  
  				//
  
  				const geometry = new THREE.IcosahedronGeometry( 1, 15 );
  				sphereMaterial = new THREE.MeshBasicMaterial( { envMap: textureCube } );
  				sphereMesh = new THREE.Mesh( geometry, sphereMaterial );
  				scene.add( sphereMesh );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  				controls.minDistance = 1.5;
  				controls.maxDistance = 6;
  
  				//
  
  				params = {
  					Type: 'Cube',
  					Refraction: false,
  					backgroundRotationX: false,
  					backgroundRotationY: false,
  					backgroundRotationZ: false,
  					syncMaterial: false
  				};
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  				gui.add( params, 'Type', [ 'Cube', 'Equirectangular' ] ).onChange( function ( value ) {
  
  					if ( value === 'Cube' ) {
  
  						scene.background = textureCube;
  
  						sphereMaterial.envMap = textureCube;
  						sphereMaterial.needsUpdate = true;
  
  					} else if ( value === 'Equirectangular' ) {
  
  						scene.background = textureEquirec;
  
  						sphereMaterial.envMap = textureEquirec;
  						sphereMaterial.needsUpdate = true;
  
  					}
  
  				} );
  				gui.add( params, 'Refraction' ).onChange( function ( value ) {
  
  					if ( value ) {
  
  						textureEquirec.mapping = THREE.EquirectangularRefractionMapping;
  						textureCube.mapping = THREE.CubeRefractionMapping;
  
  					} else {
  
  						textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
  						textureCube.mapping = THREE.CubeReflectionMapping;
  
  					}
  
  					sphereMaterial.needsUpdate = true;
  
  				} );
  				gui.add( params, 'backgroundRotationX' );
  				gui.add( params, 'backgroundRotationY' );
  				gui.add( params, 'backgroundRotationZ' );
  				gui.add( params, 'syncMaterial' );
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( params.backgroundRotationX ) {
    					scene.backgroundRotation.x += 0.001;
    				}
    				if ( params.backgroundRotationY ) {
    					scene.backgroundRotation.y += 0.001;
    				}
    				if ( params.backgroundRotationZ ) {
    					scene.backgroundRotation.z += 0.001;
    				}
    				if ( params.syncMaterial ) {
    					sphereMesh.material.envMapRotation.copy( scene.backgroundRotation );
    				}
  })
  
  		
}
</script>
