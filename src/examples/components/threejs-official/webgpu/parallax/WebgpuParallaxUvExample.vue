<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[15, 7, 15]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture, parallaxUV, blendOverlay, uv, normalMap, uniform } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Parallax UV</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  			
  			async 
  
  
  				// scene
  
  				
  
  				// camera
  
  				
  
  
  				// environment
  
  				const environmentTexture = await new HDRLoader()
  					.loadAsync( './textures/equirectangular/752-hdri-skies-com_1k.hdr' );
  
  				environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
  
  
  				scene.environment = environmentTexture;
  				scene.background = environmentTexture;
  				scene.backgroundBlurriness = 0.4;
  
  				// textures
  
  				const loader = new THREE.TextureLoader();
  
  				const topTexture = await loader.loadAsync( ASSET_HOST + 'textures/ambientcg/Ice002_1K-JPG_Color.jpg' );
  				topTexture.colorSpace = THREE.SRGBColorSpace;
  				topTexture.wrapS = THREE.RepeatWrapping;
  				topTexture.wrapT = THREE.RepeatWrapping;
  
  				const roughnessTexture = await loader.loadAsync( ASSET_HOST + 'textures/ambientcg/Ice002_1K-JPG_Roughness.jpg' );
  				roughnessTexture.colorSpace = THREE.NoColorSpace;
  				roughnessTexture.wrapS = THREE.RepeatWrapping;
  				roughnessTexture.wrapT = THREE.RepeatWrapping;
  
  				const normalTexture = await loader.loadAsync( ASSET_HOST + 'textures/ambientcg/Ice002_1K-JPG_NormalGL.jpg' );
  				normalTexture.colorSpace = THREE.NoColorSpace;
  				normalTexture.wrapS = THREE.RepeatWrapping;
  				normalTexture.wrapT = THREE.RepeatWrapping;
  
  				const displaceTexture = await loader.loadAsync( ASSET_HOST + 'textures/ambientcg/Ice002_1K-JPG_Displacement.jpg' );
  				displaceTexture.colorSpace = THREE.NoColorSpace;
  				displaceTexture.wrapS = THREE.RepeatWrapping;
  				displaceTexture.wrapT = THREE.RepeatWrapping;
  
  				//
  
  				const bottomTexture = await loader.loadAsync( ASSET_HOST + 'textures/ambientcg/Ice003_1K-JPG_Color.jpg' );
  				bottomTexture.colorSpace = THREE.SRGBColorSpace;
  				bottomTexture.wrapS = THREE.RepeatWrapping;
  				bottomTexture.wrapT = THREE.RepeatWrapping;
  
  				// parallax effect
  
  				const scaleUV = uniform( 3 );
  				const scaledUV = uv().mul( scaleUV );
  
  				const parallaxScale = uniform( 0.5 ); // parallax scale
  				const offsetUV = texture( displaceTexture, scaledUV ).mul( parallaxScale );
  
  				const parallaxUVOffset = parallaxUV( scaledUV, offsetUV );
  				const parallaxResult = texture( bottomTexture, parallaxUVOffset );
  
  				const iceNode = blendOverlay( texture( topTexture, scaledUV ), parallaxResult );
  
  				// material
  
  				const material = new THREE.MeshStandardNodeMaterial();
  				material.colorNode = iceNode.mul( 5 ); // increase the color intensity to 5 ( contrast )
  				material.roughnessNode = texture( roughnessTexture, scaledUV );
  				material.normalNode = normalMap( texture( normalTexture, scaledUV ) );
  				material.metalness = 0;
  
  				const geometry = new THREE.CircleGeometry( 25, 64 );
  
  				const ground = new THREE.Mesh( geometry, material );
  				ground.rotateX( - Math.PI / 2 );
  				scene.add( ground );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.ReinhardToneMapping;
  				renderer.toneMappingExposure = 6;
  				renderer.inspector = new Inspector();
  
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Scene' );
  				gui.add( scene, 'backgroundBlurriness', 0, 1 ).name( 'Background Blurriness' );
  				gui.add( parallaxScale, 'value', .2, .5 ).name( 'Parallax Scale' );
  				gui.add( scaleUV, 'value', 1, 5 ).name( 'UV Scale' );
  
  				// controls
  
  				
  				controls.target.set( 0, 0, 0 );
  				controls.maxDistance = 40;
  				controls.minDistance = 10;
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = - 1;
  				controls.update();
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
