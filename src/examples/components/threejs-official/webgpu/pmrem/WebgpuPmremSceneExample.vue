<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1.8, 0.6, 2.7]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
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
import { normalWorld, uniform, pmremTexture } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>PMREM Scene</span>"
async function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  				
  
  
  				
  
  				const forceWebGL = false;
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.update();
  
  				//
  				const loader = new THREE.CubeTextureLoader().setPath( ASSET_HOST + 'textures/cube/Park3Med/' );
  
  				scene.background = await loader.loadAsync( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
  
  				let model;
  
  				model = new THREE.Mesh( new THREE.SphereGeometry( .2, 64, 64 ), new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
  				model.position.z -= 1;
  				scene.add( model );
  
  				model = new THREE.Mesh( new THREE.SphereGeometry( .2, 64, 64 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
  				model.position.z += 1;
  				scene.add( model );
  
  				model = new THREE.Mesh( new THREE.SphereGeometry( .2, 64, 64 ), new THREE.MeshBasicMaterial( { color: 0xff00ff } ) );
  				model.position.x += 1;
  				scene.add( model );
  
  				model = new THREE.Mesh( new THREE.SphereGeometry( .2, 64, 64 ), new THREE.MeshBasicMaterial( { color: 0x00ffff } ) );
  				model.position.x -= 1;
  				scene.add( model );
  
  				model = new THREE.Mesh( new THREE.SphereGeometry( .2, 64, 64 ), new THREE.MeshBasicMaterial( { color: 0xffff00 } ) );
  				model.position.y -= 1;
  				scene.add( model );
  
  				model = new THREE.Mesh( new THREE.SphereGeometry( .2, 64, 64 ), new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) );
  				model.position.y += 1;
  				scene.add( model );
  
  				//while ( scene.children.length > 0 ) scene.remove( scene.children[ 0 ] );
  
  				const sceneRT = new THREE.PMREMGenerator( renderer ).fromScene( scene );
  
  
  				//
  
  				const pmremRoughness = uniform( .5 );
  				const pmremNode = pmremTexture( sceneRT.texture, normalWorld, pmremRoughness );
  
  				scene.add( new THREE.Mesh( new THREE.SphereGeometry( .5, 64, 64 ), new THREE.MeshBasicNodeMaterial( { colorNode: pmremNode } ) ) );
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( pmremRoughness, 'value', 0, 1, 0.001 ).name( 'roughness' ).onChange( () => render() );
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
