<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[10, 10, 20]"
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
import { Fn, abs, fract, fwidth, length, max, saturate, smoothstep, vec4, positionWorld, float } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MaterialXLoader } from 'three/examples/jsm/loaders/MaterialXLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>MaterialX Loader</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  
  
  			const SAMPLE_PATH = 'https://raw.githubusercontent.com/materialx/MaterialX/main/resources/Materials/Examples/StandardSurface/';
  			const LOCAL_SAMPLE_PATH = 'materialx/';
  			const samples = [
  				'standard_surface_brass_tiled.mtlx',
  				'standard_surface_brick_procedural.mtlx',
  				'standard_surface_carpaint.mtlx',
  				//'standard_surface_chess_set.mtlx',
  				'standard_surface_chrome.mtlx',
  				'standard_surface_copper.mtlx',
  				//'standard_surface_default.mtlx',
  				//'standard_surface_glass.mtlx',
  				//'standard_surface_glass_tinted.mtlx',
  				'standard_surface_gold.mtlx',
  				//'standard_surface_greysphere.mtlx',
  				//'standard_surface_greysphere_calibration.mtlx',
  				'standard_surface_jade.mtlx',
  				//'standard_surface_look_brass_tiled.mtlx',
  				//'standard_surface_look_wood_tiled.mtlx',
  				'standard_surface_marble_solid.mtlx',
  				'standard_surface_metal_brushed.mtlx',
  				'standard_surface_plastic.mtlx',
  				//'standard_surface_thin_film.mtlx',
  				'standard_surface_velvet.mtlx',
  				'standard_surface_wood_tiled.mtlx'
  			];
  
  			const localSamples = [
  				'heightnormal.mtlx',
  				'conditional_if_float.mtlx',
  				'image_transform.mtlx',
  				'color3_vec3_cm_test.mtlx',
  				'rotate2d_test.mtlx',
  				'rotate3d_test.mtlx',
  				'heighttonormal_normal_input.mtlx',
  				'roughness_test.mtlx',
  				'opacity_test.mtlx',
  				'opacity_only_test.mtlx',
  				'specular_test.mtlx',
  				'ior_test.mtlx',
  				'combined_test.mtlx',
  				'texture_opacity_test.mtlx',
  				'transmission_test.mtlx',
  				'transmission_only_test.mtlx',
  				'transmission_rough.mtlx',
  				'thin_film_rainbow_test.mtlx',
  				'thin_film_ior_clamp_test.mtlx',
  				'sheen_test.mtlx',
  			];
  
  
  			const models = [];
  
  			
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.LinearToneMapping;
  				renderer.toneMappingExposure = .5;
  				renderer.inspector = new Inspector();
  				scene.background = new THREE.Color( 0xffffff );
  
  				// Ground plane
  
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
  
  				const gridColor = vec4( 0.5, 0.5, 0.5, 1.0 );
  				const baseColor = vec4( 1.0, 1.0, 1.0, 0.0 );
  
  				material.colorNode = grid( positionWorld.xz, 0.007, 0.03 ).mix( baseColor, gridColor ).mul( fade( 30.0, 20.0 ) );
  				material.transparent = true;
  
  				const plane = new THREE.Mesh( new THREE.CircleGeometry( 40 ), material );
  				plane.rotation.x = - Math.PI / 2;
  				plane.renderOrder = - 1;
  				scene.add( plane );
  
  				//
  
  				
  				controls.connect( renderer.domElement );
  				controls.enableDamping = true;
  				controls.minDistance = 2;
  				controls.maxDistance = 40;
  
  				//
  
  				new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'san_giuseppe_bridge_2k.hdr', async ( texture ) => {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.environment = texture;
  
  						prefab = ( await new GLTFLoader().loadAsync( './models/gltf/ShaderBall.glb' ) ).scene;
  
  						for ( const sample of samples ) {
  
  							await addSample( sample, SAMPLE_PATH );
  
  						}
  
  						for ( const sample of localSamples ) {
  
  							await addSample( sample, LOCAL_SAMPLE_PATH );
  
  						}
  
  						addGUI();
  
  					} );
  
  				
  
  			
  
  
  			function updateModelsAlign() {
  
  				const COLUMN_COUNT = 6;
  				const DIST_X = 3;
  				const DIST_Z = 3;
  
  				const lineCount = Math.floor( models.length / COLUMN_COUNT ) - 1.5;
  
  				const offsetX = ( DIST_X * ( COLUMN_COUNT - 1 ) ) * - .5;
  				const offsetZ = ( DIST_Z * lineCount ) * .5;
  
  				for ( let i = 0; i < models.length; i ++ ) {
  
  					const model = models[ i ];
  
  					model.position.x = ( ( i % COLUMN_COUNT ) * DIST_X ) + offsetX;
  					model.position.z = ( Math.floor( i / COLUMN_COUNT ) * - DIST_Z ) + offsetZ;
  
  				}
  
  			}
  
  			async function addSample( sample, path ) {
  
  				const model = prefab.clone();
  
  				models.push( model );
  
  				scene.add( model );
  
  				updateModelsAlign();
  
  				//
  
  				const material = await new MaterialXLoader()
  					.setPath( path )
  					.loadAsync( sample )
  					.then( ( { materials } ) => Object.values( materials ).pop() );
  
  				const calibrationMesh = model.getObjectByName( 'Calibration_Mesh' );
  				calibrationMesh.material = material;
  
  				const previewMesh = model.getObjectByName( 'Preview_Mesh' );
  				previewMesh.material = material;
  
  				if ( material.transparent ) {
  
  					calibrationMesh.renderOrder = 1;
  					previewMesh.renderOrder = 2;
  
  				}
  
  				await renderer.compileAsync( model, camera, scene );
  
  			}
  
  			function addGUI() {
  
  				const gui = renderer.inspector.createParameters( 'MaterialX Loader' );
  
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
  
  			}
  
  			function setVisibility( name, visible ) {
  
  				scene.traverse( function ( node ) {
  
  					if ( node.isMesh ) {
  
  						if ( node.name == name ) node.visible = visible;
  
  					}
  
  				} );
  
  			}
  
  			//
  
  			
  
  			function render() {
  
  				controls.update();
  
  
  			}
  
  		
}
</script>
