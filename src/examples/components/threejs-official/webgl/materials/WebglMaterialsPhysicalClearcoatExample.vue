<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 0.25, far: 50 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js';

let group: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - materials - clearcoat"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let container, stats;
  
  
  			let particleLight: any;
  
  
  			
  
  
  				
  				camera.position.z = 10;
  
  				
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				new HDRCubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/pisaHDR/' )
  					.load( [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr' ],
  						function ( texture ) {
  
  							const geometry = new THREE.SphereGeometry( .8, 64, 32 );
  
  							const textureLoader = new THREE.TextureLoader();
  
  							const diffuse = textureLoader.load( ASSET_HOST + 'textures/carbon/Carbon.png' );
  							diffuse.colorSpace = THREE.SRGBColorSpace;
  							diffuse.wrapS = THREE.RepeatWrapping;
  							diffuse.wrapT = THREE.RepeatWrapping;
  							diffuse.repeat.x = 10;
  							diffuse.repeat.y = 10;
  
  							const normalMap = textureLoader.load( ASSET_HOST + 'textures/carbon/Carbon_Normal.png' );
  							normalMap.wrapS = THREE.RepeatWrapping;
  							normalMap.wrapT = THREE.RepeatWrapping;
  							normalMap.repeat.x = 10;
  							normalMap.repeat.y = 10;
  
  							const normalMap2 = textureLoader.load( ASSET_HOST + 'textures/water/Water_1_M_Normal.jpg' );
  
  							const normalMap3 = new THREE.CanvasTexture( new FlakesTexture() );
  							normalMap3.wrapS = THREE.RepeatWrapping;
  							normalMap3.wrapT = THREE.RepeatWrapping;
  							normalMap3.repeat.x = 10;
  							normalMap3.repeat.y = 6;
  							normalMap3.anisotropy = 16;
  
  							const normalMap4 = textureLoader.load( ASSET_HOST + 'textures/golfball.jpg' );
  
  							const clearcoatNormalMap = textureLoader.load( ASSET_HOST + 'textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png' );
  
  							// car paint
  
  							let material = new THREE.MeshPhysicalMaterial( {
  								clearcoat: 1.0,
  								clearcoatRoughness: 0.1,
  								metalness: 0.9,
  								roughness: 0.5,
  								color: 0x0000ff,
  								normalMap: normalMap3,
  								normalScale: new THREE.Vector2( 0.15, 0.15 )
  							} );
  
  							let mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = - 1;
  							mesh.position.y = 1;
  							group.add( mesh );
  
  							// fibers
  
  							material = new THREE.MeshPhysicalMaterial( {
  								roughness: 0.5,
  								clearcoat: 1.0,
  								clearcoatRoughness: 0.1,
  								map: diffuse,
  								normalMap: normalMap
  							} );
  							mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = 1;
  							mesh.position.y = 1;
  							group.add( mesh );
  
  							// golf
  
  							material = new THREE.MeshPhysicalMaterial( {
  								metalness: 0.0,
  								roughness: 0.1,
  								clearcoat: 1.0,
  								normalMap: normalMap4,
  								clearcoatNormalMap: clearcoatNormalMap,
  
  								// y scale is negated to compensate for normal map handedness.
  								clearcoatNormalScale: new THREE.Vector2( 2.0, - 2.0 )
  							} );
  							mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = - 1;
  							mesh.position.y = - 1;
  							group.add( mesh );
  
  							// clearcoat + normalmap
  
  							material = new THREE.MeshPhysicalMaterial( {
  								clearcoat: 1.0,
  								metalness: 1.0,
  								color: 0xff0000,
  								normalMap: normalMap2,
  								normalScale: new THREE.Vector2( 0.15, 0.15 ),
  								clearcoatNormalMap: clearcoatNormalMap,
  
  								// y scale is negated to compensate for normal map handedness.
  								clearcoatNormalScale: new THREE.Vector2( 2.0, - 2.0 )
  							} );
  							mesh = new THREE.Mesh( geometry, material );
  							mesh.position.x = 1;
  							mesh.position.y = - 1;
  							group.add( mesh );
  
  							//
  
  							scene.background = texture;
  							scene.environment = texture;
  
  						}
  
  					);
  
  				// LIGHTS
  
  				particleLight = new THREE.Mesh(
  					new THREE.SphereGeometry( .05, 8, 8 ),
  					new THREE.MeshBasicMaterial( { color: 0xffffff } )
  				);
  				scene.add( particleLight );
  
  				particleLight.add( new THREE.PointLight( 0xffffff, 30 ) );
  
  				
  
  
  				//
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1.25;
  
  				//
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// EVENTS
  
  
  				controls.minDistance = 3;
  				controls.maxDistance = 30;
  
  				
  
  			
  
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    const timer = Date.now() * 0.00025;
    				particleLight.position.x = Math.sin( timer * 7 ) * 3;
    				particleLight.position.y = Math.cos( timer * 5 ) * 4;
    				particleLight.position.z = Math.cos( timer * 3 ) * 3;
    				for ( let i = 0; i < group.children.length; i ++ ) {
    					const child = group.children[ i ];
    					child.rotation.y += 0.005;
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				const timer = Date.now() * 0.00025;
  
  				particleLight.position.x = Math.sin( timer * 7 ) * 3;
  				particleLight.position.y = Math.cos( timer * 5 ) * 4;
  				particleLight.position.z = Math.cos( timer * 3 ) * 3;
  
  				for ( let i = 0; i < group.children.length; i ++ ) {
  
  					const child = group.children[ i ];
  					child.rotation.y += 0.005;
  
  				}
  
  
  
  			}
  
  		
}
</script>
