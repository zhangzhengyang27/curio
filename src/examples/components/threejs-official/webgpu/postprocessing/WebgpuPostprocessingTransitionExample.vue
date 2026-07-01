<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { uniform, pass } from 'three/tsl';
import { transition } from 'three/examples/jsm/tsl/display/TransitionNode.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Scene Transitions</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let renderPipeline, transitionController, transitionPass;
  
  			const textures = [];
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			const effectController = {
  				animateScene: true,
  				animateTransition: true,
  				transition: 0,
  				_transition: uniform( 0 ),
  				useTexture: true,
  				_useTexture: uniform( 1 ),
  				texture: 5,
  				cycle: true,
  				threshold: uniform( 0.1 ),
  			};
  
  			function generateInstancedMesh( geometry, material, count ) {
  
  				const mesh = new THREE.InstancedMesh( geometry, material, count );
  
  				const dummy = new THREE.Object3D();
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					dummy.position.x = Math.random() * 100 - 50;
  					dummy.position.y = Math.random() * 60 - 30;
  					dummy.position.z = Math.random() * 80 - 40;
  
  					dummy.rotation.x = Math.random() * 2 * Math.PI;
  					dummy.rotation.y = Math.random() * 2 * Math.PI;
  					dummy.rotation.z = Math.random() * 2 * Math.PI;
  
  					dummy.scale.x = Math.random() * 2 + 1;
  
  					if ( geometry.type === 'BoxGeometry' ) {
  
  						dummy.scale.y = Math.random() * 2 + 1;
  						dummy.scale.z = Math.random() * 2 + 1;
  
  					} else {
  
  						dummy.scale.y = dummy.scale.x;
  						dummy.scale.z = dummy.scale.x;
  
  					}
  
  					dummy.updateMatrix();
  
  					mesh.setMatrixAt( i, dummy.matrix );
  					mesh.setColorAt( i, color.setScalar( 0.1 + 0.9 * Math.random() ) );
  
  				}
  
  				return mesh;
  
  			}
  
  			function FXScene( geometry, rotationSpeed, backgroundColor ) {
  
  
  				camera.position.z = 20;
  
  				// Setup scene
  
  				scene.background = new THREE.Color( backgroundColor );
  				scene.add( new THREE.AmbientLight( 0xaaaaaa, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 1, 4 );
  				scene.add( light );
  
  				this.rotationSpeed = rotationSpeed;
  
  				const color = geometry.type === 'BoxGeometry' ? 0x0000ff : 0xff0000;
  				const material = new THREE.MeshPhongNodeMaterial( { color: color, flatShading: true } );
  				const mesh = generateInstancedMesh( geometry, material, 500 );
  				scene.add( mesh );
  
  				this.scene = scene;
  				this.camera = camera;
  				this.mesh = mesh;
  
  				this.update = function ( delta ) {
  
  					if ( effectController.animateScene ) {
  
  						mesh.rotation.x += this.rotationSpeed.x * delta;
  						mesh.rotation.y += this.rotationSpeed.y * delta;
  						mesh.rotation.z += this.rotationSpeed.z * delta;
  
  					}
  
  				};
  
  				this.resize = function () {
  
  					camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  					camera.updateProjectionMatrix();
  
  				};
  
  			}
  
  			const fxSceneA = new FXScene( new THREE.BoxGeometry( 2, 2, 2 ), new THREE.Vector3( 0, - 0.4, 0 ), 0xffffff );
  			const fxSceneB = new FXScene( new THREE.IcosahedronGeometry( 1, 1 ), new THREE.Vector3( 0, 0.2, 0.1 ), 0x000000 );
  
  			
  
  
  				// Initialize textures
  
  				const loader = new THREE.TextureLoader();
  
  				for ( let i = 0; i < 6; i ++ ) {
  
  					textures[ i ] = loader.load( ASSET_HOST + 'textures/transition/transition' + ( i + 1 ) + '.png' );
  
  				}
  
  				
  				renderer.inspector = new Inspector();
  
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePassA = pass( fxSceneA.scene, fxSceneA.camera );
  				const scenePassB = pass( fxSceneB.scene, fxSceneB.camera );
  
  				transitionPass = transition( scenePassA, scenePassB, new THREE.TextureNode( textures[ effectController.texture ] ), effectController._transition, effectController.threshold, effectController._useTexture );
  
  				renderPipeline.outputNode = transitionPass;
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( effectController, 'animateScene' ).name( 'Animate Scene' );
  				gui.add( effectController, 'animateTransition' ).name( 'Animate Transition' );
  				transitionController = gui.add( effectController, 'transition', 0, 1, 0.01 ).name( 'transition' ).onChange( () => {
  
  					effectController._transition.value = effectController.transition;
  
  				} );
  				gui.add( effectController, 'useTexture' ).onChange( () => {
  
  					const value = effectController.useTexture ? 1 : 0;
  					effectController._useTexture.value = value;
  
  				} );
  				gui.add( effectController, 'texture', { Perlin: 0, Squares: 1, Cells: 2, Distort: 3, Gradient: 4, Radial: 5 } );
  				gui.add( effectController, 'cycle' );
  				gui.add( effectController.threshold, 'value', 0, 1, 0.01 ).name( 'threshold' );
  
  			
  
  
  			
  
  			
  
  			new TWEEN.Tween( effectController )
  				.to( { transition: 1 }, 1500 )
  				.onUpdate( function ( ) {
  
  					transitionController.setValue( effectController.transition );
  
  					// Change the current alpha texture after each transition
  					if ( effectController.cycle ) {
  
  						if ( effectController.transition == 0 || effectController.transition == 1 ) {
  
  							effectController.texture = ( effectController.texture + 1 ) % textures.length;
  
  						}
  
  					}
  
  				} )
  				.repeat( Infinity )
  				.delay( 2000 )
  				.yoyo( true )
  				.start();
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				if ( effectController.animateTransition ) TWEEN.update();
    				if ( textures[ effectController.texture ] ) {
    					const mixTexture = textures[ effectController.texture ];
    					transitionPass.mixTextureNode.value = mixTexture;
    				}
    				const delta = timer.getDelta();
    				fxSceneA.update( delta );
    				fxSceneB.update( delta );
    {
    // Prevent render both scenes when it's not necessary
    				if ( effectController.transition === 0 ) {
    				} else if ( effectController.transition === 1 ) {
    				} else {
    					renderPipeline.render();
    				}
    }
  })
  
  			function render() {
  
  				// Prevent render both scenes when it's not necessary
  				if ( effectController.transition === 0 ) {
  
  					renderer.render( fxSceneB.scene, fxSceneB.camera );
  
  				} else if ( effectController.transition === 1 ) {
  
  					renderer.render( fxSceneA.scene, fxSceneA.camera );
  
  				} else {
  
  					renderPipeline.render();
  
  				}
  
  			}
  
}
</script>
