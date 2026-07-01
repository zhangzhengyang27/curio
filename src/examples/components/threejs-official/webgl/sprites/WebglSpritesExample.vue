<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 60, near: 1, far: 2100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - sprites"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let cameraOrtho, sceneOrtho;
  
  			let spriteTL, spriteTR, spriteBL, spriteBR, spriteC;
  
  
  
  
  
  			
  
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				
  				camera.position.z = 1500;
  
  				cameraOrtho = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
  				cameraOrtho.position.z = 10;
  
  				
  				scene.fog = new THREE.Fog( 0x000000, 1500, 2100 );
  
  				sceneOrtho = new THREE.Scene();
  
  				// create sprites
  
  				const amount = 200;
  				const radius = 500;
  
  				const textureLoader = new THREE.TextureLoader();
  
  				textureLoader.load( ASSET_HOST + 'textures/sprite0.png', createHUDSprites );
  				const mapB = textureLoader.load( ASSET_HOST + 'textures/sprite1.png' );
  				mapC = textureLoader.load( ASSET_HOST + 'textures/sprite2.png' );
  
  				mapB.colorSpace = THREE.SRGBColorSpace;
  				mapC.colorSpace = THREE.SRGBColorSpace;
  
  				group = new THREE.Group();
  
  				const materialC = new THREE.SpriteMaterial( { map: mapC, color: 0xffffff, fog: true } );
  				const materialB = new THREE.SpriteMaterial( { map: mapB, color: 0xffffff, fog: true } );
  
  				for ( let a = 0; a < amount; a ++ ) {
  
  					const x = Math.random() - 0.5;
  					const y = Math.random() - 0.5;
  					const z = Math.random() - 0.5;
  
  
  
  					if ( z < 0 ) {
  
  						material = materialB.clone();
  
  					} else {
  
  						material = materialC.clone();
  						material.color.setHSL( 0.5 * Math.random(), 0.75, 0.5 );
  						material.map.offset.set( - 0.5, - 0.5 );
  						material.map.repeat.set( 2, 2 );
  
  					}
  
  					const sprite = new THREE.Sprite( material );
  
  					sprite.position.set( x, y, z );
  					sprite.position.normalize();
  					sprite.position.multiplyScalar( radius );
  
  					group.add( sprite );
  
  				}
  
  				scene.add( group );
  
  				// renderer
  
  				
  
  
  				renderer.autoClear = false; // To allow render overlay on top of sprited sphere
  
  
  
  				//
  
  				
  
  			
  
  
  			function createHUDSprites( texture ) {
  
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				const material = new THREE.SpriteMaterial( { map: texture } );
  
  				const width = material.map.image.width;
  				const height = material.map.image.height;
  
  				spriteTL = new THREE.Sprite( material );
  				spriteTL.center.set( 0.0, 1.0 );
  				spriteTL.scale.set( width, height, 1 );
  				sceneOrtho.add( spriteTL );
  
  				spriteTR = new THREE.Sprite( material );
  				spriteTR.center.set( 1.0, 1.0 );
  				spriteTR.scale.set( width, height, 1 );
  				sceneOrtho.add( spriteTR );
  
  				spriteBL = new THREE.Sprite( material );
  				spriteBL.center.set( 0.0, 0.0 );
  				spriteBL.scale.set( width, height, 1 );
  				sceneOrtho.add( spriteBL );
  
  				spriteBR = new THREE.Sprite( material );
  				spriteBR.center.set( 1.0, 0.0 );
  				spriteBR.scale.set( width, height, 1 );
  				sceneOrtho.add( spriteBR );
  
  				spriteC = new THREE.Sprite( material );
  				spriteC.center.set( 0.5, 0.5 );
  				spriteC.scale.set( width, height, 1 );
  				sceneOrtho.add( spriteC );
  
  				updateHUDSprites();
  
  			}
  
  			function updateHUDSprites() {
  
  				const width = (__stage.container?.clientWidth || window.innerWidth) / 2;
  				const height = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  				spriteTL.position.set( - width, height, 1 ); // top left
  				spriteTR.position.set( width, height, 1 ); // top right
  				spriteBL.position.set( - width, - height, 1 ); // bottom left
  				spriteBR.position.set( width, - height, 1 ); // bottom right
  				spriteC.position.set( 0, 0, 1 ); // center
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() / 1000;
    				for ( let i = 0, l = group.children.length; i < l; i ++ ) {
    					const sprite = group.children[ i ];
    					const material = sprite.material;
    					const scale = Math.sin( time + sprite.position.x * 0.01 ) * 0.3 + 1.0;
    					let imageWidth = 1;
    					let imageHeight = 1;
    					if ( material.map && material.map.image && material.map.image.width ) {
    						imageWidth = material.map.image.width;
    						imageHeight = material.map.image.height;
    					}
    					sprite.material.rotation += 0.1 * ( i / l );
    					sprite.scale.set( scale * imageWidth, scale * imageHeight, 1.0 );
    					if ( material.map !== mapC ) {
    						material.opacity = Math.sin( time + sprite.position.x * 0.01 ) * 0.4 + 0.6;
    					}
    				}
    				group.rotation.x = time * 0.5;
    				group.rotation.y = time * 0.75;
    				group.rotation.z = time * 1.0;
    				renderer.clear();
    				renderer.clearDepth();
  })
  
  		
}
</script>
