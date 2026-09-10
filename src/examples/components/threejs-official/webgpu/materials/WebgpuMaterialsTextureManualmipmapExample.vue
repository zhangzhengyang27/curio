<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 35, near: 1, far: 5000 }"
    custom-render
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Texture Manual Mipmapping</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			const SCREEN_WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			const SCREEN_HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  
  
  			let scene1, scene2;
  
  			let mouseX = 0, mouseY = 0;
  
  			const windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			const windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			
  
  
  				
  				camera.position.z = 1500;
  
  				scene1 = new THREE.Scene();
  				scene1.background = new THREE.Color( 0x000000 );
  				scene1.fog = new THREE.Fog( 0x000000, 1500, 4000 );
  
  				scene2 = new THREE.Scene();
  				scene2.background = new THREE.Color( 0x000000 );
  				scene2.fog = new THREE.Fog( 0x000000, 1500, 4000 );
  
  				// GROUND
  
  				const canvas = mipmap( 128, '#f00' );
  				const textureCanvas1 = new THREE.CanvasTexture( canvas );
  				textureCanvas1.mipmaps[ 0 ] = canvas;
  				textureCanvas1.mipmaps[ 1 ] = mipmap( 64, '#0f0' );
  				textureCanvas1.mipmaps[ 2 ] = mipmap( 32, '#00f' );
  				textureCanvas1.mipmaps[ 3 ] = mipmap( 16, '#400' );
  				textureCanvas1.mipmaps[ 4 ] = mipmap( 8, '#040' );
  				textureCanvas1.mipmaps[ 5 ] = mipmap( 4, '#004' );
  				textureCanvas1.mipmaps[ 6 ] = mipmap( 2, '#044' );
  				textureCanvas1.mipmaps[ 7 ] = mipmap( 1, '#404' );
  				textureCanvas1.colorSpace = THREE.SRGBColorSpace;
  				textureCanvas1.repeat.set( 1000, 1000 );
  				textureCanvas1.wrapS = THREE.RepeatWrapping;
  				textureCanvas1.wrapT = THREE.RepeatWrapping;
  
  				const textureCanvas2 = textureCanvas1.clone();
  				textureCanvas2.magFilter = THREE.NearestFilter;
  				textureCanvas2.minFilter = THREE.NearestMipmapNearestFilter;
  
  				const materialCanvas1 = new THREE.MeshBasicMaterial( { map: textureCanvas1 } );
  				const materialCanvas2 = new THREE.MeshBasicMaterial( { color: 0xffccaa, map: textureCanvas2 } );
  
  				const geometry = new THREE.PlaneGeometry( 100, 100 );
  
  				const meshCanvas1 = new THREE.Mesh( geometry, materialCanvas1 );
  				meshCanvas1.rotation.x = - Math.PI / 2;
  				meshCanvas1.scale.set( 1000, 1000, 1000 );
  
  				const meshCanvas2 = new THREE.Mesh( geometry, materialCanvas2 );
  				meshCanvas2.rotation.x = - Math.PI / 2;
  				meshCanvas2.scale.set( 1000, 1000, 1000 );
  
  				scene1.add( meshCanvas1 );
  				scene2.add( meshCanvas2 );
  
  				// PAINTING
  
  				const texturePainting1 = await new THREE.TextureLoader().loadAsync( ASSET_HOST + 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg' );
  				const texturePainting2 = texturePainting1.clone();
  
  				texturePainting1.colorSpace = THREE.SRGBColorSpace;
  				texturePainting2.colorSpace = THREE.SRGBColorSpace;
  
  				texturePainting1.minFilter = texturePainting1.magFilter = THREE.LinearFilter;
  				texturePainting2.minFilter = texturePainting2.magFilter = THREE.NearestFilter;
  
  				const materialPainting1 = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texturePainting1 } );
  				const materialPainting2 = new THREE.MeshBasicMaterial( { color: 0xffccaa, map: texturePainting2 } );
  
  				const geometryPainting = new THREE.PlaneGeometry( 100, 100 );
  				const mesh1 = new THREE.Mesh( geometryPainting, materialPainting1 );
  				const mesh2 = new THREE.Mesh( geometryPainting, materialPainting2 );
  
  				addPainting( scene1, mesh1 );
  				addPainting( scene2, mesh2 );
  
  				function addPainting( zscene, zmesh ) {
  
  					const image = texturePainting1.image;
  
  					zmesh.scale.x = image.width / 100;
  					zmesh.scale.y = image.height / 100;
  
  					zscene.add( zmesh );
  
  					const meshFrame = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
  					meshFrame.position.z = - 10.0;
  					meshFrame.scale.x = 1.1 * image.width / 100;
  					meshFrame.scale.y = 1.1 * image.height / 100;
  					zscene.add( meshFrame );
  
  					const meshShadow = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.75, transparent: true } ) );
  					meshShadow.position.y = - 1.1 * image.height / 2;
  					meshShadow.position.z = - 1.1 * image.height / 2;
  					meshShadow.rotation.x = - Math.PI / 2;
  					meshShadow.scale.x = 1.1 * image.width / 100;
  					meshShadow.scale.y = 1.1 * image.height / 100;
  					zscene.add( meshShadow );
  
  					const floorHeight = - 1.117 * image.height / 2;
  					meshCanvas1.position.y = meshCanvas2.position.y = floorHeight;
  
  				}
  
  				
  
  
  				renderer.autoClear = false;
  
  				renderer.domElement.style.position = 'relative';
  
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  			function mipmap( size, color ) {
  
  				const imageCanvas = document.createElement( 'canvas' );
  				const context = imageCanvas.getContext( '2d' );
  
  				imageCanvas.width = imageCanvas.height = size;
  
  				context.fillStyle = '#444';
  				context.fillRect( 0, 0, size, size );
  
  				context.fillStyle = color;
  				context.fillRect( 0, 0, size / 2, size / 2 );
  				context.fillRect( size / 2, size / 2, size / 2, size / 2 );
  				return imageCanvas;
  
  			}
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX );
  				mouseY = ( event.clientY - windowHalfY );
  
  			}
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y += ( - ( mouseY - 200 ) - camera.position.y ) * .05;
    				renderer.clear();
    				renderer.setScissorTest( true );
    				renderer.setScissor( 0, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT );
    				renderer.render( scene1, camera );
    				renderer.setScissor( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT );
    				renderer.render( scene2, camera );
    				renderer.setScissorTest( false );
  })
  
  		
}
</script>
