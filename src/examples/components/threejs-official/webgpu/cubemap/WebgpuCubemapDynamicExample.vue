<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Dynamic Cube Reflections</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let cube: any, sphere, torus: any, material: any;
  
  			let cubeCamera: any, cubeRenderTarget;
  
  
  			
  
  
  				
  				camera.position.z = 75;
  
  				
  
  				const uvTexture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  
  				const hdrUrls = [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr' ];
  				const texture = await new HDRCubeTextureLoader()
  					.setPath( ASSET_HOST + 'textures/cube/pisaHDR/' )
  					.loadAsync( hdrUrls );
  
  				texture.name = 'pisaHDR';
  				texture.minFilter = THREE.LinearMipmapLinearFilter;
  				texture.magFilter = THREE.LinearFilter;
  
  				scene.background = texture;
  				scene.environment = texture;
  
  				//
  
  				cubeRenderTarget = new THREE.CubeRenderTarget( 256 );
  				cubeRenderTarget.texture.type = THREE.HalfFloatType;
  				cubeRenderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  				cubeRenderTarget.texture.magFilter = THREE.LinearFilter;
  				cubeRenderTarget.texture.generateMipmaps = true;
  
  				cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
  
  				//
  
  				material = new THREE.MeshStandardNodeMaterial( {
  					envMap: cubeRenderTarget.texture,
  					roughness: 0.05,
  					metalness: 1
  				} );
  
  				sphere = new THREE.Mesh( new THREE.IcosahedronGeometry( 15, 8 ), material );
  				scene.add( sphere );
  
  				const material1 = new THREE.MeshStandardNodeMaterial( {
  					map: uvTexture,
  					roughness: 0.1,
  					metalness: 0,
  				} );
  
  				const material2 = new THREE.MeshStandardNodeMaterial( {
  					map: uvTexture,
  					roughness: 0.1,
  					metalness: 0,
  					envMap: texture,
  				} );
  
  				cube = new THREE.Mesh( new THREE.BoxGeometry( 15, 15, 15 ), material1 );
  				scene.add( cube );
  
  				torus = new THREE.Mesh( new THREE.TorusKnotGeometry( 8, 3, 128, 16 ), material2 );
  				scene.add( torus );
  
  				//
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.inspector = new Inspector();
  
  
  				
  
  				
  				controls.autoRotate = true;
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( material, 'roughness', 0, 1 );
  				gui.add( material, 'metalness', 0, 1 );
  				gui.add( renderer, 'toneMappingExposure', 0, 2 ).name( 'exposure' );
  				gui.add( scene, 'environmentIntensity', 0, 1 );
  				gui.add( material2, 'envMapIntensity', 0, 1 );
  
  			
  
  
  			function onWindowResized() {
  
  
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  			}
  
  			function animation( msTime: any ) {
  
  				const time = msTime / 1000;
  
  				cube.position.x = Math.cos( time ) * 30;
  				cube.position.y = Math.sin( time ) * 30;
  				cube.position.z = Math.sin( time ) * 30;
  
  				cube.rotation.x += 0.02;
  				cube.rotation.y += 0.03;
  
  				torus.position.x = Math.cos( time + 10 ) * 30;
  				torus.position.y = Math.sin( time + 10 ) * 30;
  				torus.position.z = Math.sin( time + 10 ) * 30;
  
  				torus.rotation.x += 0.02;
  				torus.rotation.y += 0.03;
  
  				material.visible = false;
  
  				cubeCamera.update( renderer, scene );
  
  				material.visible = true;
  
  				controls.update();
  
  
  
  			}
  
  		
  __stage.setCamera(camera)
}
</script>
