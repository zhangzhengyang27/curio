<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :clear-color="'#000000'"
    :camera-position="[6, 3, 10]"
    :camera-options="{ fov: 25, near: 0.1, far: 100 }"
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
import { color, mix, normalWorld, output, Fn, uniform, vec4, rotate, screenCoordinate, screenSize } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Halftone</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  

  
  
  
  
  
  
  			let timer: any, halftoneSettings: any;
  
  			init();
  
  			function init() {
  
  				
  
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// renderer
  
  				
  
  
  				renderer.setClearColor( '#000000' );
  
  
  				// inspector/gui
  
  				renderer.inspector = new Inspector();
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				// lights
  
  				const ambientLight = new THREE.AmbientLight( '#ffffff', 3 );
  				scene.add( ambientLight );
  
  				const directionalLight = new THREE.DirectionalLight( '#ffffff', 8 );
  				directionalLight.position.set( 4, 3, 1 );
  				scene.add( directionalLight );
  
  				const lightsFolder = gui.addFolder( '💡 lights' );
  				lightsFolder.add( ambientLight, 'intensity', 0, 10, 0.001 ).name( 'ambient intensity' );
  				lightsFolder.add( directionalLight, 'intensity', 0, 20, 0.001 ).name( 'directional intensity' );
  
  				// halftone settings
  
  				halftoneSettings = [
  
  					// purple shade
  
  					{
  						count: 140,
  						color: '#fb00ff',
  						direction: new THREE.Vector3( - 0.4, - 1, 0.5 ),
  						start: 1,
  						end: 0,
  						mixLow: 0,
  						mixHigh: 0.5,
  						radius: 0.8
  					},
  
  					// cyan highlight
  
  					{
  						count: 180,
  						color: '#94ffd1',
  						direction: new THREE.Vector3( 0.5, 0.5, - 0.2 ),
  						start: 0.55,
  						end: 0.2,
  						mixLow: 0.5,
  						mixHigh: 1,
  						radius: 0.8
  					}
  				];
  
  				for ( const index in halftoneSettings ) {
  
  					const settings = halftoneSettings[ index ];
  
  					// uniforms
  
  					const uniforms = {};
  
  					(uniforms as any).count = uniform( settings.count );
  					(uniforms as any).color = uniform( color( settings.color ) );
  					(uniforms as any).direction = uniform( settings.direction );
  					(uniforms as any).start = uniform( settings.start );
  					(uniforms as any).end = uniform( settings.end );
  					(uniforms as any).mixLow = uniform( settings.mixLow );
  					(uniforms as any).mixHigh = uniform( settings.mixHigh );
  					(uniforms as any).radius = uniform( settings.radius );
  
  					settings.uniforms = uniforms;
  
  					// debug
  
  					const folder = gui.addFolder( `⚪️ halftone ${index}` );
  
  					folder.addColor( { color: (uniforms as any).color.value }, 'color' );
  					folder.add( (uniforms as any).count, 'value', 1, 200, 1 ).name( 'count' );
  					folder.add( (uniforms as any).direction.value, 'x', - 1, 1, 0.01 ).listen();
  					folder.add( (uniforms as any).direction.value, 'y', - 1, 1, 0.01 ).listen();
  					folder.add( (uniforms as any).direction.value, 'z', - 1, 1, 0.01 ).listen();
  					folder.add( (uniforms as any).start, 'value', - 1, 1, 0.01 ).name( 'start' );
  					folder.add( (uniforms as any).end, 'value', - 1, 1, 0.01 ).name( 'end' );
  					folder.add( (uniforms as any).mixLow, 'value', 0, 1, 0.01 ).name( 'mix low' );
  					folder.add( (uniforms as any).mixHigh, 'value', 0, 1, 0.01 ).name( 'mix high' );
  					folder.add( (uniforms as any).radius, 'value', 0, 1, 0.01 ).name( 'radius' );
  
  				}
  
  				// halftone functions
  
  			const halftone = Fn( ( [ count, color, direction, start, end, radius, mixLow, mixHigh ]: any ) => {
  
  					// grid pattern
  
  					let gridUv = screenCoordinate.xy.div( screenSize.yy ).mul( count );
  					gridUv = (rotate as any)( gridUv, Math.PI * 0.25 ).mod( 1 );
  
  					// orientation strength
  
  					const orientationStrength = normalWorld
  						.dot( direction.normalize() )
  						.remapClamp( end, start, 0, 1 );
  
  					// mask
  
  					const mask = orientationStrength.mul( radius ).mul( 0.5 )
  						.step( gridUv.sub( 0.5 ).length() )
  						.mul( mix( mixLow, mixHigh, orientationStrength ) );
  
  					return vec4( color, mask );
  
  				} );
  
  			const halftones = Fn( ( [ input ]: any ) => {
  
  					const halftonesOutput = input;
  
  					for ( const settings of halftoneSettings ) {
  
  				const halfToneOutput = (halftone as any)( (settings.uniforms.count as any), settings.uniforms.color, settings.uniforms.direction, settings.uniforms.start, settings.uniforms.end, settings.uniforms.radius, settings.uniforms.mixLow, settings.uniforms.mixHigh );
  						halftonesOutput.rgb.assign( mix( halftonesOutput.rgb, halfToneOutput.rgb, halfToneOutput.a ) );
  
  					}
  
  					return halftonesOutput;
  
  				} );
  
  				// default material
  
  				const defaultMaterial = new THREE.MeshStandardNodeMaterial( { color: '#ff622e' } );
  				defaultMaterial.outputNode = (halftones as any)( (output as any) );
  
  				const folder = gui.addFolder( '🎨 default material' );
  				folder.addColor( { color: defaultMaterial.color }, 'color' );
  
  				// objects
  
  				const torusKnot = new THREE.Mesh(
  					new THREE.TorusKnotGeometry( 0.6, 0.25, 128, 32 ),
  					defaultMaterial
  				);
  				torusKnot.position.x = 3;
  				scene.add( torusKnot );
  
  				const sphere = new THREE.Mesh(
  					new THREE.SphereGeometry( 1, 64, 64 ),
  					defaultMaterial
  				);
  				sphere.position.x = - 3;
  				scene.add( sphere );
  
  				const gltfLoader = new GLTFLoader();
  				gltfLoader.load(
  					ASSET_HOST + 'models/gltf/Michelle.glb',
  					( gltf ) => {
  
  						const model = gltf.scene;
  						model.position.y = - 2;
  						model.scale.setScalar( 2.5 );
  						model.traverse( ( child ) => {
  
  							if ( child.isMesh )
  								(child!.material as any).outputNode = (halftones as any)( (output as any) );
  
  						} );
  
  						scene.add( model );
  
  					}
  				);
  
  				// controls
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				
  
  			}
  
  			
  
  			__stage.addUpdateCallback(async (_delta: any, _elapsed: any) => {
    timer.update();
    				const time = timer.getElapsed();
    				halftoneSettings[ 1 ].uniforms.direction.value.x = Math.cos( time );
    				halftoneSettings[ 1 ].uniforms.direction.value.y = Math.sin( time );
  })
  
  		
}
</script>
