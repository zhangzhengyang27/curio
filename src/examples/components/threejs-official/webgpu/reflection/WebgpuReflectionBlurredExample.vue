<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-2.5, 2, 2.5]"
    :camera-look-at="[0, 0.4, 0]"
    :camera-options="{ fov: 50, near: 0.25, far: 30 }"
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
import { Fn, vec4, fract, sample, abs, uniform, pow, color, max, length, rangeFogFactor, sub, reflector, normalWorld, hue, time, mix, positionWorld } from 'three/tsl';
import { hashBlur } from 'three/examples/jsm/tsl/display/hashBlur.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Blurred Reflection</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let model: any, mixer: any, timer;
  
  			let gui;
  
  			
  
  
  				
  
  
  
  				
  				scene.backgroundNode = hue( normalWorld.y.mix( 0, color( 0x0066ff ) ).mul( .1 ), time );
  
  				const waterAmbientLight = new THREE.HemisphereLight( 0xffffff, 0x0066ff, 10 );
  				scene.add( waterAmbientLight );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// animated model
  
  				const gltfLoader = new GLTFLoader();
  				gltfLoader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					model = gltf.scene;
  					model.children[ 0 ].children[ 0 ].castShadow = true;
  
  					mixer = new THREE.AnimationMixer( model );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					scene.add( model );
  
  				} );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const uvMap = textureLoader.load( ASSET_HOST + 'textures/uv_grid_directx.jpg' );
  				uvMap.colorSpace = THREE.SRGBColorSpace;
  
  				// uv map for debugging
  
  				const uvMaterial = new THREE.MeshStandardNodeMaterial( {
  					map: uvMap,
  					side: THREE.DoubleSide
  				} );
  
  				const uvMesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), uvMaterial );
  				uvMesh.position.set( 0, 1, - 3 );
  				scene.add( uvMesh );
  
  				// circle effect
  
  				const drawCircle = Fn( ( [ pos, radius, width, power, color, timer = time.mul( .5 ) ]: any ) => {
  
  					// https://www.shadertoy.com/view/3tdSRn
  
  					const dist1 = length( pos );
  					dist1.assign( fract( dist1.mul( 5.0 ).sub( fract( timer ) ) ) );
  					const dist2 = dist1.sub( radius );
  					const intensity = pow( radius.div( abs( dist2 ) ), width );
  					const col = color.rgb.mul( intensity ).mul( power ).mul( max( sub( 0.8, abs( dist2 ) ), 0.0 ) );
  
  					return col;
  
  				} );
  
  				const circleFadeY = positionWorld.y.mul( .7 ).oneMinus().max( 0 );
  				const animatedColor = mix( color( 0x74ccf4 ), color( 0x7f00c5 ), positionWorld.xz.distance( 0 ).div( 10 ).clamp() );
  				const animatedCircle = hue( (drawCircle as any)( (positionWorld.xz.mul as any)( .1 ), 0.5, 0.8, .01, animatedColor ).mul( circleFadeY ), time );
  
  				const floorLight = new THREE.PointLight( 0xffffff );
  				(floorLight as any).colorNode = animatedCircle.mul( 50 );
  				scene.add( floorLight );
  
  				// reflection
  
  				const roughness = uniform( .9 );
  				const radius = uniform( 0.2 );
  
  				const reflection = reflector( { resolutionScale: .5, depth: true, bounces: false } ); // 0.5 is half of the rendering view
  				const reflectionDepth = reflection.getDepthNode();
  				reflection.target.rotateX( - Math.PI / 2 );
  				scene.add( reflection.target );
  
  				const floorMaterial = new THREE.MeshStandardNodeMaterial();
  				floorMaterial.transparent = true;
  				floorMaterial.colorNode = Fn( () => {
  
  					// ranges adjustment
  
  					const radiusRange = mix( 0.01, 0.1, radius ); // range [ 0.01, 0.1 ]
  					const roughnessRange = mix( 0.3, 0.03, roughness ); // range [ 0.03, 0.3 ]
  
  					// mask the sample
  
  					const maskReflection = sample( ( uv ) => {
  
  						const sample = reflection.sample( uv );
  						const mask = reflectionDepth.sample( uv );
  
  						return vec4( sample.rgb, sample.a.mul( mask.r ) );
  
  					}, (reflection.uvNode as any) );
  
  					// blur the reflection
  
  					const reflectionBlurred = hashBlur( maskReflection, radiusRange, {
  						repeats: 40,
  						premultipliedAlpha: true
  					} as any );
  
  					// reflection composite
  
  					const reflectionMask = reflectionBlurred.a.mul( reflectionDepth ).remapClamp( 0, roughnessRange );
  					const reflectionIntensity = .1;
  					const reflectionMixFactor = reflectionMask.mul( roughness.mul( 2 ).min( 1 ) );
  					const reflectionFinal = (mix as any)( reflection.rgb, reflectionBlurred.rgb, (reflectionMixFactor as any) ).mul( reflectionIntensity );
  
  					// mix reflection with animated circle
  
  					const output = animatedCircle.add( reflectionFinal );
  
  					// falloff opacity by distance like an opacity-fog
  
  					const opacity = rangeFogFactor( 7, 25 ).oneMinus();
  
  					// final output
  
  					return vec4( output, opacity );
  
  				} )();
  
  				const floor = new THREE.Mesh( new THREE.BoxGeometry( 50, .001, 50 ), floorMaterial );
  				floor.position.set( 0, 0, 0 );
  				scene.add( floor );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 1.3;
  				renderer.inspector = new Inspector();
  
  
  				gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( roughness, 'value', 0, 1 ).name( 'roughness' );
  				gui.add( radius, 'value', 0, 1 ).name( 'radius' );
  				gui.add( reflection.reflector, 'resolutionScale', .25, 1 ).name( 'resolution scale' );
  
  				
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.maxPolarAngle = Math.PI / 2;
  				//controls.autoRotate = true;
  				controls.autoRotateSpeed = - .1;
  				controls.target.set( 0, .5, 0 );
  				controls.update();
  
  				// events
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( model ) {
    					mixer.update( delta );
    				}
  })
  
  		
}
</script>
