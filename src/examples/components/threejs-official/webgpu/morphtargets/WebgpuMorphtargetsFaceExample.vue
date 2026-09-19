<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1.8, 0.8, 3]"
    :camera-options="{ fov: 45, near: 1, far: 20 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgpu - morph face targets<br/>\n\t\t\tmodel by <a href=\"https://www.bannaflak.com/face-cap\" target=\"_blank\" rel=\"noopener\">Face Cap</a>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			
  
  
  				let mixer: any;
  
  				const timer = new THREE.Timer();
  				timer.connect( document );
  
  
  
  
  
  
  
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.inspector = new Inspector();
  
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.background = new THREE.Color( 0x666666 );
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  
  				const ktx2Loader = await new KTX2Loader()
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
  						const influences = (head! as any).morphTargetInfluences;
  
  						const gui = renderer.inspector.createParameters( 'Morph Targets' );
  
  						for ( const [ key, value ] of Object.entries( (head! as any).morphTargetDictionary ) ) {
  
  							gui.add( influences, value, 0, 1, 0.01 )
  								.name( (key as any).replace( 'blendShape1.', '' ) )
  								.listen();
  
  						}
  
  					} );
  
  				scene.background = new THREE.Color( 0x666666 );
  
  
  				controls.enableDamping = true;
  				controls.minDistance = 2.5;
  				controls.maxDistance = 5;
  				controls.minAzimuthAngle = - Math.PI / 2;
  				controls.maxAzimuthAngle = Math.PI / 2;
  				controls.maxPolarAngle = Math.PI / 1.8;
  				controls.target.set( 0, 0.15, - 0.2 );
  
  				__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    					const delta = timer.getDelta();
    					if ( mixer ) {
    						mixer.update( delta );
    					}
  })
  
  				window.addEventListener( 'resize', () => {
  
  					camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  					camera.updateProjectionMatrix();
  
  
  
  				} );
  
  			
  
  		
}
</script>
