<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 20]"
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 40, near: 1, far: 200 }"
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

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> Click on a sphere to toggle bloom<br>By <a href=\"http://github.com/Temdog007\" target=\"_blank\" rel=\"noopener\">Temdog007</a>"

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {

	vUv = uv;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`

const fragmentShader = /* glsl */ `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
uniform float bloomStrength;

varying vec2 vUv;

void main() {

	gl_FragColor = ( texture2D( baseTexture, vUv ) + texture2D( bloomTexture, vUv ) * bloomStrength );

}
`

function onReady(__stage: any) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			const BLOOM_SCENE = 1;
  
  			const bloomLayer = new THREE.Layers();
  			bloomLayer.set( BLOOM_SCENE );
  
  			const params = {
  				threshold: 0,
  				strength: 1,
  				radius: 0.5,
  				exposure: 1
  			};
  
  			const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
  			const materials = {};
  
  
  
  
  			renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  
  			const pmremGenerator = new THREE.PMREMGenerator( renderer );
  			scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  
  
  
  
  
  			controls.maxPolarAngle = Math.PI * 0.5;
  			controls.minDistance = 1;
  			controls.maxDistance = 100;
  			controls.addEventListener( 'change', render );
  
  			const renderScene = new RenderPass( scene, camera );
  
  			const bloomPass = new UnrealBloomPass( new THREE.Vector2( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) ), 1.5, 0.4, 0.85 );
  			bloomPass.threshold = params.threshold;
  			bloomPass.strength = params.strength;
  			bloomPass.radius = params.radius;
  
  			const bloomRenderTarget = new THREE.WebGLRenderTarget( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight), { type: THREE.HalfFloatType } );
  			const bloomComposer = new EffectComposer( renderer, bloomRenderTarget );
  			bloomComposer.renderToScreen = false;
  			bloomComposer.addPass( renderScene );
  			bloomComposer.addPass( bloomPass );
  
  			const mixPass = new ShaderPass(
  				new THREE.ShaderMaterial( {
  					uniforms: {
  						baseTexture: { value: null },
  						bloomTexture: { value: bloomComposer.renderTarget2.texture },
  						bloomStrength: { value: params.strength }
  					},
  					vertexShader: vertexShader,
  					fragmentShader: fragmentShader,
  					defines: {}
  				} ), 'baseTexture'
  			);
  			mixPass.needsSwap = true;
  
  			const outputPass = new OutputPass();
  
  			const finalRenderTarget = new THREE.WebGLRenderTarget( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight), { type: THREE.HalfFloatType, samples: 4 } );
  			const finalComposer = new EffectComposer( renderer, finalRenderTarget );
  			finalComposer.addPass( renderScene );
  			finalComposer.addPass( mixPass );
  			finalComposer.addPass( outputPass );
  
  			const raycaster = new THREE.Raycaster();
  
  			const mouse = new THREE.Vector2();
  
  			window.addEventListener( 'pointerdown', onPointerDown );
  
  			gui = new GUI();
  
  			const bloomFolder = gui.addFolder( 'bloom' );
  
  			bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value: any ) {
  
  				bloomPass.threshold = Number( value );
  				render();
  
  			} );
  
  			bloomFolder.add( params, 'strength', 0.0, 3 ).onChange( function ( value: any ) {
  
  				bloomPass.strength = Number( value );
  				mixPass.material.uniforms.bloomStrength.value = bloomPass.strength;
  
  				render();
  
  			} );
  
  			bloomFolder.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value: any ) {
  
  				bloomPass.radius = Number( value );
  				render();
  
  			} );
  
  			const toneMappingFolder = gui.addFolder( 'tone mapping' );
  
  			toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value: any ) {
  
  				renderer.toneMappingExposure = Math.pow( value, 4.0 );
  				render();
  
  			} );
  
  			setupScene();
  
  			function onPointerDown( event: any ) {
  
  				mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  				raycaster.setFromCamera( mouse, camera );
  				const intersects = raycaster.intersectObjects( scene.children, false );
  				if ( intersects.length > 0 ) {
  
  					const object = intersects[ 0 ].object;
  					object.layers.toggle( BLOOM_SCENE );
  					render();
  
  				}
  
  			}
  
  			
  
  			function setupScene() {
  
  				scene.traverse( disposeMaterial );
  				scene.children.length = 0;
  
  				const geometry = new THREE.IcosahedronGeometry( 1, 15 );
  
  				for ( let i = 0; i < 50; i ++ ) {
  
  					const color = new THREE.Color();
  					color.setHSL( Math.random(), 0.7, Math.random() * 0.2 + 0.05 );
  
  					const material = new THREE.MeshStandardMaterial( { color: color, roughness: 1, metalness: 1 } );
  					const sphere = new THREE.Mesh( geometry, material );
  					sphere.position.x = Math.random() * 10 - 5;
  					sphere.position.y = Math.random() * 10 - 5;
  					sphere.position.z = Math.random() * 10 - 5;
  					sphere.position.normalize().multiplyScalar( Math.random() * 4.0 + 2.0 );
  					sphere.scale.setScalar( Math.random() * Math.random() + 0.5 );
  					scene.add( sphere );
  
  					if ( Math.random() < 0.25 ) sphere.layers.enable( BLOOM_SCENE );
  
  				}
  
  				render();
  
  			}
  
  			function disposeMaterial( obj: any ) {
  
  				if ( obj.material ) {
  
  					obj.material.dispose();
  
  				}
  
  			}
  
  			function render() {
  
  				scene.traverse( darkenNonBloomed );
  				bloomComposer.render();
  				scene.traverse( restoreMaterial );
  
  				// render the entire scene, then render bloom scene on top
  				finalComposer.render();
  
  			}
  
  			function darkenNonBloomed( obj: any ) {
  
  				if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
  
  					(materials as any)[ obj.uuid ] = obj.material;
  					obj.material = darkMaterial;
  
  				}
  
  			}
  
  			function restoreMaterial( obj: any ) {
  
  				if ( (materials as any)[ obj.uuid ] ) {
  
  					obj.material = (materials as any)[ obj.uuid ];
  					delete (materials as any)[ obj.uuid ];
  
  				}
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
