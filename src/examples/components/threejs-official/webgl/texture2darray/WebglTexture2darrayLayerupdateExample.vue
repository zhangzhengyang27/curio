<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 45, near: 0.1, far: 2000 }"
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
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - 2D Compressed Texture Array Layer Updates<br />\n\t\t\tLoop from the movie Spirited away\n\t\t\tby the <a href=\"https://www.ghibli.jp/\" target=\"_blank\" rel=\"noopener\">Studio Ghibli</a><br />"

const vsSource = /* glsl */`
  uniform vec2 size;
  out vec2 vUv;
  void main() {
    vUv = uv;
    vec3 transformed = position;
    transformed.xy *= size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
  }
`;

const fsSource = /* glsl */`
  precision highp sampler2DArray;
  uniform sampler2DArray diffuse;
  in vec2 vUv;
  out vec4 outColor;
  void main() {
    vec4 color = texture( diffuse, vec3( vUv, float( gl_InstanceID ) ) );
    outColor = color;
  }
`;

async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mesh;
  
  			const planeWidth = 20;
  			const planeHeight = 10;
  
  			
  
  
  				
  
  				
  				camera.position.z = 70;
  
  				
  
  				// Configure the renderer.
  
  				
  
  
  
  
  				// Configure the KTX2 loader.
  
  				const ktx2Loader = new KTX2Loader();
  				ktx2Loader.detectSupport( renderer );
  
  				// Load several KTX2 textures which will later be used to modify
  				// specific texture array layers.
  
  				const spiritedaway = await ktx2Loader.loadAsync( ASSET_HOST + 'textures/spiritedaway.ktx2' );
  
  				// Create a texture array for rendering.
  
  				const layerByteLength = THREE.TextureUtils.getByteLength(
  					spiritedaway.image.width,
  					spiritedaway.image.height,
  					spiritedaway.format,
  					spiritedaway.type,
  				);
  
  				const textureArray = new THREE.CompressedArrayTexture( [
  					{
  						data: new Uint8Array( layerByteLength * 3 ),
  						width: spiritedaway.image.width,
  						height: spiritedaway.image.height,
  					}
  				], spiritedaway.image.width, spiritedaway.image.height, 3, spiritedaway.format, spiritedaway.type );
  
  				// Setup the GUI
  
  				const formData = {
  					srcLayer: 0,
  					destLayer: 0,
  					transfer() {
  
  						const layerElementLength = layerByteLength / spiritedaway.mipmaps[ 0 ].data.BYTES_PER_ELEMENT;
  						textureArray.mipmaps[ 0 ].data.set(
  							spiritedaway.mipmaps[ 0 ].data.subarray(
  								layerElementLength * ( formData.srcLayer % spiritedaway.image.depth ),
  								layerElementLength * ( ( formData.srcLayer % spiritedaway.image.depth ) + 1 ),
  							),
  							layerByteLength * formData.destLayer,
  						);
  						textureArray.addLayerUpdate( formData.destLayer );
  						textureArray.needsUpdate = true;
  
  
  
  					},
  				};
  
  				gui = new GUI();
  				gui.add( formData, 'srcLayer', 0, spiritedaway.image.depth - 1, 1 );
  				gui.add( formData, 'destLayer', 0, textureArray.image.depth - 1, 1 );
  				gui.add( formData, 'transfer' );
  
  				/// Setup the scene.
  
  				const material = new THREE.ShaderMaterial( {
  					uniforms: {
  						diffuse: { value: textureArray },
  						size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
  					},
  					vertexShader: vsSource,
  					fragmentShader: fsSource,
  					glslVersion: THREE.GLSL3
  				} );
  
  				const geometry = new THREE.InstancedBufferGeometry();
  				geometry.copy( new THREE.PlaneGeometry( planeWidth, planeHeight ) );
  				geometry.instanceCount = 3;
  
  				const instancedIndexAttribute = new THREE.InstancedBufferAttribute(
  					new Uint16Array( [ 0, 1, 2 ] ), 1, false, 1
  				);
  				instancedIndexAttribute.gpuType = THREE.IntType;
  				geometry.setAttribute( 'instancedIndex', instancedIndexAttribute );
  
  				mesh = new THREE.InstancedMesh( geometry, material, 3 );
  
  				scene.add( mesh );
  
  				
  
  				// Initialize the texture array by first rendering the spirited away
  				// frames in order.
  
  				textureArray.mipmaps[ 0 ].data.set(
  					spiritedaway.mipmaps[ 0 ].data.subarray( 0, textureArray.mipmaps[ 0 ].data.length )
  				);
  				textureArray.needsUpdate = true;
  
  
  			
  
  
  			
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
