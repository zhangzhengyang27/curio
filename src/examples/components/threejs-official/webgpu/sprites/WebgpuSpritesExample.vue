<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 2100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture, uv, userData, fog, rangeFogFactor, color } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Sprites</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let imageWidth = 1, imageHeight = 1;
  
  			
  
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				
  				camera.position.z = 1500;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  				scene.fogNode = fog( color( 0x0000ff ), rangeFogFactor( 1500, 2100 ) );
  
  				// create sprites
  
  				const amount = 200;
  				const radius = 500;
  
  				const textureLoader = new THREE.TextureLoader();
  
  				map = textureLoader.load( ASSET_HOST + 'textures/sprite1.png', ( map ) => {
  
  					imageWidth = map.image.width;
  					imageHeight = map.image.height;
  
  				} );
  
  				group = new THREE.Group();
  
  				const textureNode = texture( map );
  
  				const material = new THREE.SpriteNodeMaterial();
  				material.colorNode = textureNode.mul( uv() ).mul( 2 ).saturate();
  				material.opacityNode = textureNode.a;
  				material.rotationNode = userData( 'rotation', 'float' ); // get value of: sprite.userData.rotation
  
  				for ( let a = 0; a < amount; a ++ ) {
  
  					const x = Math.random() - 0.5;
  					const y = Math.random() - 0.5;
  					const z = Math.random() - 0.5;
  
  					const sprite = new THREE.Sprite( material );
  
  					sprite.position.set( x, y, z );
  					sprite.position.normalize();
  					sprite.position.multiplyScalar( radius );
  
  					// individual rotation per sprite
  					sprite.userData.rotation = 0;
  
  					group.add( sprite );
  
  				}
  
  				scene.add( group );
  
  				//
  
  				
  
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() / 1000;
    				for ( let i = 0, l = group.children.length; i < l; i ++ ) {
    					const sprite = group.children[ i ];
    					const scale = Math.sin( time + sprite.position.x * 0.01 ) * 0.3 + 1.0;
    					sprite.userData.rotation += 0.1 * ( i / l );
    					sprite.scale.set( scale * imageWidth, scale * imageHeight, 1.0 );
    				}
    				group.rotation.x = time * 0.5;
    				group.rotation.y = time * 0.75;
    				group.rotation.z = time * 1.0;
  })
  
  		
}
</script>
