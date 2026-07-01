<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 0.1, far: 10 }"
    :enable-controls="false"
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
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - 3DS loader"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			let container;
  
  
  			
  
  
  				
  				camera.position.z = 2;
  
  				
  				scene.add( new THREE.AmbientLight( 0xffffff, 3 ) );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffeedd, 3 );
  				directionalLight.position.set( 0, 0, 2 );
  				scene.add( directionalLight );
  
  				//3ds files dont store normal maps
  				const normal = new THREE.TextureLoader().load( ASSET_HOST + 'models/3ds/portalgun/textures/normal.jpg' );
  
  				const loader = new TDSLoader( );
  				loader.setResourcePath( ASSET_HOST + 'models/3ds/portalgun/textures/' );
  				loader.load( ASSET_HOST + 'models/3ds/portalgun/portalgun.3ds', function ( object ) {
  
  					object.traverse( function ( child ) {
  
  						if ( child.isMesh ) {
  
  							child.material.specular.setScalar( 0.1 );
  							child.material.normalMap = normal;
  
  						}
  
  					} );
  
  					scene.add( object );
  
  				} );
  
  				
  
  
  				
  
  			
  
  
  			function resize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			function animate() {
  
  				controls.update();
  
  
  			}
  		
}
</script>
