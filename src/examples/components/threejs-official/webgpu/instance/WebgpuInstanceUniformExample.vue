<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 200, 1200]"
    :camera-options="{ fov: 45, near: 1, far: 4000 }"
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
import { uniform, cubeTexture } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Instanced Uniform</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  			class InstanceUniformNode extends THREE.Node {
	updateType: any;
	uniformNode: any;

  
  				constructor() {
  
  					super( 'vec3' );
  
  					this.updateType = THREE.NodeUpdateType.OBJECT;
  
  					this.uniformNode = uniform( new THREE.Color() );
  
  				}
  
  				update( frame: any ): any {
  
  					const mesh = frame.object;
  
  					const meshColor = mesh.color;
  
  					this.uniformNode.value.copy( meshColor );
  
  				}
  
  				setup( /*builder*/ ) {
  
  					return this.uniformNode;
  
  				}
  
  			}
  
  
  
  			const objects: any = [];
  
  			
  
  
  				
  
  				
  
  
  				
  
  				// Grid
  
  				const helper = new THREE.GridHelper( 1000, 40, 0x303030, 0x303030 );
  				helper.position.y = - 75;
  				scene.add( helper );
  
  				// CubeMap
  
  				const path = ASSET_HOST + 'textures/cube/SwedishRoyalCastle/';
  				const format = '.jpg';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const cTexture = new THREE.CubeTextureLoader().load( urls );
  
  				// Materials
  
  				const instanceUniform = new InstanceUniformNode();
  				const cubeTextureNode = cubeTexture( cTexture );
  
  				const material = new THREE.MeshBasicNodeMaterial();
  				material.colorNode = (instanceUniform as any).add( cubeTextureNode );
  				(material as any).emissiveNode = (instanceUniform as any).mul( cubeTextureNode );
  
  				// Geometry
  
  				const geometry = new TeapotGeometry( 50, 18 );
  
  				for ( let i = 0, l = 12; i < l; i ++ ) {
  
  					addMesh( geometry, material );
  
  				}
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  				controls.minDistance = 400;
  				controls.maxDistance = 2000;
  
  				//
  
  				
  
  			
  
  
  			function addMesh( geometry: any, material: any ) {
  
  				const mesh = new THREE.Mesh( geometry, material );
  
  				(mesh as any).color = new THREE.Color( Math.random() * 0xffffff );
  
  				mesh.position.x = ( objects.length % 4 ) * 200 - 300;
  				mesh.position.z = Math.floor( objects.length / 4 ) * 200 - 200;
  
  				mesh.rotation.x = Math.random() * 200 - 100;
  				mesh.rotation.y = Math.random() * 200 - 100;
  				mesh.rotation.z = Math.random() * 200 - 100;
  
  				objects.push( mesh );
  
  				scene.add( mesh );
  
  			}
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    for ( let i = 0, l = objects.length; i < l; i ++ ) {
    					const object = objects[ i ];
    					object.rotation.x += 0.01;
    					object.rotation.y += 0.005;
    				}
  })
  
  		
}
</script>
