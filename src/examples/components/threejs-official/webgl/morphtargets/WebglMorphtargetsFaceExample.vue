<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1.8, 0.8, 3]"
    :camera-options="{ fov: 45, near: 1, far: 20 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - morph targets - face<br/>\n\t\t\tmodel by <a href=\"https://www.bannaflak.com/face-cap\" target=\"_blank\" rel=\"noopener\">Face Cap</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  
  
  
  			let stats, mixer, timer;
  
  			
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  				
  
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  
  				const ktx2Loader = new KTX2Loader()
  					.detectSupport( renderer );
  
  				new GLTFLoader()
  					.setKTX2Loader( ktx2Loader )
  					.setMeshoptDecoder( MeshoptDecoder )
  					.load( ASSET_HOST + 'models/gltf/facecap.glb', ( gltf ) => {
  
  						const mesh = gltf.scene.children[ 0 ];
  
  						scene.add( mesh );
  
  						mixer = new THREE.AnimationMixer( mesh );
  
  						mixer.clipAction( gltf.animations[ 0 ] ).play();
  
  						// GUI
  
  						const head = mesh.getObjectByName( 'mesh_2' );
  						const influences = head.morphTargetInfluences;
  
  						const gui = new GUI();
  						gui.close();
  
  						for ( const [ key, value ] of Object.entries( head.morphTargetDictionary ) ) {
  
  							gui.add( influences, value, 0, 1, 0.01 )
  								.name( key.replace( 'blendShape1.', '' ) )
  								.listen();
  
  						}
  
  					} );
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.background = new THREE.Color( 0x666666 );
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 2.5;
  				controls.maxDistance = 5;
  				controls.minAzimuthAngle = - Math.PI / 2;
  				controls.maxAzimuthAngle = Math.PI / 2;
  				controls.maxPolarAngle = Math.PI / 1.8;
  				controls.target.set( 0, 0.15, - 0.2 );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) {
    					mixer.update( delta );
    				}
    				stats.update();
  })
  
  		
}
</script>
