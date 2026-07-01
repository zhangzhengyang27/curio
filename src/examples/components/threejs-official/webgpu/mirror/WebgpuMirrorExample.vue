<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 75, 160]"
    :camera-options="{ fov: 45, near: 1, far: 500 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { reflector, uv, texture, color } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Mirror</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let cameraControls;
  
  			let sphereGroup, smallSphere;
  
  			
  
  
  				// scene
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				// camera
  				
  
  
  				//
  
  				let geometry, material;
  
  				//
  
  				sphereGroup = new THREE.Object3D();
  				scene.add( sphereGroup );
  
  				geometry = new THREE.CylinderGeometry( 0.1, 15 * Math.cos( Math.PI / 180 * 30 ), 0.1, 24, 1 );
  				material = new THREE.MeshPhongMaterial( { color: 0xffffff, emissive: 0x8d8d8d } );
  				const sphereCap = new THREE.Mesh( geometry, material );
  				sphereCap.position.y = - 15 * Math.sin( Math.PI / 180 * 30 ) - 0.05;
  				sphereCap.rotateX( - Math.PI );
  
  				geometry = new THREE.SphereGeometry( 15, 24, 24, Math.PI / 2, Math.PI * 2, 0, Math.PI / 180 * 120 );
  				const halfSphere = new THREE.Mesh( geometry, material );
  				halfSphere.add( sphereCap );
  				halfSphere.rotateX( - Math.PI / 180 * 135 );
  				halfSphere.rotateZ( - Math.PI / 180 * 20 );
  				halfSphere.position.y = 7.5 + 15 * Math.sin( Math.PI / 180 * 30 );
  
  				sphereGroup.add( halfSphere );
  
  				geometry = new THREE.IcosahedronGeometry( 5, 0 );
  				material = new THREE.MeshPhongMaterial( { color: 0xffffff, emissive: 0x7b7b7b, flatShading: true } );
  				smallSphere = new THREE.Mesh( geometry, material );
  				scene.add( smallSphere );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const floorNormal = textureLoader.load( ASSET_HOST + 'textures/floors/FloorsCheckerboard_S_Normal.jpg' );
  				floorNormal.wrapS = THREE.RepeatWrapping;
  				floorNormal.wrapT = THREE.RepeatWrapping;
  
  				const decalDiffuse = textureLoader.load( ASSET_HOST + 'textures/decal/decal-diffuse.png' );
  				decalDiffuse.colorSpace = THREE.SRGBColorSpace;
  
  				const decalNormal = textureLoader.load( ASSET_HOST + 'textures/decal/decal-normal.jpg' );
  
  				// reflectors / mirrors
  
  				const groundReflector = reflector().toInspector( 'Ground Reflector' );
  				const verticalReflector = reflector().toInspector( 'Vertical Reflector' );
  
  				const groundNormalScale = - 0.08;
  				const verticalNormalScale = 0.1;
  
  				const groundUVOffset = texture( decalNormal ).xy.mul( 2 ).sub( 1 ).mul( groundNormalScale );
  				const verticalUVOffset = texture( floorNormal, uv().mul( 5 ) ).xy.mul( 2 ).sub( 1 ).mul( verticalNormalScale );
  
  				groundReflector.uvNode = groundReflector.uvNode.add( groundUVOffset );
  				verticalReflector.uvNode = verticalReflector.uvNode.add( verticalUVOffset );
  
  				const groundNode = texture( decalDiffuse ).a.mix( color( 0xffffff ), groundReflector );
  				const verticalNode = color( 0x0000ff ).mul( .1 ).add( verticalReflector );
  
  				// walls
  
  				const planeGeo = new THREE.PlaneGeometry( 100.1, 100.1 );
  
  				//
  
  				const planeBottom = new THREE.Mesh( planeGeo, new THREE.MeshPhongNodeMaterial( {
  					colorNode: groundNode
  				} ) );
  				planeBottom.rotateX( - Math.PI / 2 );
  				planeBottom.add( groundReflector.target );
  				scene.add( planeBottom );
  
  				const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongNodeMaterial( {
  					colorNode: verticalNode
  				} ) );
  				planeBack.position.z = - 50;
  				planeBack.position.y = 50;
  				planeBack.add( verticalReflector.target );
  				scene.add( planeBack );
  
  				//
  
  				const planeTop = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
  				planeTop.position.y = 100;
  				planeTop.rotateX( Math.PI / 2 );
  				scene.add( planeTop );
  
  				const planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0x7f7fff } ) );
  				planeFront.position.z = 50;
  				planeFront.position.y = 50;
  				planeFront.rotateY( Math.PI );
  				scene.add( planeFront );
  
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
  				cameraControls.target.set( 0, 40, 0 );
  				cameraControls.maxDistance = 400;
  				cameraControls.minDistance = 10;
  				cameraControls.update();
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const timer = Date.now() * 0.01;
    				sphereGroup.rotation.y -= 0.002;
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
