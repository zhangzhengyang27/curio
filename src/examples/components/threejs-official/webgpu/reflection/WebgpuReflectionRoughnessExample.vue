<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-4, 1, 4]"
    :camera-options="{ fov: 50, near: 0.25, far: 30 }"
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
import { Fn, vec2, vec4, texture, uv, textureBicubic, rangeFogFactor, reflector, time } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Roughness Reflection</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			
  
  
  				
  
  
  				
  
  				const loader = new UltraHDRLoader();
  				loader.load( ASSET_HOST + 'textures/equirectangular/spruit_sunrise_2k.hdr.jpg', function ( texture ) {
  
  					texture.mapping = THREE.EquirectangularReflectionMapping;
  					texture.needsUpdate = true;
  
  					scene.background = texture;
  					scene.environment = texture;
  
  				} );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const uvMap = textureLoader.load( ASSET_HOST + 'textures/uv_grid_directx.jpg' );
  				uvMap.colorSpace = THREE.SRGBColorSpace;
  
  				const perlinMap = textureLoader.load( ASSET_HOST + 'textures/noises/perlin/rgb-256x256.png' );
  				perlinMap.wrapS = THREE.RepeatWrapping;
  				perlinMap.wrapT = THREE.RepeatWrapping;
  				perlinMap.colorSpace = THREE.SRGBColorSpace;
  
  				// uv box for debugging
  			
  				const mesh = new THREE.Mesh(
  					new THREE.BoxGeometry( 1, 1, 1 ),
  					new THREE.MeshStandardNodeMaterial( {
  						map: uvMap,
  						roughnessMap: uvMap,
  						emissiveMap: uvMap,
  						emissive: 0xffffff
  					} )
  				);
  				mesh.position.set( 0, 1.25, 0 );
  				mesh.scale.setScalar( 2 );
  				scene.add( mesh );
  
  				// reflection
  
  				const reflection = reflector( { resolutionScale: .5, bounces: false, generateMipmaps: true } ); // 0.5 is half of the rendering view
  				reflection.target.rotateX( - Math.PI / 2 );
  				scene.add( reflection.target );
  
  				const animatedUV = uv().mul( 10 ).add( vec2( time.mul( .1 ), 0 ) );
  				const roughness = texture( perlinMap, animatedUV ).r.mul( 2 ).saturate();
  
  				const floorMaterial = new THREE.MeshStandardNodeMaterial();
  				floorMaterial.transparent = true;
  				floorMaterial.metalness = 1;
  				floorMaterial.roughnessNode = roughness.mul( .2 );
  				floorMaterial.colorNode = Fn( () => {
  
  					// blur reflection using textureBicubic()
  					const dirtyReflection = textureBicubic( reflection, roughness.mul( .9 ) );
  
  					// falloff opacity by distance like an opacity-fog
  					const opacity = rangeFogFactor( 7, 25 ).oneMinus();
  
  					return vec4( dirtyReflection.rgb, opacity );
  
  				} )();
  
  				const floor = new THREE.Mesh( new THREE.BoxGeometry( 50, .001, 50 ), floorMaterial );
  				floor.position.set( 0, 0, 0 );
  				scene.add( floor );
  
  				// renderer
  
  				
  
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  				renderer.toneMappingExposure = 1.5;
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.maxPolarAngle = Math.PI / 2;
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = - .1;
  				controls.target.set( 0, .75, 0 );
  				controls.update();
  
  				// events
  
  				
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
