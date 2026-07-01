<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 2.5]"
    :camera-options="{ fov: 70, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl environment mapping example<br/>\n\t\t\tEquirectangular Map by <a href=\"http://www.flickr.com/photos/jonragnarsson/2294472375/\" target=\"_blank\" rel=\"noopener\">J&oacute;n Ragnarsson</a>."
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
  
  				
  
  
  				//
  
  				
  				controls.minDistance = 1.5;
  				controls.maxDistance = 6;
  
  				//
  
  				params = {
  					Cube: function () {
  
  						scene.background = textureCube;
  
  						sphereMaterial.envMap = textureCube;
  						sphereMaterial.needsUpdate = true;
  
  					},
  					Equirectangular: function () {
  
  						scene.background = textureEquirec;
  
  						sphereMaterial.envMap = textureEquirec;
  						sphereMaterial.needsUpdate = true;
  
  					},
  					Refraction: false,
  					backgroundRotationX: false,
  					backgroundRotationY: false,
  					backgroundRotationZ: false,
  					syncMaterial: false
  				};
  
  				const gui = new GUI( { width: 300 } );
  				gui.add( params, 'Cube' );
  				gui.add( params, 'Equirectangular' );
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
  				gui.open();
  
  				
  
  			
  
  
  			
  
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
