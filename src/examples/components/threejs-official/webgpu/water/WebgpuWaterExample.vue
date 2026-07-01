<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[-20, 6, -30]"
    :camera-options="{ fov: 45, near: 0.1, far: 200 }"
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
import { pass, mrt, output, emissive, renderOutput } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { fxaa } from 'three/examples/jsm/tsl/display/FXAANode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { WaterMesh } from 'three/examples/jsm/objects/Water2Mesh.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Water</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  
  			let water, renderPipeline;
  
  			const params = {
  				color: '#99e0ff',
  				scale: 2,
  				flowX: 1,
  				flowY: 1
  			};
  
  			
  			async 
  
  
  				
  
  				const loader = new UltraHDRLoader();
  				loader.load( ASSET_HOST + 'textures/equirectangular/moonless_golf_2k.hdr.jpg', function ( texture ) {
  
  					texture.mapping = THREE.EquirectangularReflectionMapping;
  					texture.needsUpdate = true;
  
  					scene.background = texture;
  					scene.environment = texture;
  
  				} );
  
  				// camera
  
  				
  
  
  				// asset loading
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const gltfLoader = new GLTFLoader();
  				gltfLoader.setDRACOLoader( dracoLoader );
  			
  				const textureLoader = new THREE.TextureLoader();
  
  				const [ gltf, normalMap0, normalMap1 ] = await Promise.all( [
  					gltfLoader.loadAsync( ASSET_HOST + 'models/gltf/pool.glb' ),
  					textureLoader.loadAsync( ASSET_HOST + 'textures/water/Water_1_M_Normal.jpg' ),
  					textureLoader.loadAsync( ASSET_HOST + 'textures/water/Water_2_M_Normal.jpg' )
  				] );
  
  				gltf.scene.position.z = 2;
  				gltf.scene.scale.setScalar( 0.1 );
  				scene.add( gltf.scene );
  
  				// water
  
  				normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
  				normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;
  
  				const waterGeometry = new THREE.PlaneGeometry( 30, 40 );
  
  				water = new WaterMesh( waterGeometry, {
  					color: params.color,
  					scale: params.scale,
  					flowDirection: new THREE.Vector2( params.flowX, params.flowY ),
  					normalMap0: normalMap0,
  					normalMap1: normalMap1
  				} );
  
  				water.position.set( 0, 0.2, - 2 );
  				water.rotation.x = Math.PI * - 0.5;
  				water.renderOrder = Infinity;
  				scene.add( water );
  
  				// floor
  
  				const floorGeometry = new THREE.PlaneGeometry( 1, 1 );
  				floorGeometry.rotateX( - Math.PI * 0.5 );
  				const floorMaterial = new THREE.MeshStandardMaterial( {
  					color: 0x444444,
  					roughness: 1,
  					metalness: 0,
  					side: THREE.DoubleSide
  				} );
  
  				{
  
  					const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  					floor.position.set( 20, 0, 0 );
  					floor.scale.set( 15, 1, 80 );
  					scene.add( floor );
  
  				}
  
  				{
  
  					const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  					floor.position.set( - 20, 0, 0 );
  					floor.scale.set( 15, 1, 80 );
  					scene.add( floor );
  
  				}
  
  				{
  
  					const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  					floor.position.set( 0, 0, 30 );
  					floor.scale.set( 30, 1, 20 );
  					scene.add( floor );
  
  				}
  
  				{
  
  					const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  					floor.position.set( 0, 0, - 30 );
  					floor.scale.set( 30, 1, 20 );
  					scene.add( floor );
  
  				}
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 0.5;
  				renderer.inspector = new Inspector();
  
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputColorTransform = false;
  			
  				const scenePass = pass( scene, camera );
  				scenePass.setMRT( mrt( {
  					output,
  					emissive
  				} ) );
  
  				const beautyPass = scenePass.getTextureNode();
  				const emissivePass = scenePass.getTextureNode( 'emissive' );
  
  				const bloomPass = bloom( emissivePass, 2 );
  
  				const outputPass = renderOutput( beautyPass.add( bloomPass ) );
  
  				const fxaaPass = fxaa( outputPass );
  				renderPipeline.outputNode = fxaaPass;
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Water' );
  				const waterNode = water.material.colorNode;
  
  				gui.addColor( params, 'color' ).onChange( function ( value ) {
  
  					waterNode.color.value.set( value );
  
  				} );
  				gui.add( params, 'scale', 1, 10 ).onChange( function ( value ) {
  
  					waterNode.scale.value = value;
  
  				} );
  				gui.add( params, 'flowX', - 1, 1, 0.01 ).onChange( function ( value ) {
  
  					waterNode.flowDirection.value.x = value;
  					waterNode.flowDirection.value.normalize();
  
  				} );
  				gui.add( params, 'flowY', - 1, 1, 0.01 ).onChange( function ( value ) {
  
  					waterNode.flowDirection.value.y = value;
  					waterNode.flowDirection.value.normalize();
  
  				} );
  
  				//
  
  				
  				controls.enableDamping = true;
  				controls.target.set( 0, 0, - 5 );
  				controls.update();
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  		
}
</script>
