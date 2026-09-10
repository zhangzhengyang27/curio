<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.4, 1.7, 9]"
    :camera-options="{ fov: 55, near: 0.1, far: 120 }"
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { densityFogFactor, mix, pass, reference, uniform, vec2 } from 'three/tsl';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { TreeGenerator } from 'three/examples/jsm/generators/TreeGenerator.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Fog - Scattering</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			let renderPipeline;
  
  			const timer = new THREE.Timer();
  
  			const params = {
  				scatteringEnabled: true
  			};
  
  			
  
  
  				
  
  
  				
  
  				// fog: a bright, cool haze. the background matches it so the trunks read
  				// as dark silhouettes that dissolve into depth — the scattering subject
  
  				scene.fog = new THREE.FogExp2( 0xc6cace, 0.11 );
  				scene.background = new THREE.Color( 0xc6cace );
  
  				// everything is a flat black silhouette — the fog and the scattering blur
  				// do all the shaping, so no lights are needed ( MeshBasicMaterial is unlit )
  
  				const material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
  
  				// a few seeded variants of a tall scots pine: a clean bole rising into a
  				// high, open crown of fine bare branches
  
  				const variants = [];
  
  				const generator = new TreeGenerator( material );
  
  				for ( let v = 0; v < 6; v ++ ) {
  
  					const mesh = generator
  						.setSeed( v + 1 )
  						.setTrunkLength( 2.6 + v * 0.3 ) // the crowns ride high in the fog
  						.setTrunkRadius( 0.06 )
  						.setTaper( 0.28 ) // slender, tapers slowly
  						.setLevels( 4 )
  						.setChildren( [ 7, 5, 4 ] ) // a wide whorl of limbs ramifying into many fine twigs
  						.setBranchAngle( [ 55, 50, 46 ] ) // a rounded crown that turns up
  						.setAngleVariance( 22 )
  						.setLengthRatio( 0.46 ) // short crown limbs ( a modest pine crown )
  						.setMinLength( 0.04 )
  						.setDroop( 0.05 )
  						.setUpPull( 0.42 ) // crown branches reach up toward the light
  						.setGnarl( [ 0, 0.14, 0.24, 0.34 ] ) // dead-straight trunk, wispier twigs
  						.setSectionLength( 0.34 )
  						.setRadialSegments( 7 )
  						.setRadiusExponent( 2.5 ) // slender bole, whippy thin twigs
  						.setMinRadius( 0.0023 ) // very fine twigs
  						.setTrunkClear( 0.72 ) // tall clean bole; the crown sits only at the top
  						.build();
  
  					variants.push( mesh.geometry );
  
  				}
  
  				const placements = variants.map( () => [] );
  
  				const dummy = new THREE.Object3D();
  				const cols = 13, rows = 12, spacing = 1.9;
  
  				for ( let i = 0; i < cols; i ++ ) {
  
  					for ( let j = 0; j < rows; j ++ ) {
  
  						const v = Math.floor( Math.random() * variants.length );
  
  						const x = ( i - cols / 2 ) * spacing + ( Math.random() - 0.5 ) * spacing * 0.8;
  						const z = j * spacing - rows * spacing + 4.2 + ( Math.random() - 0.5 ) * spacing * 0.8;
  
  						dummy.position.set( x, 0, z );
  
  						const scale = 0.85 + Math.random() * 0.4;
  						dummy.rotation.set( ( Math.random() - 0.5 ) * 0.05, Math.random() * Math.PI * 2, ( Math.random() - 0.5 ) * 0.05 ); // slight lean
  						dummy.scale.set( scale, scale * ( 0.9 + Math.random() * 0.3 ), scale );
  						dummy.updateMatrix();
  
  						placements[ v ].push( dummy.matrix.clone() );
  
  					}
  
  				}
  
  				variants.forEach( ( geometry, v ) => {
  
  					const list = placements[ v ];
  					const mesh = new THREE.InstancedMesh( geometry, material, list.length );
  					for ( let k = 0; k < list.length; k ++ ) mesh.setMatrixAt( k, list[ k ] );
  					mesh.instanceMatrix.needsUpdate = true;
  					scene.add( mesh );
  
  				} );
  
  				// a couple of dominant trunks close to the camera to anchor the depth
  
  				[ [ - 1.1, 4.9, 1.5, 1.1 ], [ 1.5, 4, 1.2, 0.3 ] ].forEach( ( [ x, z, s, ry ] ) => {
  
  					const hero = new THREE.Mesh( variants[ variants.length - 1 ], material );
  					hero.position.set( x, 0, z );
  					hero.rotation.y = ry;
  					hero.scale.setScalar( s );
  					scene.add( hero );
  
  				} );
  
  				// ground
  
  				const ground = new THREE.Mesh( new THREE.PlaneGeometry( 600, 600 ).rotateX( - Math.PI / 2 ), material );
  				scene.add( ground );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				
  				controls.movementSpeed = 2;
  				controls.lookSpeed = 0.1;
  				controls.lookAt( - 0.2, 1.7, - 8 );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				// uniforms
  
  				const density = reference( 'density', 'float', scene.fog );
  				const scattering = uniform( 2 );
  
  				// scene pass
  
  				const scenePass = pass( scene, camera );
  
  				const scenePassColor = scenePass.getTextureNode( 'output' );
  				const scenePassViewZ = scenePass.getViewZNode();
  
  				// blur pass (always downsampled to improve performance)
  
  				const sceneColorBlurred = gaussianBlur( scenePassColor, vec2( scattering ), 4, { resolutionScale: 0.5 } );
  
  				// composite
  
  				const fogFactor = densityFogFactor( density ).context( { getViewZ: () => scenePassViewZ } );
  
  				const compositeNode = mix( scenePassColor, sceneColorBlurred, fogFactor );
  			
  				renderPipeline.outputNode = compositeNode;
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( scene.fog, 'density', 0.025, 0.16 ).step( 0.0005 ).name( 'fog density' );
  				gui.add( scattering, 'value', 0, 5 ).name( 'scattering factor' );
  				gui.add( params, 'scatteringEnabled' ).name( 'enable scattering' ).onChange( ( value ) => {
  			
  					if ( value === true ) {
  
  						renderPipeline.outputNode = compositeNode;
  
  					} else {
  
  						renderPipeline.outputNode = scenePassColor;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  				} );
  
  				
  
  			
  
  
  			function resize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				controls.update( timer.getDelta() );
    				renderPipeline.render();
  })
  
  		
}
</script>
