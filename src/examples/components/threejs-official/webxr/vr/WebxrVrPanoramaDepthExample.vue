<template>
  <WebXRExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 2000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebXRExampleScene>
</template>

<script setup>
import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> vr - panorama with depth<br />\n\t\t\tCreated by <a href=\"https://orfleisher.com\" target=\"_blank\" rel=\"noopener\">@juniorxsound</a>. Panorama from <a href=\"https://krpano.com/examples/?depthmap\" target=\"_blank\" rel=\"noopener\">krpano</a>."
const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let sphere, timer;
  
  			
  
  
  				const container = __stage.container;
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  				scene.background = new THREE.Color( 0x101010 );
  
  				const light = new THREE.AmbientLight( 0xffffff, 3 );
  				scene.add( light );
  
  				
  				scene.add( camera );
  
  				// Create the panoramic sphere geometry
  				const panoSphereGeo = new THREE.SphereGeometry( 6, 256, 256 );
  
  				// Create the panoramic sphere material
  				const panoSphereMat = new THREE.MeshStandardMaterial( {
  					side: THREE.BackSide,
  					displacementScale: - 4.0
  				} );
  
  				// Create the panoramic sphere mesh
  				sphere = new THREE.Mesh( panoSphereGeo, panoSphereMat );
  
  				// Load and assign the texture and depth map
  				const manager = new THREE.LoadingManager();
  				const loader = new THREE.TextureLoader( manager );
  
  				loader.load( ASSET_HOST + 'textures/kandao3.jpg', function ( texture ) {
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  					texture.minFilter = THREE.NearestFilter;
  					texture.generateMipmaps = false;
  					sphere.material.map = texture;
  
  				} );
  
  				loader.load( ASSET_HOST + 'textures/kandao3_depthmap.jpg', function ( depth ) {
  
  					depth.minFilter = THREE.NearestFilter;
  					depth.generateMipmaps = false;
  					sphere.material.displacementMap = depth;
  
  				} );
  
  				// On load complete add the panoramic sphere to the scene
  				manager.onLoad = function () {
  
  					scene.add( sphere );
  
  				};
  
  				
  
  
  				renderer.xr.setReferenceSpaceType( 'local' );
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				// If we are not presenting move the camera a little so the effect is visible
    				if ( renderer.xr.isPresenting === false ) {
    					const time = timer.getElapsed();
    					sphere.rotation.y += 0.001;
    					sphere.position.x = Math.sin( time ) * 0.2;
    					sphere.position.z = Math.cos( time ) * 0.2;
    				}
  })
  
  		
}
</script>
