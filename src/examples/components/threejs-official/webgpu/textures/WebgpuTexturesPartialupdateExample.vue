<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 0.01, far: 10 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Partial Texture Update</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let timer, dataTexture, diffuseMap;
  
  			let last = 0;
  			const position = new THREE.Vector2();
  			const color = new THREE.Color();
  
  			
  
  
  				
  				camera.position.z = 2;
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const loader = new THREE.TextureLoader();
  				diffuseMap = loader.load( ASSET_HOST + 'textures/carbon/Carbon.png' );
  				diffuseMap.colorSpace = THREE.SRGBColorSpace;
  				diffuseMap.minFilter = THREE.LinearFilter;
  				diffuseMap.generateMipmaps = false;
  
  				const geometry = new THREE.PlaneGeometry( 2, 2 );
  				const material = new THREE.MeshBasicMaterial( { map: diffuseMap } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				//
  
  				const width = 32;
  				const height = 32;
  
  				const data = new Uint8Array( width * height * 4 );
  				dataTexture = new THREE.DataTexture( data, width, height );
  				dataTexture.colorSpace = THREE.SRGBColorSpace;
  
  				//
  
  				
  
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const elapsedTime = timer.getElapsed();
    				if ( elapsedTime - last > 0.1 ) {
    					last = elapsedTime;
    					position.x = ( 32 * THREE.MathUtils.randInt( 1, 16 ) ) - 32;
    					position.y = ( 32 * THREE.MathUtils.randInt( 1, 16 ) ) - 32;
    					// generate new color data
    					updateDataTexture( dataTexture );
    					// perform copy from src to dest texture to a random position
    					renderer.copyTextureToTexture( dataTexture, diffuseMap, null, position );
    				}
  })
  
  			function updateDataTexture( texture ) {
  
  				const size = texture.image.width * texture.image.height;
  				const data = texture.image.data;
  
  				// generate a random color and update texture data
  
  				color.setHex( Math.random() * 0xffffff );
  
  				const r = Math.floor( color.r * 255 );
  				const g = Math.floor( color.g * 255 );
  				const b = Math.floor( color.b * 255 );
  
  				for ( let i = 0; i < size; i ++ ) {
  
  					const stride = i * 4;
  
  					data[ stride ] = r;
  					data[ stride + 1 ] = g;
  					data[ stride + 2 ] = b;
  					data[ stride + 3 ] = 1;
  
  				}
  
  				texture.needsUpdate = true;
  
  			}
  
  		
}
</script>
