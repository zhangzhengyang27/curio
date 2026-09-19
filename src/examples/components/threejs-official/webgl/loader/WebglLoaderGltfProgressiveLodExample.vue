<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-9, 2, -13]"
    :camera-options="{ fov: 40, near: 0.1, far: 40 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { useNeedleProgressive } from '@needle-tools/gltf-progressive';
let mixer: any;

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTF progressive loading: 82x faster - <a href=\"https://www.npmjs.com/package/@needle-tools/gltf-progressive\" target=\"_blank\" rel=\"noopener\">@needle-tools/gltf-progressive</a><br />\n\t\t\tMobile Home & Peachy Balloon by\n\t\t\t<a href=\"https://sketchfab.com/3d-models/mobile-home-5240b1dbc29c4ea28be7f91b3638951a\" target=\"_blank\" rel=\"noopener\">ConradJustin</a><br/>\n\t\t\tThe Forgotten Knight by \n\t\t\t<a href=\"https://sketchfab.com/3d-models/the-forgotten-knight-d14eb14d83bd4e7ba7cbe443d76a10fd\" target=\"_blank\" rel=\"noopener\">Dark Igorek</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=quarry_01\" target=\"_blank\" rel=\"noopener\">Quarry 01</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let airshipModel: any;
  
  			
  
  
  				
  
  				
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  				
  
  
  				const fog = new THREE.Fog( '#131055', 15, 50 );
  				scene.fog = fog;
  
  
  				controls.minDistance = .1;
  				controls.maxDistance = 20;
  				controls.target.set( - 1, 2.1, 0 );
  				controls.update();
  
  				new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'quarry_01_1k.hdr', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = new THREE.Color( '#192022' );
  						scene.backgroundBlurriness = .5;
  						scene.environment = texture;
  						scene.environmentRotation = new THREE.Euler( 0, Math.PI / - 2, 0, 'XYZ' );
  
  					} );
  			
  
  				mixer = new THREE.AnimationMixer( scene );
  
  				const loader = new GLTFLoader();
  
  				useNeedleProgressive( loader, renderer );
  
  				loader.load( '/threejs-official/models/gltf-needle/Z23hmXBZ2sPRdk-world.glb', function ( gltf ) {
  
  					const model = gltf.scene;
  
  					model.scale.multiplyScalar( 0.1 );
  
  					scene.add( model );
  			
  					const animations = gltf.animations;
  					if ( animations && animations.length ) {
  
  						for ( const animation of animations ) {
  
  							mixer.clipAction( animation ).play();
  
  						}
  			
  					}
  			
  				} );
  
  				loader.load( '/threejs-official/models/gltf-needle/Z23hmXBZnlceI-ZnlceI-world.glb', function ( gltf ) {
  
  					const model = gltf.scene;
  			
  					model.scale.multiplyScalar( 0.0005 );
  
  					model.position.set( 1.6, 6, 7 );
  
  					model.rotation.set( 0, Math.PI * 1.4, 0 );
  			
  					scene.add( model );
  
  					airshipModel = model;
  			
  					const animations = gltf.animations;
  			
  					if ( animations && animations.length ) {
  
  						for ( const animation of animations ) {
  
  							mixer.clipAction( animation ).play();
  
  						}
  			
  					}
  
  				} );
  
  				loader.load( '/threejs-official/models/gltf-needle/Z23hmXBZ21QnG-Z21QnG-product.glb', function ( gltf ) {
  
  					const model = gltf.scene;
  			
  					model.scale.multiplyScalar( 0.5 );
  
  					model.position.set( 2, 5.15, 2.3 );
  
  					model.rotation.set( 0, Math.PI * 1, 0 );
  			
  					scene.add( model );
  			
  					const animations = gltf.animations;
  					if ( animations && animations.length ) {
  
  						for ( const animation of animations ) {
  
  							mixer.clipAction( animation ).play();
  
  						}
  			
  					}
  
  				} );
  
  
  
  
  				
  
  			
  
  
  			
  
  			//
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  			let time = 0;
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const dt = timer.getDelta();
    				time += dt;
    				mixer.update( dt );
    				if ( airshipModel ) {
    					airshipModel.position.y += Math.sin( time ) * 0.002;
    				}
  })
  
}
</script>
