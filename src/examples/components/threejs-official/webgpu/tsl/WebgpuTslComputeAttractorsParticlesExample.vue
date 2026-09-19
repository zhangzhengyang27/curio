<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :clear-color="'#000000'"
    :camera-position="[3, 5, 8]"
    :camera-options="{ fov: 25, near: 0.1, far: 100 }"
    :enable-controls="false"
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
import { float, If, PI, color, cos, instanceIndex, Loop, mix, mod, sin, instancedArray, Fn, uint, uniform, uniformArray, hash, vec3, vec4 } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Attractors Particles</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let updateCompute: any;
  
  			init();
  
  			async function init() {
  
  				
  
  
  				
  
  				// ambient light
  
  				const ambientLight = new THREE.AmbientLight( '#ffffff', 0.5 );
  				scene.add( ambientLight );
  
  				// directional light
  
  				const directionalLight = new THREE.DirectionalLight( '#ffffff', 1.5 );
  				directionalLight.position.set( 4, 2, 0 );
  				scene.add( directionalLight );
  
  				// renderer
  
  				
  
  
  				renderer.setClearColor( '#000000' );
  				renderer.inspector = new Inspector();
  
  
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				
  
  				// attractors
  
  				const attractorsPositions = uniformArray( [
  					new THREE.Vector3( - 1, 0, 0 ),
  					new THREE.Vector3( 1, 0, - 0.5 ),
  					new THREE.Vector3( 0, 0.5, 1 )
  				] );
  				const attractorsRotationAxes = uniformArray( [
  					new THREE.Vector3( 0, 1, 0 ),
  					new THREE.Vector3( 0, 1, 0 ),
  					new THREE.Vector3( 1, 0, - 0.5 ).normalize()
  				] );
  				const attractorsLength = uniform( attractorsPositions.array.length, 'uint' );
  				const attractors: any = [];
  				const helpersRingGeometry = new THREE.RingGeometry( 1, 1.02, 32, 1, 0, Math.PI * 1.5 );
  				const helpersArrowGeometry = new THREE.ConeGeometry( 0.1, 0.4, 12, 1, false );
  				const helpersMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide } );
  
  				for ( let i = 0; i < attractorsPositions.array.length; i ++ ) {
  
  					const attractor = {};
  
  					(attractor as any).position = attractorsPositions.array[ i ];
  					(attractor as any).orientation = attractorsRotationAxes.array[ i ];
  					(attractor as any).reference = new THREE.Object3D();
  					(attractor as any).reference.position.copy( (attractor as any).position );
  					(attractor as any).reference.quaternion.setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), (attractor as any).orientation );
  					scene.add( (attractor as any).reference );
  
  					(attractor as any).helper = new THREE.Group();
  					(attractor as any).helper.scale.setScalar( 0.325 );
  					(attractor as any).reference.add( (attractor as any).helper );
  
  					(attractor as any).ring = new THREE.Mesh( helpersRingGeometry, helpersMaterial );
  					(attractor as any).ring.rotation.x = - Math.PI * 0.5;
  					(attractor as any).helper.add( (attractor as any).ring );
  
  					(attractor as any).arrow = new THREE.Mesh( helpersArrowGeometry, helpersMaterial );
  					(attractor as any).arrow.position.x = 1;
  					(attractor as any).arrow.position.z = 0.2;
  					(attractor as any).arrow.rotation.x = Math.PI * 0.5;
  					(attractor as any).helper.add( (attractor as any).arrow );
  
  					(attractor as any).controls = new TransformControls( camera, renderer.domElement );
  					(attractor as any).controls.mode = 'rotate';
  					(attractor as any).controls.size = 0.5;
  					(attractor as any).controls.attach( (attractor as any).reference );
  					(attractor as any).controls.visible = true;
  					(attractor as any).controls.enabled = (attractor as any).controls.visible;
  					scene.add( (attractor as any).controls.getHelper() );
  
  					(attractor as any).controls.addEventListener( 'dragging-changed', ( event: any ) => {
  
  						controls.enabled = ! event.value;
  
  					} );
  
  					(attractor as any).controls.addEventListener( 'change', () => {
  
  						(attractor as any).position.copy( (attractor as any).reference.position );
  						(attractor as any).orientation.copy( new THREE.Vector3( 0, 1, 0 ).applyQuaternion( (attractor as any).reference.quaternion ) );
  
  					} );
  
  					attractors.push( attractor );
  
  				}
  
  				// particles
  
  				const count = Math.pow( 2, 18 );
  				const material = new THREE.SpriteNodeMaterial( { blending: THREE.AdditiveBlending, depthWrite: false } );
  
  				const attractorMass = uniform( Number( `1e${7}` ) );
  				const particleGlobalMass = uniform( Number( `1e${4}` ) );
  				const timeScale = uniform( 1 );
  				const spinningStrength = uniform( 2.75 );
  				const maxSpeed = uniform( 8 );
  				const gravityConstant = 6.67e-11;
  				const velocityDamping = uniform( 0.1 );
  				const scale = uniform( 0.008 );
  				const boundHalfExtent = uniform( 8 );
  				const colorA = uniform( color( '#5900ff' ) );
  				const colorB = uniform( color( '#ffa575' ) );
  
  				const positionBuffer = instancedArray( count, 'vec3' );
  				const velocityBuffer = instancedArray( count, 'vec3' );
  
  			const sphericalToVec3 = Fn( ( [ phi, theta ]: any ) => {
  
  					const sinPhiRadius = sin( phi );
  
  					return vec3(
  						sinPhiRadius.mul( sin( theta ) ),
  						cos( phi ),
  						sinPhiRadius.mul( cos( theta ) )
  					);
  
  				} );
  
  				// init compute
  
  				const init = Fn( () => {
  
  					const position = positionBuffer.element( instanceIndex );
  					const velocity = velocityBuffer.element( instanceIndex );
  
  					const basePosition = vec3(
  						hash( instanceIndex.add( uint( Math.random() * 0xffffff ) ) ),
  						hash( instanceIndex.add( uint( Math.random() * 0xffffff ) ) ),
  						hash( instanceIndex.add( uint( Math.random() * 0xffffff ) ) )
  					).sub( 0.5 ).mul( vec3( 5, 0.2, 5 ) );
  					position.assign( basePosition );
  
  					const phi = hash( instanceIndex.add( uint( Math.random() * 0xffffff ) ) ).mul( PI ).mul( 2 );
  					const theta = hash( instanceIndex.add( uint( Math.random() * 0xffffff ) ) ).mul( PI );
  				const baseVelocity = (sphericalToVec3 as any)( phi, theta ).mul( 0.05 );
  					velocity.assign( baseVelocity );
  
  				} );
  
  				const initCompute = init().compute( count );
  
  				const reset = () => {
  
  					renderer.compute( initCompute );
  
  				};
  
  				reset();
  
  				// update compute
  
  				const particleMassMultiplier = hash( instanceIndex.add( uint( Math.random() * 0xffffff ) ) ).remap( 0.25, 1 ).toVar();
  				const particleMass = particleMassMultiplier.mul( particleGlobalMass ).toVar();
  
  				const update = Fn( () => {
  
  					// const delta = timerDelta().mul( timeScale ).min( 1 / 30 ).toVar();
  					const delta = float( 1 / 60 ).mul( timeScale ).toVar(); // uses fixed delta to consistent result
  					const position = positionBuffer.element( instanceIndex );
  					const velocity = velocityBuffer.element( instanceIndex );
  
  					// force
  
  					const force = vec3( 0 ).toVar();
  
  				(Loop as any)( attractorsLength, ( { i }: any ) => {
  
  						const attractorPosition = attractorsPositions.element( i );
  						const attractorRotationAxis = attractorsRotationAxes.element( i );
  						const toAttractor = (attractorPosition as any).sub( position );
  						const distance = toAttractor.length();
  						const direction = toAttractor.normalize();
  
  						// gravity
  						const gravityStrength = attractorMass.mul( particleMass ).mul( gravityConstant ).div( distance.pow( 2 ) ).toVar();
  						const gravityForce = direction.mul( gravityStrength );
  						force.addAssign( gravityForce );
  
  						// spinning
  						const spinningForce = (attractorRotationAxis as any).mul( gravityStrength ).mul( spinningStrength );
  						const spinningVelocity = spinningForce.cross( toAttractor );
  						force.addAssign( spinningVelocity );
  
  					} );
  
  					// velocity
  
  					velocity.addAssign( force.mul( delta ) );
  					const speed = velocity.length();
  					If( speed.greaterThan( maxSpeed ), () => {
  
  						velocity.assign( velocity.normalize().mul( maxSpeed ) );
  
  					} );
  					velocity.mulAssign( velocityDamping.oneMinus() );
  
  					// position
  
  					position.addAssign( velocity.mul( delta ) );
  
  					// box loop
  
  					const halfHalfExtent = boundHalfExtent.div( 2 ).toVar();
  					position.assign( mod( position.add( halfHalfExtent ), boundHalfExtent ).sub( halfHalfExtent ) );
  
  				} );
  				updateCompute = update().compute( count ).setName( 'Update Particles' );
  
  				// nodes
  
  				material.positionNode = positionBuffer.toAttribute();
  
  				material.colorNode = Fn( () => {
  
  					const velocity = velocityBuffer.toAttribute();
  					const speed = velocity.length();
  					const colorMix = speed.div( maxSpeed ).smoothstep( 0, 0.5 );
  					const finalColor = mix( colorA, colorB, colorMix );
  
  					return vec4( finalColor, 1 );
  
  				} )();
  
  				material.scaleNode = particleMassMultiplier.mul( scale );
  
  				// mesh
  
  				const geometry = new THREE.PlaneGeometry( 1, 1 );
  				const mesh = new THREE.InstancedMesh( geometry, material, count );
  				scene.add( mesh );
  
  				// debug
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui.add( { attractorMassExponent: attractorMass.value.toString().length - 1 }, 'attractorMassExponent', 1, 10, 1 ).onChange( (value: any) => attractorMass.value = Number( `1e${value}` ) );
  				gui.add( { particleGlobalMassExponent: particleGlobalMass.value.toString().length - 1 }, 'particleGlobalMassExponent', 1, 10, 1 ).onChange( (value: any) => particleGlobalMass.value = Number( `1e${value}` ) );
  				gui.add( maxSpeed, 'value', 0, 10, 0.01 ).name( 'maxSpeed' );
  				gui.add( velocityDamping, 'value', 0, 0.1, 0.001 ).name( 'velocityDamping' );
  				gui.add( spinningStrength, 'value', 0, 10, 0.01 ).name( 'spinningStrength' );
  				gui.add( scale, 'value', 0, 0.1, 0.001 ).name( 'scale' );
  				gui.add( boundHalfExtent, 'value', 0, 20, 0.01 ).name( 'boundHalfExtent' );
  				gui.addColor( { color: colorA.value.getHexString( THREE.SRGBColorSpace ) }, 'color' ).name( 'colorA' ).onChange( (value: any) => colorA.value.set( value ) );
  				gui.addColor( { color: colorB.value.getHexString( THREE.SRGBColorSpace ) }, 'color' ).name( 'colorB' ).onChange( (value: any) => colorB.value.set( value ) );
  				gui.add( { controlsMode: attractors[ 0 ].controls.mode }, 'controlsMode', [ 'translate', 'rotate', 'none' ] ).onChange( (value: any) => {
  
  					for ( const attractor of attractors ) {
  
  						if ( value === 'none' ) {
  
  							attractor.controls.visible = false;
  							attractor.controls.enabled = false;
  
  						} else {
  
  							attractor.controls.visible = true;
  							attractor.controls.enabled = true;
  							attractor.controls.mode = value;
  
  						}
  
  					}
  
  				} );
  
  				gui.add( { helperVisible: attractors[ 0 ].helper.visible }, 'helperVisible' ).onChange( (value: any) => {
  
  					for ( const attractor of attractors ) {
  
  						attractor.helper.visible = value;
  
  					}
  
  				} );
  
  				gui.add( { reset }, 'reset' );
  
  			}
  
  			
  
  			__stage.addUpdateCallback(async (_delta: any, _elapsed: any) => {
    renderer.compute( updateCompute );
  })
  
  		
}
</script>
