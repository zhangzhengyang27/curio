<template>
  <ExampleScene
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
  </ExampleScene>
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - texture manual mipmapping example<br/>\n\t\t\tpainting by <a href=\"http://en.wikipedia.org/wiki/Basket_of_Fruit_%28Caravaggio%29\">Caravaggio</a>"
function onReady(__stage: any) {
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
  
  				function mipmap( size: any, color: any ) {
  
  					const imageCanvas = document.createElement( 'canvas' );
  					const context = imageCanvas.getContext( '2d' );
  
  					imageCanvas.width = imageCanvas.height = size;
  
  					context!.fillStyle = '#444';
  					context!.fillRect( 0, 0, size, size );
  
  					context!.fillStyle = color;
  					context!.fillRect( 0, 0, size / 2, size / 2 );
  					context!.fillRect( size / 2, size / 2, size / 2, size / 2 );
  					return imageCanvas;
  
  				}
  
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
  
  
  				// PAINTING
  
  				const callbackPainting = function () {
  
  					const image = texturePainting1.image;
  
  					texturePainting2.image = image;
  					texturePainting2.needsUpdate = true;
  
  					scene1.add( meshCanvas1 );
  					scene2.add( meshCanvas2 );
  
  					const geometry = new THREE.PlaneGeometry( 100, 100 );
  					const mesh1 = new THREE.Mesh( geometry, materialPainting1 );
  					const mesh2 = new THREE.Mesh( geometry, materialPainting2 );
  
  					addPainting( scene1, mesh1 );
  					addPainting( scene2, mesh2 );
  
  					function addPainting( zscene: any, zmesh: any ) {
  
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
  
  
  				};
  
  				const texturePainting1 = new THREE.TextureLoader().load( ASSET_HOST + 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg', callbackPainting );
  				const texturePainting2 = new THREE.Texture();
  				const materialPainting1 = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texturePainting1 } );
  				const materialPainting2 = new THREE.MeshBasicMaterial( { color: 0xffccaa, map: texturePainting2 } );
  
  				texturePainting1.colorSpace = THREE.SRGBColorSpace;
  				texturePainting2.colorSpace = THREE.SRGBColorSpace;
  				texturePainting2.minFilter = texturePainting2.magFilter = THREE.NearestFilter;
  				texturePainting1.minFilter = texturePainting1.magFilter = THREE.LinearFilter;
  				texturePainting1.mapping = THREE.UVMapping;
  
  				
  
  
  				renderer.autoClear = false;
  
  				renderer.domElement.style.position = 'relative';
  
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  
  			function onDocumentMouseMove( event: any ) {
  
  				mouseX = ( event.clientX - windowHalfX );
  				mouseY = ( event.clientY - windowHalfY );
  
  			}
  
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
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
