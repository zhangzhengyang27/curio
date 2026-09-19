<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-10, 0, 23]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl object-space normalmap demo<br />\n\t\t\tNefertiti Bust by\n\t\t\t<a href=\"http://www.cultlab3d.de/\" target=\"_blank\" rel=\"noopener\">CultLab3D</a><br />"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				// renderer
  				
  
  
  
  
  				// scene
  				
  
  				// camera
  				
  
  				scene.add( camera );
  
  				// controls
  
  				controls.addEventListener( 'change', render );
  				controls.minDistance = 10;
  				controls.maxDistance = 50;
  				controls.enablePan = false;
  
  				// ambient
  				scene.add( new THREE.AmbientLight( 0xffffff, 0.6 ) );
  
  				// light
  				const light = new THREE.PointLight( 0xffffff, 4.5, 0, 0 );
  				camera.add( light );
  
  				// model
  				new GLTFLoader().load( ASSET_HOST + 'models/gltf/Nefertiti/Nefertiti.glb', function ( gltf ) {
  
  					gltf.scene.traverse( function ( child ) {
  
  						if ( child.isMesh ) {
  
  							// glTF currently supports only tangent-space normal maps.
  							// this model has been modified to demonstrate the use of an object-space normal map.
  
  							(child.material as any).normalMapType = THREE.ObjectSpaceNormalMap;
  
  							// attribute normals are not required with an object-space normal map. remove them.
  
  							( child as any ).geometry.deleteAttribute( 'normal' );
  
  							//
  
  							(child.material as any).side = THREE.DoubleSide;
  
  							child.scale.multiplyScalar( 0.5 );
  
  							// recenter
  
  							new THREE.Box3().setFromObject( child ).getCenter( child.position ).multiplyScalar( - 1 );
  
  							scene.add( child );
  
  						}
  
  					} );
  
  					render();
  
  				} );
  
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
