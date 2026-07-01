<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 13]"
    :camera-options="{ fov: 40, near: 1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl materials matcap<br />\n\t\t\tDrag-and-drop JPG, PNG, WebP, AVIF, or EXR MatCap image files<br/>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mesh;
  
  			const API = {
  				color: 0xffffff, // sRGB
  				exposure: 1.0
  			};
  
  			
  
  
  				// renderer
  				
  
  
  
  
  				// tone mapping
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  			 	renderer.toneMappingExposure = API.exposure;
  
  
  				// scene
  				
  
  				// camera
  				
  
  
  				// controls
  
  				controls.addEventListener( 'change', render );
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				// manager
  				const manager = new THREE.LoadingManager( render );
  
  				// matcap
  				const loaderEXR = new EXRLoader( manager );
  				const matcap = loaderEXR.load( ASSET_HOST + 'textures/matcaps/040full.exr' );
  
  				// normalmap
  				const loader = new THREE.TextureLoader( manager );
  
  				const normalmap = loader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg' );
  
  				// model
  				new GLTFLoader( manager ).load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					mesh = gltf.scene.children[ 0 ];
  					mesh.position.y = - 0.25;
  
  					mesh.material = new THREE.MeshMatcapMaterial( {
  
  						color: new THREE.Color().setHex( API.color ),
  						matcap: matcap,
  						normalMap: normalmap
  
  					} );
  
  					scene.add( mesh );
  
  				} );
  
  				// gui
  				const gui = new GUI();
  
  				gui.addColor( API, 'color' )
  					.listen()
  					.onChange( function () {
  
  						mesh.material.color.set( API.color );
  						render();
  
  					} );
  
  				gui.add( API, 'exposure', 0, 2 )
  					.onChange( function () {
  
  						renderer.toneMappingExposure = API.exposure;
  						render();
  
  					} );
  
  				gui.domElement.style.webkitUserSelect = 'none';
  
  				// drag 'n drop
  				initDragAndDrop();
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  			//
  			// drag and drop anywhere in document
  			//
  
  			function updateMatcap( texture ) {
  
  				if ( mesh.material.matcap ) {
  
  					mesh.material.matcap.dispose();
  
  				}
  
  				mesh.material.matcap = texture;
  
  				texture.needsUpdate = true;
  
  				mesh.material.needsUpdate = true; // because the color space can change
  
  				render();
  
  			}
  
  			function handleJPG( event ) { // PNG, WebP, AVIF, too
  
  				function imgCallback( event ) {
  
  					const texture = new THREE.Texture( event.target );
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					updateMatcap( texture );
  
  				}
  
  				const img = new Image();
  
  				img.onload = imgCallback;
  
  				img.src = event.target.result;
  
  			}
  
  			function handleEXR( event ) {
  
  				const loader = new EXRLoader();
  				const texture = loader.createDataTexture( event.target.result );
  
  				updateMatcap( texture );
  
  			}
  
  			function loadFile( file ) {
  
  				const filename = file.name;
  				const extension = filename.split( '.' ).pop().toLowerCase();
  
  				if ( extension === 'exr' ) {
  
  					const reader = new FileReader();
  
  					reader.addEventListener( 'load', function ( event ) {
  
  						handleEXR( event );
  
  					} );
  
  					reader.readAsArrayBuffer( file );
  
  				} else { // 'jpg', 'png'
  
  					const reader = new FileReader();
  
  					reader.addEventListener( 'load', function ( event ) {
  
  						handleJPG( event );
  
  					} );
  
  					reader.readAsDataURL( file );
  
  				}
  
  			}
  
  			function initDragAndDrop() {
  
  				document.addEventListener( 'dragover', function ( event ) {
  
  					event.preventDefault();
  					event.dataTransfer.dropEffect = 'copy';
  
  				} );
  
  				document.addEventListener( 'drop', function ( event ) {
  
  					event.preventDefault();
  
  					loadFile( event.dataTransfer.files[ 0 ] );
  
  				} );
  
  			}
  
  		
}
</script>
