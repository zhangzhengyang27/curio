<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 2000 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { PVRLoader } from 'three/examples/jsm/loaders/PVRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl - PVR compressed textures"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			const meshes = [];
  
  			
  
  
  				
  				camera.position.z = 1000;
  
  				
  
  				const geometry = new THREE.BoxGeometry( 200, 200, 200 );
  
  				//
  
  				const onCube1Loaded = function ( texture ) {
  
  					texture.magFilter = THREE.LinearFilter;
  					texture.minFilter = THREE.LinearFilter;
  					texture.mapping = THREE.CubeReflectionMapping;
  					texture.colorSpace = THREE.SRGBColorSpace;
  					material6.needsUpdate = true;
  
  				};
  
  				const onCube2Loaded = function ( texture ) {
  
  					texture.magFilter = THREE.LinearFilter;
  					// texture.minFilter = LinearMipmapNearestFilter;
  					texture.minFilter = THREE.LinearFilter;
  					texture.mapping = THREE.CubeReflectionMapping;
  					texture.colorSpace = THREE.SRGBColorSpace;
  					material8.needsUpdate = true;
  
  				};
  
  				//
  
  				const loader = new PVRLoader();
  
  				const disturb_4bpp_rgb = loader.load( ASSET_HOST + 'textures/compressed/disturb_4bpp_rgb.pvr' );
  				const disturb_4bpp_rgb_v3 = loader.load( ASSET_HOST + 'textures/compressed/disturb_4bpp_rgb_v3.pvr' );
  				const disturb_4bpp_rgb_mips = loader.load( ASSET_HOST + 'textures/compressed/disturb_4bpp_rgb_mips.pvr' );
  				const disturb_2bpp_rgb = loader.load( ASSET_HOST + 'textures/compressed/disturb_2bpp_rgb.pvr' );
  				const flare_4bpp_rgba = loader.load( ASSET_HOST + 'textures/compressed/flare_4bpp_rgba.pvr' );
  				const flare_2bpp_rgba = loader.load( ASSET_HOST + 'textures/compressed/flare_2bpp_rgba.pvr' );
  				const park3_cube_nomip_4bpp_rgb = loader.load( ASSET_HOST + 'textures/compressed/park3_cube_nomip_4bpp_rgb.pvr', onCube1Loaded );
  				const park3_cube_mip_2bpp_rgb_v3 = loader.load( ASSET_HOST + 'textures/compressed/park3_cube_mip_2bpp_rgb_v3.pvr', onCube2Loaded );
  
  				disturb_2bpp_rgb.minFilter =
  				disturb_2bpp_rgb.magFilter =
  				flare_4bpp_rgba.minFilter =
  				flare_4bpp_rgba.magFilter =
  				disturb_4bpp_rgb.minFilter =
  				disturb_4bpp_rgb.magFilter =
  				disturb_4bpp_rgb_v3.minFilter =
  				disturb_4bpp_rgb_v3.magFilter =
  				flare_2bpp_rgba.minFilter =
  				flare_2bpp_rgba.magFilter = THREE.LinearFilter;
  
  				disturb_2bpp_rgb.colorSpace =
  				flare_4bpp_rgba.colorSpace =
  				disturb_4bpp_rgb.colorSpace =
  				disturb_4bpp_rgb_v3.colorSpace =
  				flare_2bpp_rgba.colorSpace = THREE.SRGBColorSpace;
  
  				const material1 = new THREE.MeshBasicMaterial( { map: disturb_4bpp_rgb } );
  				const material2 = new THREE.MeshBasicMaterial( { map: disturb_4bpp_rgb_mips } );
  				const material3 = new THREE.MeshBasicMaterial( { map: disturb_2bpp_rgb } );
  				const material4 = new THREE.MeshBasicMaterial( { map: flare_4bpp_rgba, side: THREE.DoubleSide, depthTest: false, transparent: true } );
  				const material5 = new THREE.MeshBasicMaterial( { map: flare_2bpp_rgba, side: THREE.DoubleSide, depthTest: false, transparent: true } );
  				const material6 = new THREE.MeshBasicMaterial( { envMap: park3_cube_nomip_4bpp_rgb } );
  				const material8 = new THREE.MeshBasicMaterial( { envMap: park3_cube_mip_2bpp_rgb_v3 } );
  
  				const material7 = new THREE.MeshBasicMaterial( { map: disturb_4bpp_rgb_v3 } );
  
  				//
  
  				let mesh = new THREE.Mesh( geometry, material1 );
  				mesh.position.x = - 500;
  				mesh.position.y = 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				mesh = new THREE.Mesh( geometry, material2 );
  				mesh.position.x = - 166;
  				mesh.position.y = 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				mesh = new THREE.Mesh( geometry, material3 );
  				mesh.position.x = 166;
  				mesh.position.y = 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				mesh = new THREE.Mesh( geometry, material7 );
  				mesh.position.x = 500;
  				mesh.position.y = 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				mesh = new THREE.Mesh( geometry, material4 );
  				mesh.position.x = - 500;
  				mesh.position.y = - 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				mesh = new THREE.Mesh( geometry, material5 );
  				mesh.position.x = - 166;
  				mesh.position.y = - 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				const torus = new THREE.TorusGeometry( 100, 50, 32, 24 );
  
  				mesh = new THREE.Mesh( torus, material6 );
  				mesh.position.x = 166;
  				mesh.position.y = - 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				mesh = new THREE.Mesh( torus, material8 );
  				mesh.position.x = 500;
  				mesh.position.y = - 200;
  				scene.add( mesh );
  				meshes.push( mesh );
  
  				//
  
  				
  
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.001;
    				for ( let i = 0; i < meshes.length; i ++ ) {
    					const mesh = meshes[ i ];
    					mesh.rotation.x = time;
    					mesh.rotation.y = time;
    				}
  })
  
  		
}
</script>
