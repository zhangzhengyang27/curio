<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[3, 5, 8]"
    :camera-options="{ fov: 45, near: 0.25, far: 200 }"
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
import { Fn, abs, fract, fwidth, length, max, saturate, smoothstep, vec3, vec4, positionWorld, float } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { TSLGraphLoader } from 'three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>TSL Graph</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			
  			async function initTSLGraph() {
  
  				// Create Materials
  
  				const m1 = new THREE.MeshPhysicalNodeMaterial();
  				m1.userData.graphId = 'mat_1-physical';
  
  				const m2 = new THREE.MeshStandardNodeMaterial();
  				m2.userData.graphId = 'mat_2-standard';
  
  				const m3 = new THREE.MeshPhongNodeMaterial();
  				m3.userData.graphId = 'mat_3-phong';
  
  				const m4 = new THREE.MeshBasicNodeMaterial();
  				m4.userData.graphId = 'mat_4-basic';
  
  				const materials = [ m1, m2, m3, m4 ];
  
  				for ( let i = 0; i < materials.length; i ++ ) {
  
  					createShaderBall( materials[ i ], new THREE.Vector3( ( i & 1 ) * 4 - 2, 0, ( i & 2 ) * 2 - 2 ) );
  
  				}
  
  				// TSL Graph Editor
  
  				renderer.inspector.onExtension( 'TSL Graph', async ( tslGraph ) => {
  
  					renderer.inspector.setActiveTab( tslGraph );
  
  					// Apply TSL Graph from Local Storage if exists
  					// Every time a TSL Graph is changed, it will be stored in the local storage
  
  					if ( tslGraph.hasGraphs ) {
  
  						tslGraph.apply( scene );
  
  					} else {
  
  						// Load a TSL Graph from a file
  						// Use it for production
  
  						const tslLoader = new TSLGraphLoader();
  						const applier = await tslLoader.setPath( './shaders/' ).loadAsync( 'tsl-graphs.json' );
  
  						applier.apply( scene );
  
  					}
  
  				} );
  
  				// Active TSL Graph Editor
  				// Only is needed if you don't activate it from the GUI
  
  				renderer.inspector.setActiveExtension( 'TSL Graph', true );
  
  			}
  
  			async 
  
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = .9;
  				renderer.inspector = new Inspector();
  				scene.background = new THREE.Color( 0x444444 );
  
  				// Ground plane
  
  				const plane = new THREE.Mesh( new THREE.CircleGeometry( 40 ), createGroudMaterial() );
  				plane.rotation.x = - Math.PI / 2;
  				plane.renderOrder = - 1;
  				scene.add( plane );
  
  				//
  
  				
  				controls.connect( renderer.domElement );
  				controls.enableDamping = true;
  				controls.minDistance = 2;
  				controls.maxDistance = 40;
  
  				//
  
  				const environment = await new HDRLoader().setPath( ASSET_HOST + 'textures/equirectangular/' ).loadAsync( 'monochrome_studio_02_1k.hdr' );
  				environment.mapping = THREE.EquirectangularReflectionMapping;
  
  				const light = new THREE.DirectionalLight( 0xffffff, 1 );
  				light.position.set( 1, 1, 1 );
  				scene.add( light );
  
  				scene.environment = environment;
  
  				prefab = ( await new GLTFLoader().loadAsync( './models/gltf/ShaderBall.glb' ) ).scene;
  
  				await initTSLGraph();
  
  				initGUI();
  
  				// Events
  
  				resize();
  
  				
  				renderer.inspector.addEventListener( 'resize', resize );
  
  			
  
  
  			async function createShaderBall( material, position = new THREE.Vector3() ) {
  
  				const model = prefab.clone();
  				model.position.copy( position );
  				scene.add( model );
  
  				//
  
  				const calibrationMesh = model.getObjectByName( 'Calibration_Mesh' );
  				calibrationMesh.material = material;
  
  				const previewMesh = model.getObjectByName( 'Preview_Mesh' );
  				previewMesh.material = material;
  
  				calibrationMesh.renderOrder = 1;
  				previewMesh.renderOrder = 2;
  
  			}
  
  			function initGUI() {
  
  				const gui = renderer.inspector.createParameters( 'Shader Ball' );
  
  				const API = {
  					showCalibrationMesh: true,
  					showPreviewMesh: true
  				};
  
  				gui.add( API, 'showCalibrationMesh' )
  					.name( 'Calibration Mesh' )
  					.onChange( function ( value ) {
  
  						setVisibility( 'Calibration_Mesh', value );
  
  					} );
  
  				gui.add( API, 'showPreviewMesh' )
  					.name( 'Preview Mesh' )
  					.onChange( function ( value ) {
  
  						setVisibility( 'Preview_Mesh', value );
  
  					} );
  
  				renderer.inspector.hide();
  
  			}
  
  			function resize() {
  
  				const size = renderer.inspector.getSize();
  				const width = (__stage.container?.clientWidth || window.innerWidth) - size.width;
  				const height = (__stage.container?.clientHeight || window.innerHeight) - size.height;
  
  				camera.aspect = width / height;
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			function render() {
  
  				if ( controls ) controls.update();
  
  
  
  			}
  
  			//
  
  			function setVisibility( name, visible ) {
  
  				scene.traverse( function ( node ) {
  
  					if ( node.isMesh ) {
  
  						if ( node.name == name ) node.visible = visible;
  
  					}
  
  				} );
  
  			}
  
  			function createGroudMaterial() {
  
  				const material = new THREE.MeshBasicNodeMaterial();
  
  				const grid = Fn( ( [ coord, lineWidth = float( 0.01 ), dotSize = float( 0.03 ) ] ) => {
  
  					// https://bgolus.medium.com/the-best-darn-grid-shader-yet-727f9278b9d8
  
  					const g = fract( coord );
  					const fw = fwidth( coord );
  					const gx = abs( g.x.sub( 0.5 ) );
  					const gy = abs( g.y.sub( 0.5 ) );
  
  					const lineX = saturate( lineWidth.sub( gx ).div( fw.x ).add( 0.5 ) );
  					const lineY = saturate( lineWidth.sub( gy ).div( fw.y ).add( 0.5 ) );
  					const lines = max( lineX, lineY );
  
  					const squareDist = max( gx, gy );
  					const aa = max( fw.x, fw.y );
  					const dots = smoothstep( dotSize.add( aa ), dotSize.sub( aa ), squareDist );
  
  					return max( dots, lines );
  
  				} );
  
  				const fade = Fn( ( [ radius = float( 10.0 ), falloff = float( 1.0 ) ] ) => {
  
  					return smoothstep( radius, radius.sub( falloff ), length( positionWorld ) );
  
  				} );
  
  				const gridColor = vec4( vec3( 0.2 ), 1.0 );
  				const baseColor = vec4( vec3( 0.4 ), 0.0 );
  
  				material.colorNode = grid( positionWorld.xz, 0.007, 0.03 ).mix( baseColor, gridColor ).mul( fade( 30.0, 20.0 ) );
  				material.transparent = true;
  
  				return material;
  
  			}
  
  		
}
</script>
