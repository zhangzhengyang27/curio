<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.1, 5, 0.548]"
    :camera-options="{ fov: 75, near: 0.1, far: 1000 }"
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
import * as TSL from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { WoodNodeMaterial, WoodGenuses, Finishes } from 'three/examples/jsm/materials/WoodNodeMaterial.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Procedural Woord Material</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  			let base: any, font: any, blockGeometry: any, gui: any;
  
  			// Helper function to get grid position
  			function getGridPosition( woodIndex: any, finishIndex: any ) {
  
  				return {
  					x: 0,
  					y: ( finishIndex - Finishes.length / 2 ) * 1.0,
  					z: ( woodIndex - WoodGenuses.length / 2 + 0.45 ) * 1.0
  				};
  
  			}
  
  			// Helper function to create the grid plane
  			function createGridPlane() {
  
  				const material = new THREE.MeshBasicNodeMaterial();
  
  				const gridXZ = TSL.Fn( ( [ gridSize = TSL.float( 1.0 ), dotWidth = TSL.float( 0.1 ), lineWidth = TSL.float( 0.02 ) ]: any ) => {
  
  					const coord = TSL.positionWorld.xz.div( gridSize );
  					const grid = TSL.fract( coord );
  
  					// Screen-space derivative for automatic antialiasing
  					const fw = TSL.fwidth( coord );
  					const smoothing = TSL.max( fw.x, fw.y ).mul( 0.5 );
  
  					// Create squares at cell centers
  					const squareDist = TSL.max( TSL.abs( grid.x.sub( 0.5 ) ), TSL.abs( grid.y.sub( 0.5 ) ) );
  					const dots = TSL.smoothstep( dotWidth.add( smoothing ), dotWidth.sub( smoothing ), squareDist );
  
  					// Create grid lines
  					const lineX = TSL.smoothstep( lineWidth.add( smoothing ), lineWidth.sub( smoothing ), TSL.abs( grid.x.sub( 0.5 ) ) );
  					const lineZ = TSL.smoothstep( lineWidth.add( smoothing ), lineWidth.sub( smoothing ), TSL.abs( grid.y.sub( 0.5 ) ) );
  					const lines = TSL.max( lineX, lineZ );
  
  					return TSL.max( dots, lines );
  
  				} );
  
  				const radialGradient = TSL.Fn( ( [ radius = TSL.float( 10.0 ), falloff = TSL.float( 1.0 ) ]: any ) => {
  
  					return TSL.smoothstep( radius, radius.sub( falloff ), TSL.length( TSL.positionWorld ) );
  
  				} );
  
  				// Create grid pattern
  				const gridPattern = (gridXZ as any)( 1.0, 0.03, 0.005 );
  				const baseColor = TSL.vec4( 1.0, 1.0, 1.0, 0.0 );
  				const gridColor = TSL.vec4( 0.5, 0.5, 0.5, 1.0 );
  
  				// Mix base color with grid lines
  				material.colorNode = gridPattern.mix( baseColor, gridColor ).mul( (radialGradient as any)( 30.0, 20.0 ) );
  				material.transparent = true;
  
  				const plane = new THREE.Mesh( new THREE.CircleGeometry( 40 ), material );
  				plane.rotation.x = - Math.PI / 2;
  				plane.renderOrder = - 1;
  
  				return plane;
  
  			}
  
  			// Helper function to create and position labels
  			function createLabel( text: any, font: any, material: any, position: any ) {
  
  				const txt_geo = new TextGeometry( text, {
  					font: font,
  					size: 0.1,
  					depth: 0.001,
  					curveSegments: 12,
  					bevelEnabled: false
  				} );
  
  				txt_geo.computeBoundingBox();
  				const offx = - 0.5 * ( (txt_geo as any)!.boundingBox.max.x - (txt_geo as any)!.boundingBox.min.x );
  				const offy = - 0.5 * ( (txt_geo as any)!.boundingBox.max.y - (txt_geo as any)!.boundingBox.min.y );
  				const offz = - 0.5 * ( (txt_geo as any)!.boundingBox.max.z - (txt_geo as any)!.boundingBox.min.z );
  				txt_geo.translate( offx, offy, offz );
  
  				const label = new THREE.Group();
  				const mesh = new THREE.Mesh( txt_geo );
  				label.add( mesh );
  
  				// Apply default rotation for labels
  				label.rotateY( - Math.PI / 2 );
  
  				label.children[ 0 ].material = material;
  				label.position.copy( position );
  				base.add( label );
  			
  			}
  
  			async function init() {
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  			
  
  				
  
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 1.0;
  				renderer.inspector = new Inspector();
  				controls.target.set( 0, 0, 0.548 );
  
  				gui = renderer.inspector.createParameters( 'Parameters' );
  			
  				font = await new FontLoader().loadAsync( ASSET_HOST + 'fonts/helvetiker_regular.typeface.json' );
  
  				// Create shared block geometry
  				blockGeometry = new RoundedBoxGeometry( 0.125, 0.9, 0.9, 10, 0.02 );
  
  				base = new THREE.Group();
  				base.rotation.set( 0, 0, - Math.PI / 2 );
  				base.position.set( 0, 0, 0.548 );
  				scene.add( base );
  
  				const text_mat = new THREE.MeshStandardMaterial();
  				text_mat.colorNode = TSL.color( '#000000' );
  
  				// Create finish labels (using negative wood index for left column)
  				for ( let y = 0; y < Finishes.length; y ++ ) {
  
  					createLabel( Finishes[ y ], font, text_mat, getGridPosition( - 1, y ) );
  
  				}
  
  				// Create and add the grid plane
  				const plane = createGridPlane();
  				scene.add( plane );
  
  				await new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.loadAsync( 'san_giuseppe_bridge_2k.hdr' ).then( ( texture ) => {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.environment = texture;
  						scene.environmentIntensity = 2;
  
  					} );
  
  				// Create wood labels (using negative finish index for top row)
  				for ( let x = 0; x < WoodGenuses.length; x ++ ) {
  
  					createLabel( WoodGenuses[ x ], font, text_mat, getGridPosition( x, - 1 ) );
  
  				}
  
  				// Create wood blocks
  				for ( let x = 0; x < WoodGenuses.length; x ++ ) {
  
  					for ( let y = 0; y < Finishes.length; y ++ ) {
  
  						const material = WoodNodeMaterial.fromPreset( WoodGenuses[ x ], Finishes[ y ] );
  						const cube = new THREE.Mesh( blockGeometry, material );
  
  						cube.position.copy( getGridPosition( x, y ) );
  						material.transformationMatrix = new THREE.Matrix4().setPosition( new THREE.Vector3( - 0.1, 0, Math.random() ) );
  						base.add( cube );
  
  						await new Promise( resolve => setTimeout( resolve, 0 ) );
  
  					}
  
  				}
  
  				add_custom_wood( text_mat );
  
  			}
  
  			function render() {
  
  				controls.update();
  
  
  			
  			}
  
  			window.addEventListener( 'resize', () => {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  			} );
  
  			if ( WebGPU.isAvailable() ) {
  
  				init();
  			
  			} else {
  
  				document.body.appendChild( WebGPU.getErrorMessage() );
  
  			}
  
  
  
  			function add_custom_wood( text_mat: any ) {
  
  				// Add "Custom" label (positioned at the end of the grid)
  				createLabel( 'custom', font, text_mat, getGridPosition( Math.round( WoodGenuses.length / 2 - 1 ), 5 ) );
  
  				// Create custom wood material with unique parameters
  				const customMaterial = new WoodNodeMaterial( {
  					centerSize: 1.11,
  					largeWarpScale: 0.32,
  					largeGrainStretch: 0.24,
  					smallWarpStrength: 0.059,
  					smallWarpScale: 2,
  					fineWarpStrength: 0.006,
  					fineWarpScale: 32.8,
  					ringThickness: 1 / 34,
  					ringBias: 0.03,
  					ringSizeVariance: 0.03,
  					ringVarianceScale: 4.4,
  					barkThickness: 0.3,
  					splotchScale: 0.2,
  					splotchIntensity: 0.541,
  					cellScale: 910,
  					cellSize: 0.1,
  					darkGrainColor: new THREE.Color( '#0c0504' ),
  					lightGrainColor: new THREE.Color( '#926c50' ),
  					clearcoat: 1,
  					clearcoatRoughness: 0.2
  				} );
  
  				gui.add( customMaterial, 'centerSize', 0.0, 2.0, 0.01 ).name( 'centerSize' );
  				gui.add( customMaterial, 'largeWarpScale', 0.0, 1.0, 0.001 ).name( 'largeWarpScale' );
  				gui.add( customMaterial, 'largeGrainStretch', 0.0, 1.0, 0.001 ).name( 'largeGrainStretch' );
  				gui.add( customMaterial, 'smallWarpStrength', 0.0, 0.2, 0.001 ).name( 'smallWarpStrength' );
  				gui.add( customMaterial, 'smallWarpScale', 0.0, 5.0, 0.01 ).name( 'smallWarpScale' );
  				gui.add( customMaterial, 'fineWarpStrength', 0.0, 0.05, 0.001 ).name( 'fineWarpStrength' );
  				gui.add( customMaterial, 'fineWarpScale', 0.0, 50.0, 0.1 ).name( 'fineWarpScale' );
  				gui.add( customMaterial, 'ringThickness', 0.0, 0.1, 0.001 ).name( 'ringThickness' );
  				gui.add( customMaterial, 'ringBias', - 0.2, 0.2, 0.001 ).name( 'ringBias' );
  				gui.add( customMaterial, 'ringSizeVariance', 0.0, 0.2, 0.001 ).name( 'ringSizeVariance' );
  				gui.add( customMaterial, 'ringVarianceScale', 0.0, 10.0, 0.1 ).name( 'ringVarianceScale' );
  				gui.add( customMaterial, 'barkThickness', 0.0, 1.0, 0.01 ).name( 'barkThickness' );
  				gui.add( customMaterial, 'splotchScale', 0.0, 1.0, 0.01 ).name( 'splotchScale' );
  				gui.add( customMaterial, 'splotchIntensity', 0.0, 1.0, 0.01 ).name( 'splotchIntensity' );
  				gui.add( customMaterial, 'cellScale', 100, 2000, 1 ).name( 'cellScale' );
  				gui.add( customMaterial, 'cellSize', 0.01, 0.5, 0.001 ).name( 'cellSize' );
  				gui.addColor( { darkGrainColor: '#0c0504' }, 'darkGrainColor' ).onChange( (v: any) => customMaterial.darkGrainColor.set( v ) );
  				gui.addColor( { lightGrainColor: '#926c50' }, 'lightGrainColor' ).onChange( (v: any) => customMaterial.lightGrainColor.set( v ) );
  				gui.add( customMaterial, 'clearcoat', 0.0, 1.0, 0.01 ).name( 'clearcoat' );
  				gui.add( customMaterial, 'clearcoatRoughness', 0.0, 1.0, 0.01 ).name( 'clearcoatRoughness' );
  
  				const cube = new THREE.Mesh( blockGeometry, customMaterial );
  
  				customMaterial.transformationMatrix = new THREE.Matrix4().setPosition( new THREE.Vector3( - 0.1, 0, Math.random() ) );
  				cube.position.copy( getGridPosition( Math.round( WoodGenuses.length / 2 ), 5 ) );
  
  				base.add( cube );
  
  			}
  
  		
}
</script>
