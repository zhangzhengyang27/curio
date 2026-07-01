<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[2.5, 1.5, 3]"
    :camera-options="{ fov: 45, near: 0.25, far: 20 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - GLTFLoader + <a href=\"https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants\" target=\"_blank\" rel=\"noopener\">KHR_materials_variants</a><br />\n\t\t\t<a href=\"https://github.com/pushmatrix/glTF-Sample-Models/tree/master/2.0/MaterialsVariantsShoe\" target=\"_blank\" rel=\"noopener\">Materials Variants Shoe</a> by\n\t\t\t<a href=\"https://github.com/Shopify\" target=\"_blank\" rel=\"noopener\">Shopify, Inc</a><br />\n\t\t\t<a href=\"https://hdrihaven.com/hdri/?h=quarry_01\" target=\"_blank\" rel=\"noopener\">Quarry</a> from <a href=\"https://hdrihaven.com/\" target=\"_blank\" rel=\"noopener\">HDRI Haven</a>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			const state = { variant: 'midnight' };
  
  			
  			render();
  
  			
  
  
  				
  
  				
  
  
  				
  
  				new HDRLoader()
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'quarry_01_1k.hdr', function ( texture ) {
  
  						texture.mapping = THREE.EquirectangularReflectionMapping;
  
  						scene.background = texture;
  						scene.environment = texture;
  
  						render();
  
  						// model
  
  						const loader = new GLTFLoader().setPath( ASSET_HOST + 'models/gltf/MaterialsVariantsShoe/glTF/' );
  						loader.load( 'MaterialsVariantsShoe.gltf', function ( gltf ) {
  
  							gltf.scene.scale.set( 10.0, 10.0, 10.0 );
  
  							scene.add( gltf.scene );
  
  							// GUI
  							gui = new GUI();
  
  							// Details of the KHR_materials_variants extension used here can be found below
  							// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
  							const parser = gltf.parser;
  							const variantsExtension = gltf.userData.gltfExtensions[ 'KHR_materials_variants' ];
  							const variants = variantsExtension.variants.map( ( variant ) => variant.name );
  							const variantsCtrl = gui.add( state, 'variant', variants ).name( 'Variant' );
  
  							selectVariant( scene, parser, variantsExtension, state.variant );
  
  							variantsCtrl.onChange( ( value ) => selectVariant( scene, parser, variantsExtension, value ) );
  
  							render();
  
  						} );
  
  					} );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 2;
  				controls.maxDistance = 10;
  				controls.target.set( 0, 0.5, - 0.2 );
  				controls.update();
  
  				
  
  			
  
  
  			function selectVariant( scene, parser, extension, variantName ) {
  
  				const variantIndex = extension.variants.findIndex( ( v ) => v.name.includes( variantName ) );
  
  				scene.traverse( async ( object ) => {
  
  					if ( ! object.isMesh || ! object.userData.gltfExtensions ) return;
  
  					const meshVariantDef = object.userData.gltfExtensions[ 'KHR_materials_variants' ];
  
  					if ( ! meshVariantDef ) return;
  
  					if ( ! object.userData.originalMaterial ) {
  
  						object.userData.originalMaterial = object.material;
  
  					}
  
  					const mapping = meshVariantDef.mappings
  						.find( ( mapping ) => mapping.variants.includes( variantIndex ) );
  
  					if ( mapping ) {
  
  						object.material = await parser.getDependency( 'material', mapping.material );
  						parser.assignFinalMaterial( object );
  
  					} else {
  
  						object.material = object.userData.originalMaterial;
  
  					}
  
  					render();
  
  				} );
  
  			}
  
  			
  
  			//
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
