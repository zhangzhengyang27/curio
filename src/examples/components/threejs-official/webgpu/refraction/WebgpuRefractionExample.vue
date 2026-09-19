<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 50, 160]"
    :camera-options="{ fov: 45, near: 1, far: 500 }"
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

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { viewportSafeUV, viewportSharedTexture, screenUV, texture, uv } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Refraction</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let cameraControls;
  
  			let smallSphere;
  
  			
  
  
  				// scene
  				
  
  				// camera
  				
  
  
  				//
  
  				const geometry = new THREE.IcosahedronGeometry( 5, 0 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, emissive: 0x7b7b7b, flatShading: true } );
  				smallSphere = new THREE.Mesh( geometry, material );
  				scene.add( smallSphere );
  
  				// textures
  
  				const loader = new THREE.TextureLoader();
  
  				const floorNormal = loader.load( ASSET_HOST + 'textures/floors/FloorsCheckerboard_S_Normal.jpg' );
  				floorNormal.wrapS = THREE.RepeatWrapping;
  				floorNormal.wrapT = THREE.RepeatWrapping;
  
  				// refractor
  
  				const verticalNormalScale = 0.1;
  				const verticalUVOffset = texture( floorNormal, uv().mul( 5 ) ).xy.mul( 2 ).sub( 1 ).mul( verticalNormalScale );
  
  				const refractorUV = screenUV.add( verticalUVOffset );
  				const verticalRefractor = viewportSharedTexture( viewportSafeUV( refractorUV ) ).toInspector( 'Viewport Texture' );
  
  				const planeGeo = new THREE.PlaneGeometry( 100.1, 100.1 );
  
  				const planeRefractor = new THREE.Mesh( planeGeo, new THREE.MeshBasicNodeMaterial( {
  					backdropNode: verticalRefractor
  				} ) );
  				planeRefractor.material.transparent = true;
  				planeRefractor.position.y = 50;
  				scene.add( planeRefractor );
  
  				// walls
  			
  				const planeTop = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
  				planeTop.position.y = 100;
  				planeTop.rotateX( Math.PI / 2 );
  				scene.add( planeTop );
  
  				const planeBottom = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
  				planeBottom.rotateX( - Math.PI / 2 );
  				scene.add( planeBottom );
  
  				const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0x7f7fff } ) );
  				planeBack.position.z = - 50;
  				planeBack.position.y = 50;
  				scene.add( planeBack );
  
  				const planeRight = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0x00ff00 } ) );
  				planeRight.position.x = 50;
  				planeRight.position.y = 50;
  				planeRight.rotateY( - Math.PI / 2 );
  				scene.add( planeRight );
  
  				const planeLeft = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xff0000 } ) );
  				planeLeft.position.x = - 50;
  				planeLeft.position.y = 50;
  				planeLeft.rotateY( Math.PI / 2 );
  				scene.add( planeLeft );
  
  				// lights
  
  				const mainLight = new THREE.PointLight( 0xe7e7e7, 2.5, 250, 0 );
  				mainLight.position.y = 60;
  				scene.add( mainLight );
  
  				const greenLight = new THREE.PointLight( 0x00ff00, 0.5, 1000, 0 );
  				greenLight.position.set( 550, 50, 0 );
  				scene.add( greenLight );
  
  				const redLight = new THREE.PointLight( 0xff0000, 0.5, 1000, 0 );
  				redLight.position.set( - 550, 50, 0 );
  				scene.add( redLight );
  
  				const blueLight = new THREE.PointLight( 0xbbbbfe, 0.5, 1000, 0 );
  				blueLight.position.set( 0, 50, 550 );
  				scene.add( blueLight );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				cameraControls = new OrbitControls( camera, renderer.domElement );
  				cameraControls.target.set( 0, 50, 0 );
  				cameraControls.maxDistance = 400;
  				cameraControls.minDistance = 10;
  				cameraControls.update();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    const timer = Date.now() * 0.01;
    				smallSphere.position.set(
    					Math.cos( timer * 0.1 ) * 30,
    					Math.abs( Math.cos( timer * 0.2 ) ) * 20 + 5,
    					Math.sin( timer * 0.1 ) * 30
    				);
    				smallSphere.rotation.y = ( Math.PI / 2 ) - timer * 0.1;
    				smallSphere.rotation.z = timer * 0.8;
  })
  
  		
}
</script>
