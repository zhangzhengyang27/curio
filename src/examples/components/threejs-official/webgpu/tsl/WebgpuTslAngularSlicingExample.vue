<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-5, 5, 12]"
    :camera-options="{ fov: 35, near: 0.1, far: 100 }"
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
import { If, TWO_PI, atan, color, frontFacing, output, positionLocal, Fn, uniform, vec4 } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Angular Slicing</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  
  				
  
  				// environment
  
  				const hdrLoader = new UltraHDRLoader();
  				hdrLoader.load( ASSET_HOST + 'textures/equirectangular/royal_esplanade_2k.hdr.jpg', ( environmentMap ) => {
  
  					environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  
  					scene.background = environmentMap;
  					scene.environment = environmentMap;
  
  				} );
  
  				// lights
  
  				const directionalLight = new THREE.DirectionalLight( '#ffffff', 4 );
  				directionalLight.position.set( 6.25, 3, 4 );
  				directionalLight.castShadow = true;
  				directionalLight.shadow.mapSize.set( 2048, 2048 );
  				directionalLight.shadow.camera.near = 0.1;
  				directionalLight.shadow.camera.far = 30;
  				directionalLight.shadow.camera.top = 8;
  				directionalLight.shadow.camera.right = 8;
  				directionalLight.shadow.camera.bottom = - 8;
  				directionalLight.shadow.camera.left = - 8;
  				directionalLight.shadow.normalBias = 0.05;
  				scene.add( directionalLight );
  
  				// TSL functions
  			
  			const inAngle = Fn( ( [ position, angleStart, angleArc ]: any ) => {
  
  					const angle = atan( position.y, position.x ).sub( angleStart ).mod( TWO_PI ).toVar();
  					return angle.greaterThan( 0 ).and( angle.lessThan( angleArc ) );
  
  				} );
  
  				// materials
  
  				const defaultMaterial = new THREE.MeshPhysicalNodeMaterial( {
  					metalness: 0.5,
  					roughness: 0.25,
  					envMapIntensity: 0.5,
  					color: '#858080'
  				} );
  
  				const slicedMaterial = new THREE.MeshPhysicalNodeMaterial( {
  					metalness: 0.5,
  					roughness: 0.25,
  					envMapIntensity: 0.5,
  					color: '#858080',
  					side: THREE.DoubleSide
  				} );
  
  				// uniforms
  
  				const sliceStart = uniform( 1.75 );
  				const sliceArc = uniform( 1.25 );
  				const sliceColor = uniform( color( '#b62f58' ) );
  
  				// mask
  
  			const mask = (inAngle as any)( (positionLocal.xy as any), sliceStart, sliceArc ).not();
  
  				slicedMaterial.maskNode = mask;
  				//slicedMaterial.maskShadowNode = mask; // optional: custom mask shadows
  
  				// output
  
  				slicedMaterial.outputNode = Fn( () => {
  
  					// backface color
  
  					const finalOutput = output;
  					If( frontFacing.not(), () => {
  
  						finalOutput.assign( vec4( sliceColor, 1 ) );
  			
  					} );
  			
  					return finalOutput;
  			
  				} )();
  
  				// model
  
  				const dracoLoader = new DRACOLoader();
  
  				const gltfLoader = new GLTFLoader();
  				gltfLoader.setDRACOLoader( dracoLoader );
  
  				gltfLoader.load( ASSET_HOST + 'models/gltf/gears.glb', ( gltf ) => {
  
  					const model = gltf.scene;
  
  					model.traverse( ( child ) => {
  
  						if ( child.isMesh ) {
  
  							if ( child.name === 'outerHull' )
  								child.material = slicedMaterial;
  							else
  								child.material = defaultMaterial;
  
  							child.castShadow = true;
  							child.receiveShadow = true;
  			
  						}
  
  					} );
  
  					scene.add( model );
  			
  				} );
  
  				// plane
  
  				const plane = new THREE.Mesh(
  					new THREE.PlaneGeometry( 10, 10, 10 ),
  					new THREE.MeshStandardMaterial( { color: '#aaaaaa' } )
  				);
  				plane.receiveShadow = true;
  				plane.position.set( - 4, - 3, - 4 );
  				plane.lookAt( new THREE.Vector3( 0, 0, 0 ) );
  				scene.add( plane );
  
  				// renderer
  
  				
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  				renderer.shadowMap.enabled = true;
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				// events
  
  				
  
  				// debug
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  				gui.add( sliceStart, 'value', - Math.PI, Math.PI, 0.001 ).name( 'sliceStart' );
  				gui.add( sliceArc, 'value', 0, Math.PI * 2, 0.001 ).name( 'sliceArc' );
  				gui.addColor( { color: sliceColor.value.getHexString( THREE.SRGBColorSpace ) }, 'color' ).onChange( (value: any) => sliceColor.value.set( value ) );
  
  			
  
  
  			
  
  			async function animate() {
  			
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
