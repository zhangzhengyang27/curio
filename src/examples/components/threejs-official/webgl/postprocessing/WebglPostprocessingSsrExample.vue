<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0.13271600513224902, 0.3489546826045913, 0.43921296427927076]"
    :camera-look-at="[0, 0.0635, 0]"
    :camera-options="{ fov: 35, near: 0.1, far: 15 }"
    custom-render
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\tSSRPass demo by <a href=\"https://github.com/gonnavis\" target=\"_blank\">Vis</a>.<br />"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  
  		const params = {
  			enableSSR: true,
  			autoRotate: true,
  			otherMeshes: true,
  			groundReflector: true,
  		};
  		let composer;
  		let ssrPass;
  
  		let stats;
  
  
  		const otherMeshes = [];
  
  		const selects = [];
  
  		const container = document.querySelector( '#container' );
  
  		// Configure and create Draco decoder.
  		const dracoLoader = new DRACOLoader();
  
  		
  
  
  			
  
  
  			
  			scene.background = new THREE.Color( 0x443333 );
  			scene.fog = new THREE.Fog( 0x443333, 1, 4 );
  
  			// Ground
  			const plane = new THREE.Mesh(
  				new THREE.PlaneGeometry( 8, 8 ),
  				new THREE.MeshPhongMaterial( { color: 0xcbcbcb } )
  			);
  			plane.rotation.x = - Math.PI / 2;
  			plane.position.y = - 0.0001;
  			// plane.receiveShadow = true;
  			scene.add( plane );
  
  			// Lights
  			const hemiLight = new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 );
  			scene.add( hemiLight );
  
  			const spotLight = new THREE.SpotLight();
  			spotLight.intensity = 8;
  			spotLight.angle = Math.PI / 16;
  			spotLight.penumbra = 0.5;
  			// spotLight.castShadow = true;
  			spotLight.position.set( - 1, 1, 1 );
  			scene.add( spotLight );
  
  			dracoLoader.load( ASSET_HOST + 'models/draco/bunny.drc', function ( geometry ) {
  
  				geometry.computeVertexNormals();
  
  				const material = new THREE.MeshStandardMaterial( { color: 0xa5a5a5 } );
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.position.y = - 0.0365;
  				scene.add( mesh );
  				selects.push( mesh );
  
  				// Release decoder resources.
  				dracoLoader.dispose();
  
  			} );
  
  			let geometry, material, mesh;
  
  			geometry = new THREE.BoxGeometry( .05, .05, .05 );
  			material = new THREE.MeshStandardMaterial( { color: 'green' } );
  			mesh = new THREE.Mesh( geometry, material );
  			mesh.position.set( - .12, .025, .015 );
  			scene.add( mesh );
  			otherMeshes.push( mesh );
  			selects.push( mesh );
  
  			geometry = new THREE.IcosahedronGeometry( .025, 4 );
  			material = new THREE.MeshStandardMaterial( { color: 'cyan' } );
  			mesh = new THREE.Mesh( geometry, material );
  			mesh.position.set( - .05, .025, .08 );
  			scene.add( mesh );
  			otherMeshes.push( mesh );
  			selects.push( mesh );
  
  			geometry = new THREE.ConeGeometry( .025, .05, 64 );
  			material = new THREE.MeshStandardMaterial( { color: 'yellow' } );
  			mesh = new THREE.Mesh( geometry, material );
  			mesh.position.set( - .05, .025, - .055 );
  			scene.add( mesh );
  			otherMeshes.push( mesh );
  			selects.push( mesh );
  
  			geometry = new THREE.PlaneGeometry( 1, 1 );
  			groundReflector = new ReflectorForSSRPass( geometry, {
  				clipBias: 0.0003,
  				textureWidth: (__stage.container?.clientWidth || window.innerWidth),
  				textureHeight: (__stage.container?.clientHeight || window.innerHeight),
  				color: 0x888888,
  				useDepthTexture: true,
  			} );
  			groundReflector.material.depthWrite = false;
  			groundReflector.rotation.x = - Math.PI / 2;
  			groundReflector.visible = false;
  			scene.add( groundReflector );
  
  			// renderer
  			
  
  			//
  
  			
  			controls.enableDamping = true;
  			controls.target.set( 0, 0.0635, 0 );
  			controls.update();
  			controls.enabled = ! params.autoRotate;
  
  			// STATS
  
  			stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  			
  
  			// composer
  
  			composer = new EffectComposer( renderer );
  			ssrPass = new SSRPass( {
  				renderer,
  				scene,
  				camera,
  				width: innerWidth,
  				height: innerHeight,
  				groundReflector: params.groundReflector ? groundReflector : null,
  				selects: params.groundReflector ? selects : null
  			} );
  
  			composer.addPass( ssrPass );
  			composer.addPass( new OutputPass() );
  
  			// GUI
  
  			gui = new GUI( { width: 260 } );
  			gui.add( params, 'enableSSR' ).name( 'Enable SSR' );
  			gui.add( params, 'groundReflector' ).onChange( () => {
  
  				if ( params.groundReflector ) {
  
  					ssrPass.groundReflector = groundReflector,
  					ssrPass.selects = selects;
  
  				} else {
  
  					ssrPass.groundReflector = null,
  					ssrPass.selects = null;
  
  				}
  
  			} );
  			ssrPass.thickness = 0.018;
  			gui.add( ssrPass, 'resolutionScale' ).min( 0 ).max( 1 );
  			gui.add( ssrPass, 'thickness' ).min( 0 ).max( .1 ).step( .0001 );
  			ssrPass.infiniteThick = false;
  			gui.add( ssrPass, 'infiniteThick' );
  			gui.add( params, 'autoRotate' ).onChange( () => {
  
  				controls.enabled = ! params.autoRotate;
  
  			} );
  
  			const folder = gui.addFolder( 'more settings' );
  			folder.add( ssrPass, 'fresnel' ).onChange( ()=>{
  
  				groundReflector.fresnel = ssrPass.fresnel;
  
  			} );
  			folder.add( ssrPass, 'distanceAttenuation' ).onChange( ()=>{
  
  				groundReflector.distanceAttenuation = ssrPass.distanceAttenuation;
  
  			} );
  			ssrPass.maxDistance = .1;
  			groundReflector.maxDistance = ssrPass.maxDistance;
  			folder.add( ssrPass, 'maxDistance' ).min( 0 ).max( .5 ).step( .001 ).onChange( ()=>{
  
  				groundReflector.maxDistance = ssrPass.maxDistance;
  
  			} );
  			folder.add( params, 'otherMeshes' ).onChange( () => {
  
  				if ( params.otherMeshes ) {
  
  					otherMeshes.forEach( mesh => mesh.visible = true );
  
  				} else {
  
  					otherMeshes.forEach( mesh => mesh.visible = false );
  
  				}
  
  			} );
  			folder.add( ssrPass, 'bouncing' );
  			folder.add( ssrPass, 'output', {
  				'Default': SSRPass.OUTPUT.Default,
  				'SSR Only': SSRPass.OUTPUT.SSR,
  				'Beauty': SSRPass.OUTPUT.Beauty,
  				'Depth': SSRPass.OUTPUT.Depth,
  				'Normal': SSRPass.OUTPUT.Normal,
  				'Metalness': SSRPass.OUTPUT.Metalness,
  			} ).onChange( function ( value ) {
  
  				ssrPass.output = value;
  
  			} );
  			ssrPass.opacity = 1;
  			groundReflector.opacity = ssrPass.opacity;
  			folder.add( ssrPass, 'opacity' ).min( 0 ).max( 1 ).onChange( ()=>{
  
  				groundReflector.opacity = ssrPass.opacity;
  
  			} );
  			folder.add( ssrPass, 'blur' );
  			// folder.open()
  			// gui.close()
  
  		
  
  
  
  		
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    {
    if ( params.autoRotate ) {
    				const timer = Date.now() * 0.0003;
    				camera.position.x = Math.sin( timer ) * 0.5;
    				camera.position.y = 0.2135;
    				camera.position.z = Math.cos( timer ) * 0.5;
    			} else {
    			}
    			if ( params.enableSSR ) {
    				// TODO: groundReflector has full ground info, need use it to solve reflection gaps problem on objects when camera near ground.
    				// TODO: the normal and depth info where groundReflector reflected need to be changed.
    				composer.render();
    			} else {
    			}
    }
    			stats.end();
  })
  
  		function render() {
  
  			if ( params.autoRotate ) {
  
  				const timer = Date.now() * 0.0003;
  
  				camera.position.x = Math.sin( timer ) * 0.5;
  				camera.position.y = 0.2135;
  				camera.position.z = Math.cos( timer ) * 0.5;
  
  
  			} else {
  
  				controls.update();
  
  			}
  
  			if ( params.enableSSR ) {
  
  				// TODO: groundReflector has full ground info, need use it to solve reflection gaps problem on objects when camera near ground.
  				// TODO: the normal and depth info where groundReflector reflected need to be changed.
  				composer.render();
  
  			} else {
  
  
  
  			}
  
  		}
  	
}
</script>
