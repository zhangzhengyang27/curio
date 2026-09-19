<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
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
import { stereoPass } from 'three/examples/jsm/tsl/display/StereoPassNode.js';
import { anaglyphPass, AnaglyphAlgorithm, AnaglyphColorMode } from 'three/examples/jsm/tsl/display/AnaglyphPassNode.js';
import { parallaxBarrierPass } from 'three/examples/jsm/tsl/display/ParallaxBarrierPassNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Stereo Effects</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let renderPipeline: any;
  
  			let stereo: any, anaglyph: any, parallaxBarrier: any;
  
  			let mesh, dummy, timer;
  
  			let anaglyphFolder: any;
  
  			const position = new THREE.Vector3();
  
  			const params = {
  				effect: 'stereo',
  				eyeSep: 0.064,
  				planeDistance: 3,
  				anaglyphAlgorithm: 'dubois',
  				anaglyphColorMode: 'redCyan'
  			};
  
  			const effects = { Stereo: 'stereo', Anaglyph: 'anaglyph', ParallaxBarrier: 'parallaxBarrier' };
  
  			const anaglyphAlgorithms = {
  				'True': AnaglyphAlgorithm.TRUE,
  				'Grey': AnaglyphAlgorithm.GREY,
  				'Colour': AnaglyphAlgorithm.COLOUR,
  				'Half-Colour': AnaglyphAlgorithm.HALF_COLOUR,
  				'Dubois': AnaglyphAlgorithm.DUBOIS,
  				'Optimised': AnaglyphAlgorithm.OPTIMISED,
  				'Compromise': AnaglyphAlgorithm.COMPROMISE
  			};
  
  			const anaglyphColorModes = {
  				'Red / Cyan': AnaglyphColorMode.RED_CYAN,
  				'Magenta / Cyan': AnaglyphColorMode.MAGENTA_CYAN,
  				'Magenta / Green': AnaglyphColorMode.MAGENTA_GREEN
  			};
  
  			
  
  
  				
  				camera.position.z = 3;
  
  				
  				scene.background = new THREE.CubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/Park3Med/' )
  					.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const geometry = new THREE.SphereGeometry( 0.1, 32, 16 );
  
  				const textureCube = new THREE.CubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/Park3Med/' )
  					.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
  
  				const material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube } );
  
  				mesh = new THREE.InstancedMesh( geometry, material, 500 );
  				mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
  
  				dummy = new THREE.Mesh();
  
  				for ( let i = 0; i < 500; i ++ ) {
  
  					dummy.position.x = Math.random() * 10 - 5;
  					dummy.position.y = Math.random() * 10 - 5;
  					dummy.position.z = Math.random() * 10 - 5;
  					dummy.scale.x = dummy.scale.y = dummy.scale.z = Math.random() * 3 + 1;
  
  					dummy.updateMatrix();
  
  					mesh.setMatrixAt( i, dummy.matrix );
  
  				}
  
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				stereo = stereoPass( scene, camera );
  				anaglyph = anaglyphPass( scene, camera );
  				parallaxBarrier = parallaxBarrierPass( scene, camera );
  
  				// Configure anaglyph for physically-correct stereo with zero parallax at scene center
  				anaglyph.eyeSep = params.eyeSep;
  				anaglyph.planeDistance = params.planeDistance;
  
  				renderPipeline.outputNode = stereo;
  
  				const gui = renderer.inspector.createParameters( 'Stereo Settings' );
  				gui.add( params, 'effect', effects ).onChange( update );
  				gui.add( params, 'eyeSep', 0.001, 0.15, 0.001 ).onChange( function ( value: any ) {
  
  					stereo.stereo.eyeSep = value;
  					anaglyph.eyeSep = value; // Anaglyph has direct eyeSep property
  					parallaxBarrier.stereo.eyeSep = value;
  
  				} );
  
  				// Anaglyph-specific settings folder
  				anaglyphFolder = gui.addFolder( 'Anaglyph Options' );
  				anaglyphFolder.add( params, 'anaglyphAlgorithm', anaglyphAlgorithms ).name( 'Algorithm' ).onChange( function ( value: any ) {
  
  					anaglyph.algorithm = value;
  
  				} );
  				anaglyphFolder.add( params, 'anaglyphColorMode', anaglyphColorModes ).name( 'Color Mode' ).onChange( function ( value: any ) {
  
  					anaglyph.colorMode = value;
  
  				} );
  				anaglyphFolder.add( params, 'planeDistance', 0.5, 10, 0.1 ).name( 'Plane Distance' ).onChange( function ( value: any ) {
  
  					anaglyph.planeDistance = value;
  
  				} );
  				anaglyphFolder.paramList.domElement.style.display = 'none';
  
  				
  
  
  				controls.minDistance = 1;
  				controls.maxDistance = 25;
  
  			
  
  
  			function update( value: any ) {
  
  				if ( value === 'stereo' ) {
  
  					renderPipeline.outputNode = stereo;
  					anaglyphFolder.paramList.domElement.style.display = 'none';
  
  				} else if ( value === 'anaglyph' ) {
  
  					renderPipeline.outputNode = anaglyph;
  					anaglyphFolder.paramList.domElement.style.display = '';
  
  				} else if ( value === 'parallaxBarrier' ) {
  
  					renderPipeline.outputNode = parallaxBarrier;
  					anaglyphFolder.paramList.domElement.style.display = 'none';
  
  				}
  
  				renderPipeline.needsUpdate = true;
  
  			}
  
  			
  
  			function extractPosition( matrix: any, position: any ) {
  
  				position.x = matrix.elements[ 12 ];
  				position.y = matrix.elements[ 13 ];
  				position.z = matrix.elements[ 14 ];
  
  			}
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const elapsedTime = timer.getElapsed() * 0.1;
    				for ( let i = 0; i < mesh.count; i ++ ) {
    					mesh.getMatrixAt( i, dummy.matrix );
    					extractPosition( dummy.matrix, position );
    					position.x = 5 * Math.cos( elapsedTime + i );
    					position.y = 5 * Math.sin( elapsedTime + i * 1.1 );
    					dummy.matrix.setPosition( position );
    					mesh.setMatrixAt( i, dummy.matrix );
    					mesh.instanceMatrix.needsUpdate = true;
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
