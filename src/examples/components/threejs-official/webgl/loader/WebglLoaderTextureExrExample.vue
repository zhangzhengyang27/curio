<template>
  <ExampleScene
    camera="perspective"
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

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl EXR texture loader example<br/>\n\t\t\tImage courtesy of <a href=\"http://www.pauldebevec.com/Research/HDR/\" target=\"_blank\" rel=\"noopener\">Paul Debevec</a>."
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			const params = {
  				exposure: 2.0
  			};
  
  
  			
  
  
  				
  
  
  
  
  				renderer.toneMapping = THREE.ReinhardToneMapping;
  				renderer.toneMappingExposure = params.exposure;
  
  
  				
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  
  				
  
  				new EXRLoader()
  					.load( ASSET_HOST + 'textures/memorial.exr', function ( texture, textureData ) {
  
  						// memorial.exr is NPOT
  
  						//console.log( textureData );
  						//console.log( texture );
  
  						// EXRLoader sets these default settings
  						//texture.generateMipmaps = false;
  						//texture.minFilter = LinearFilter;
  						//texture.magFilter = LinearFilter;
  
  						const material = new THREE.MeshBasicMaterial( { map: texture } );
  
  						const quad = new THREE.PlaneGeometry( 1.5 * textureData.width / textureData.height, 1.5 );
  
  						const mesh = new THREE.Mesh( quad, material );
  
  						scene.add( mesh );
  
  						render();
  
  					} );
  
  				//
  
  				gui = new GUI();
  
  				gui.add( params, 'exposure', 0, 4, 0.01 ).onChange( render );
  				gui.open();
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			function render() {
  
  				renderer.toneMappingExposure = params.exposure;
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
