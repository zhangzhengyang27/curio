<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 60, near: 100, far: 10000 }"
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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Instancing Morph</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mesh, mixer, dummy;
  
  			const offset = 5000;
  
  			const timeOffsets = new Float32Array( 1024 );
  
  			for ( let i = 0; i < 1024; i ++ ) {
  
  				timeOffsets[ i ] = Math.random() * 3;
  
  			}
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  
  			
  
  
  				
  
  				
  
  				scene.background = new THREE.Color( 0x99DDFF );
  
  				scene.fog = new THREE.Fog( 0x99DDFF, 5000, 10000 );
  
  				//
  
  				const light = new THREE.DirectionalLight( 0xffffff, 1 );
  
  				light.position.set( 200, 1000, 50 );
  
  				light.shadow.mapSize.width = 2048;
  				light.shadow.mapSize.height = 2048;
  				light.castShadow = true;
  
  				light.shadow.camera.left = - 5000;
  				light.shadow.camera.right = 5000;
  				light.shadow.camera.top = 5000;
  				light.shadow.camera.bottom = - 5000;
  				light.shadow.camera.far = 2000;
  
  				light.shadow.camera.updateProjectionMatrix();
  
  				scene.add( light );
  
  				const hemi = new THREE.HemisphereLight( 0x99DDFF, 0x669933, 1 / 3 );
  
  				scene.add( hemi );
  
  				const ground = new THREE.Mesh(
  					new THREE.PlaneGeometry( 1000000, 1000000 ),
  					new THREE.MeshStandardMaterial( { color: 0x669933 } )
  				);
  
  				ground.rotation.x = - Math.PI / 2;
  
  				ground.receiveShadow = true;
  
  				scene.add( ground );
  
  				const loader = new GLTFLoader();
  
  				loader.load( ASSET_HOST + 'models/gltf/Horse.glb', function ( glb ) {
  
  					dummy = glb.scene.children[ 0 ];
  
  					mesh = new THREE.InstancedMesh( dummy.geometry, new THREE.MeshStandardNodeMaterial( {
  						flatShading: true,
  					} ), 1024 );
  
  					mesh.castShadow = true;
  
  					for ( let x = 0, i = 0; x < 32; x ++ ) {
  
  						for ( let y = 0; y < 32; y ++ ) {
  
  							dummy.position.set( offset - 300 * x + 200 * Math.random(), 0, offset - 300 * y );
  
  							dummy.updateMatrix();
  
  							mesh.setMatrixAt( i, dummy.matrix );
  
  							mesh.setColorAt( i, new THREE.Color( `hsl(${Math.random() * 360}, 50%, 66%)` ) );
  
  							i ++;
  			
  						}
  
  			
  					}
  
  					scene.add( mesh );
  
  					mixer = new THREE.AnimationMixer( glb.scene );
  
  					const action = mixer.clipAction( glb.animations[ 0 ] );
  
  					action.play();
  			
  				} );
  
  
  				// renderer
  
  				
  				renderer.shadowMap.enabled = true;
  				renderer.inspector = new Inspector();
  
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const time = timer.getElapsed();
    				const r = 3000;
    				if ( mesh ) {
    					for ( let i = 0; i < 1024; i ++ ) {
    						mixer.setTime( time + timeOffsets[ i ] );
    						mesh.setMorphAt( i, dummy );
    					}
    					mesh.morphTexture.needsUpdate = true;
    				}
  })
  
  		
}
</script>
