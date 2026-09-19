<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-2.5, 1.6, 3]"
    :camera-options="{ fov: 35, near: 0.25, far: 20 }"
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

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import * as WebGLTextureUtils from 'three/examples/jsm/utils/WebGLTextureUtils.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - USDZ exporter<br />\n\t\t\tCarbon Frame Bike by\n\t\t\t<a href=\"https://sketchfab.com/prefrontalcortex\" target=\"_blank\" rel=\"noopener\">prefrontal cortex</a>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let mixer: any, timer;
  
  			const params = {
  				exportUSDZ: exportUSDZ
  			};
  
  			
  
  
  				timer = new THREE.Timer();
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				
  
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  				const ktx2loader = new KTX2Loader().detectSupport( renderer );
  				const dracoLoader = new DRACOLoader();
  				const gltfLoader = new GLTFLoader();
  			
  				gltfLoader.setDRACOLoader( dracoLoader );
  				gltfLoader.setKTX2Loader( ktx2loader );
  				gltfLoader.setPath( ASSET_HOST + 'models/gltf/' );
  				gltfLoader.load( 'CarbonFrameBike.glb', async function ( gltf ) {
  
  					scene.add( gltf.scene );
  
  					if ( gltf.animations.length > 0 ) {
  
  						mixer = new THREE.AnimationMixer( gltf.scene );
  						const action = mixer.clipAction( gltf.animations[ 0 ] );
  						action.setLoop( THREE.LoopRepeat, Infinity );
  						action.play();
  
  					}
  
  
  					// USDZ
  
  					const exporter = new USDZExporter();
  					exporter.setTextureUtils( WebGLTextureUtils ); // for texture decompresssing
  					const arraybuffer = await exporter.parseAsync( gltf.scene, { animations: gltf.animations } );
  					const blob = new Blob( [ arraybuffer ], { type: 'application/octet-stream' } );
  
  					const link = document.createElement( 'a' );
  					link.style.display = 'none';
  					document.body.appendChild( link );
  					link.href = URL.createObjectURL( blob );
  
  				} );
  
  				
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.enableDamping = true;
  				controls.target.set( 0, 0.7, 0 );
  				controls.update();
  
  				
  
  				const isIOS = /iPad|iPhone|iPod/.test( navigator.userAgent );
  
  				if ( isIOS === false ) {
  
  					gui = new GUI();
  
  					gui.add( params, 'exportUSDZ' ).name( 'Export USDZ' );
  					gui.open();
  
  				}
  
  			
  
  
  			
  
  			function exportUSDZ() {
  
  				const link = document.createElement( 'a' );
  				link.style.display = 'none';
  				document.body.appendChild( link );
  				link.click();
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
