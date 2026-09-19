<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 3500 }"
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
import { cubeTexture, positionWorld, oscSine, time, pass, uniform } from 'three/tsl';
import { dof } from 'three/examples/jsm/tsl/display/DepthOfFieldNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>DoF</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			//
  
  			let mesh;
  
  			let width = (__stage.container?.clientWidth || window.innerWidth);
  			let height = (__stage.container?.clientHeight || window.innerHeight);
  
  			let renderPipeline;
  
  			
  
  
  				
  				camera.position.z = 200;
  
  				
  
  				const path = ASSET_HOST + 'textures/cube/SwedishRoyalCastle/';
  				const format = '.jpg';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const xgrid = 14, ygrid = 9, zgrid = 14;
  				const count = xgrid * ygrid * zgrid;
  
  				const textureCube = new THREE.CubeTextureLoader().load( urls );
  				const cubeTextureNode = cubeTexture( textureCube );
  				const oscPos = oscSine( positionWorld.div( 1000 /* scene distance */ ).add( time.mul( .2 ) ) );
  
  				const geometry = new THREE.SphereGeometry( 60, 20, 10 );
  				const material = new THREE.MeshBasicNodeMaterial();
  				material.colorNode = cubeTextureNode.mul( oscPos );
  
  				mesh = new THREE.InstancedMesh( geometry, material, count );
  				scene.add( mesh );
  
  				const matrix = new THREE.Matrix4();
  
  				let index = 0;
  
  				for ( let i = 0; i < xgrid; i ++ ) {
  
  					for ( let j = 0; j < ygrid; j ++ ) {
  
  						for ( let k = 0; k < zgrid; k ++ ) {
  
  							const x = 200 * ( i - xgrid / 2 );
  							const y = 200 * ( j - ygrid / 2 );
  							const z = 200 * ( k - zgrid / 2 );
  
  							mesh.setMatrixAt( index, matrix.identity().setPosition( x, y, z ) );
  							index ++;
  
  						}
  
  					}
  
  				}
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				const effectController = {
  					focusDistance: uniform( 500 ),
  					focalLength: uniform( 200 ),
  					bokehScale: uniform( 10 )
  				};
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera );
  
  				const scenePassColor = scenePass.getTextureNode().toInspector( 'Color' );
  				const scenePassViewZ = scenePass.getViewZNode();
  
  				const dofPass = dof( scenePassColor, scenePassViewZ, effectController.focusDistance, effectController.focalLength, effectController.bokehScale );
  
  				renderPipeline.outputNode = dofPass;
  
  				// controls
  
  				
  				controls.enableDamping = true;
  
  				
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( effectController.focusDistance, 'value', 10.0, 3000.0 ).name( 'focus distance' );
  				gui.add( effectController.focalLength, 'value', 50, 750 ).name( 'focal length' );
  				gui.add( effectController.bokehScale, 'value', 1, 20 ).name( 'bokeh scale' );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderPipeline.render();
  })
  
  		
}
</script>
