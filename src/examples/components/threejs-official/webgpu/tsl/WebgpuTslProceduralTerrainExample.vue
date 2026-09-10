<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-10, 8, -2.2]"
    :camera-options="{ fov: 35, near: 0.1, far: 100 }"
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
import { mx_noise_float, color, cross, dot, float, transformNormalToView, positionLocal, sign, step, Fn, uniform, varying, vec2, vec3, Loop } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Procedural Terrain</span>"
const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  
  			init();
  
  			function init() {
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x201919 );
  
  				// environment
  
  				const hdrLoader = new HDRLoader();
  				hdrLoader.load( ASSET_HOST + 'textures/equirectangular/pedestrian_overpass_1k.hdr', ( environmentMap ) => {
  
  					environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  
  					scene.background = environmentMap;
  					scene.backgroundBlurriness = 0.5;
  					scene.environment = environmentMap;
  			
  				} );
  
  				// lights
  			
  				const directionalLight = new THREE.DirectionalLight( '#ffffff', 2 );
  				directionalLight.position.set( 6.25, 3, 4 );
  				directionalLight.castShadow = true;
  				directionalLight.shadow.mapSize.set( 1024, 1024 );
  				directionalLight.shadow.camera.near = 0.1;
  				directionalLight.shadow.camera.far = 30;
  				directionalLight.shadow.camera.top = 8;
  				directionalLight.shadow.camera.right = 8;
  				directionalLight.shadow.camera.bottom = - 8;
  				directionalLight.shadow.camera.left = - 8;
  				directionalLight.shadow.normalBias = 0.05;
  				scene.add( directionalLight );
  
  				// terrain
  
  				const material = new THREE.MeshStandardNodeMaterial( {
  					metalness: 0,
  					roughness: 0.5,
  					color: '#85d534'
  				} );
  
  				const noiseIterations = uniform( 3 );
  				const positionFrequency = uniform( 0.175 );
  				const warpFrequency = uniform( 6 );
  				const warpStrength = uniform( 1 );
  				const strength = uniform( 10 );
  				const offset = uniform( vec2( 0, 0 ) );
  				const normalLookUpShift = uniform( 0.01 );
  				const colorSand = uniform( color( '#ffe894' ) );
  				const colorGrass = uniform( color( '#85d534' ) );
  				const colorSnow = uniform( color( '#ffffff' ) );
  				const colorRock = uniform( color( '#bfbd8d' ) );
  
  				const vNormal = varying( vec3() );
  				const vPosition = varying( vec3() );
  
  				const terrainElevation = Fn( ( [ position ] ) => {
  
  					const warpedPosition = position.add( offset ).toVar();
  					warpedPosition.addAssign( mx_noise_float( warpedPosition.mul( positionFrequency ).mul( warpFrequency ), 1, 0 ).mul( warpStrength ) );
  			
  					const elevation = float( 0 ).toVar();
  					Loop( { type: 'float', start: float( 1 ), end: noiseIterations.toFloat(), condition: '<=' }, ( { i } ) => {
  
  						const noiseInput = warpedPosition.mul( positionFrequency ).mul( i.mul( 2 ) ).add( i.mul( 987 ) );
  						const noise = mx_noise_float( noiseInput, 1, 0 ).div( i.add( 1 ).mul( 2 ) );
  						elevation.addAssign( noise );
  			
  					} );
  
  					const elevationSign = sign( elevation );
  					elevation.assign( elevation.abs().pow( 2 ).mul( elevationSign ).mul( strength ) );
  
  					return elevation;
  			
  				} );
  
  				material.positionNode = Fn( () => {
  
  					// neighbours positions
  
  					const neighbourA = positionLocal.xyz.add( vec3( normalLookUpShift, 0.0, 0.0 ) ).toVar();
  					const neighbourB = positionLocal.xyz.add( vec3( 0.0, 0.0, normalLookUpShift.negate() ) ).toVar();
  
  					// elevations
  
  					const position = positionLocal.xyz.toVar();
  					const elevation = terrainElevation( positionLocal.xz );
  					position.y.addAssign( elevation );
  			
  					neighbourA.y.addAssign( terrainElevation( neighbourA.xz ) );
  					neighbourB.y.addAssign( terrainElevation( neighbourB.xz ) );
  
  					// compute normal
  
  					const toA = neighbourA.sub( position ).normalize();
  					const toB = neighbourB.sub( position ).normalize();
  					vNormal.assign( cross( toA, toB ) );
  
  					// varyings
  
  					vPosition.assign( position.add( vec3( offset.x, 0, offset.y ) ) );
  
  					return position;
  			
  				} )();
  
  				material.normalNode = transformNormalToView( vNormal );
  
  				material.colorNode = Fn( () => {
  
  					const finalColor = colorSand.toVar();
  
  					// grass
  
  					const grassMix = step( - 0.06, vPosition.y );
  					finalColor.assign( grassMix.mix( finalColor, colorGrass ) );
  
  					// rock
  
  					const rockMix = step( 0.5, dot( vNormal, vec3( 0, 1, 0 ) ) ).oneMinus().mul( step( - 0.06, vPosition.y ) );
  					finalColor.assign( rockMix.mix( finalColor, colorRock ) );
  
  					// snow
  
  					const snowThreshold = mx_noise_float( vPosition.xz.mul( 25 ), 1, 0 ).mul( 0.1 ).add( 0.45 );
  					const snowMix = step( snowThreshold, vPosition.y );
  					finalColor.assign( snowMix.mix( finalColor, colorSnow ) );
  
  					return finalColor;
  			
  				} )();
  
  				const geometry = new THREE.PlaneGeometry( 10, 10, 500, 500 );
  				geometry.deleteAttribute( 'uv' );
  				geometry.deleteAttribute( 'normal' );
  				geometry.rotateX( - Math.PI * 0.5 );
  
  				const terrain = new THREE.Mesh( geometry, material );
  				terrain.receiveShadow = true;
  				terrain.castShadow = true;
  				scene.add( terrain );
  
  				// water
  			
  				const water = new THREE.Mesh(
  					new THREE.PlaneGeometry( 10, 10, 1, 1 ),
  					new THREE.MeshPhysicalMaterial( {
  						transmission: 1,
  						roughness: 0.5,
  						ior: 1.333,
  						color: '#4db2ff'
  					} )
  				);
  				water.rotation.x = - Math.PI * 0.5;
  				water.position.y = - 0.1;
  				scene.add( water );
  
  				// drag
  
  				drag = {};
  				drag.screenCoords = new THREE.Vector2();
  				drag.prevWorldCoords = new THREE.Vector3();
  				drag.worldCoords = new THREE.Vector3();
  				drag.raycaster = new THREE.Raycaster();
  				drag.down = false;
  				drag.hover = false;
  
  				drag.object = new THREE.Mesh( new THREE.PlaneGeometry( 10, 10, 1, 1 ), new THREE.MeshBasicMaterial() );
  				drag.object.rotation.x = - Math.PI * 0.5;
  				drag.object.visible = false;
  				scene.add( drag.object );
  
  				drag.getIntersect = () => {
  
  					drag.raycaster.setFromCamera( drag.screenCoords, camera );
  					const intersects = drag.raycaster.intersectObject( drag.object );
  					if ( intersects.length )
  						return intersects[ 0 ];
  
  					return null;
  
  				};
  
  				drag.update = () => {
  
  					const intersect = drag.getIntersect();
  
  					if ( intersect ) {
  
  						drag.hover = true;
  
  						if ( ! drag.down )
  							renderer.domElement.style.cursor = 'grab';
  
  					} else {
  
  						drag.hover = false;
  						renderer.domElement.style.cursor = 'default';
  
  					}
  
  					if ( drag.hover && drag.down ) {
  
  						drag.worldCoords.copy( intersect.point );
  						const delta = drag.prevWorldCoords.sub( drag.worldCoords );
  
  						offset.value.x += delta.x;
  						offset.value.y += delta.z;
  
  					}
  
  					drag.prevWorldCoords.copy( drag.worldCoords );
  
  				};
  
  				// renderer
  
  				
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.shadowMap.enabled = true;
  
  
  				// inspector
  
  				renderer.inspector = new Inspector();
  				document.body.appendChild( renderer.inspector.domElement );
  
  				// controls
  
  				
  				controls.maxPolarAngle = Math.PI * 0.45;
  				controls.target.y = - 0.5;
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				// debug
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				const terrainGui = gui.addFolder( '🏔️ terrain' );
  
  				terrainGui.add( noiseIterations, 'value', 0, 10, 1 ).name( 'noiseIterations' );
  				terrainGui.add( positionFrequency, 'value', 0, 1, 0.001 ).name( 'positionFrequency' );
  				terrainGui.add( strength, 'value', 0, 20, 0.001 ).name( 'strength' );
  				terrainGui.add( warpFrequency, 'value', 0, 20, 0.001 ).name( 'warpFrequency' );
  				terrainGui.add( warpStrength, 'value', 0, 2, 0.001 ).name( 'warpStrength' );
  
  				const colorSandDebug = { color: colorSand.value.getHex() };
  				terrainGui.addColor( colorSandDebug, 'color' ).name( 'colorSand' ).onChange( ( val ) => {
  					colorSand.value.set( val );
  				} );
  				const colorGrassDebug = { color: colorGrass.value.getHex() };
  				terrainGui.addColor( colorGrassDebug, 'color' ).name( 'colorGrass' ).onChange( ( val ) => {
  					colorGrass.value.set( val );
  				} );
  				const colorSnowDebug = { color: colorSnow.value.getHex() };
  				terrainGui.addColor( colorSnowDebug, 'color' ).name( 'colorSnow' ).onChange( ( val ) => {
  					colorSnow.value.set( val );
  				} );
  				const colorRockDebug = { color: colorRock.value.getHex() };
  				terrainGui.addColor( colorRockDebug, 'color' ).name( 'colorRock' ).onChange( ( val ) => {
  					colorRock.value.set( val );
  				} );
  
  				const waterGui = gui.addFolder( '💧 water' );
  
  				waterGui.add( water.material, 'roughness', 0, 1, 0.01 );
  				waterGui.add( water.material, 'ior', 1, 2, 0.001 );
  				const waterColorDebug = { color: water.material.color.getHex() };
  				waterGui.addColor( waterColorDebug, 'color' ).name( 'color' ).onChange( ( val ) => {
  					water.material.color.set( val );
  				} );
  
  				// events
  
  				window.addEventListener( 'pointermove', ( event ) => {
  
  					drag.screenCoords.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) - 0.5 ) * 2;
  					drag.screenCoords.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) - 0.5 ) * 2;
  
  				} );
  
  				renderer.domElement.addEventListener( 'pointerdown', () => {
  
  					if ( drag.hover ) {
  
  						renderer.domElement.style.cursor = 'grabbing';
  						controls.enabled = false;
  						drag.down = true;
  						drag.object.scale.setScalar( 10 );
  
  						const intersect = drag.getIntersect();
  						drag.prevWorldCoords.copy( intersect.point );
  						drag.worldCoords.copy( intersect.point );
  			
  					}
  
  				} );
  
  				window.addEventListener( 'pointerup', () => {
  
  					drag.down = false;
  					controls.enabled = true;
  					drag.object.scale.setScalar( 1 );
  			
  				} );
  
  				
  
  			}
  
  			
  
  			__stage.addUpdateCallback(async (_delta, _elapsed) => {
    drag.update();
  })
  
  		
}
</script>
