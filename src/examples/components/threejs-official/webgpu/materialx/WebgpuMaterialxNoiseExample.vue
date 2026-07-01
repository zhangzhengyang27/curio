<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 1, far: 1000 }"
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
import { normalWorld, time, mx_noise_vec3, mx_worley_noise_vec3, mx_cell_noise_float, mx_fractal_noise_vec3 } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>MaterialX Noise</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container;
  
  
  			let particleLight;
  
  
  			
  
  
  				
  				camera.position.z = 100;
  
  				
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				new HDRCubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/pisaHDR/' )
  					.load( [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr' ],
  						function ( hdrTexture ) {
  
  							const geometry = new THREE.SphereGeometry( 8, 64, 32 );
  
  							const customUV = normalWorld.mul( 10 ).add( time );
  
  							// left top
  
  							let material = new THREE.MeshPhysicalNodeMaterial();
  							material.colorNode = mx_noise_vec3( customUV );
  
  							let mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = - 10;
  							mesh.position.y = 10;
  							group.add( mesh );
  
  							// right top
  
  							material = new THREE.MeshPhysicalNodeMaterial();
  							material.colorNode = mx_cell_noise_float( customUV );
  
  							mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = 10;
  							mesh.position.y = 10;
  							group.add( mesh );
  
  							// left bottom
  
  							material = new THREE.MeshPhysicalNodeMaterial();
  							material.colorNode = mx_worley_noise_vec3( customUV );
  
  							mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = - 10;
  							mesh.position.y = - 10;
  							group.add( mesh );
  
  							// right bottom
  
  							material = new THREE.MeshPhysicalNodeMaterial();
  							material.colorNode = mx_fractal_noise_vec3( customUV.mul( .2 ) );
  
  							mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = 10;
  							mesh.position.y = - 10;
  							group.add( mesh );
  
  							//
  
  							scene.background = hdrTexture;
  							scene.environment = hdrTexture;
  
  						}
  
  					);
  
  				// LIGHTS
  
  				particleLight = new THREE.Mesh(
  					new THREE.SphereGeometry( 0.4, 8, 8 ),
  					new THREE.MeshBasicMaterial( { color: 0xffffff } )
  				);
  				scene.add( particleLight );
  
  				particleLight.add( new THREE.PointLight( 0xffffff, 1000 ) );
  
  				
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1.25;
  
  				// EVENTS
  
  				new OrbitControls( camera, renderer.domElement );
  
  				
  
  			
  
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const timer = Date.now() * 0.00025;
    				particleLight.position.x = Math.sin( timer * 7 ) * 30;
    				particleLight.position.y = Math.cos( timer * 5 ) * 40;
    				particleLight.position.z = Math.cos( timer * 3 ) * 30;
    				for ( let i = 0; i < group.children.length; i ++ ) {
    					const child = group.children[ i ];
    					child.rotation.y += 0.005;
    				}
  })
  
  		
}
</script>
