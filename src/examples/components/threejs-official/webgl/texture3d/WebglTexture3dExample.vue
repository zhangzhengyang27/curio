<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[-64, -64, 128]"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader.js';
import { VolumeRenderShader1 } from 'three/examples/jsm/shaders/VolumeShader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Float volume render test (mip / isosurface)"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  		let material, volconfig, cmtextures;
  
  		
  
  
  			
  
  			// Create renderer
  			
  
  
  
  
  			// Create camera
  			const h = 512; // frustum height
  			const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  			
  
  			camera.up.set( 0, 0, 1 ); // In our data, z is up
  
  			// Create controls
  			
  			controls.addEventListener( 'change', render );
  			controls.target.set( 64, 64, 128 );
  			controls.minZoom = 0.5;
  			controls.maxZoom = 4;
  			controls.enablePan = false;
  			controls.update();
  
  			// scene.add( new AxesHelper( 128 ) );
  
  			// Lighting is baked into the shader a.t.m.
  			// let dirLight = new DirectionalLight( 0xffffff );
  
  			// The gui for interaction
  			volconfig = { clim1: 0, clim2: 1, renderstyle: 'iso', isothreshold: 0.15, colormap: 'viridis' };
  			gui = new GUI();
  			gui.add( volconfig, 'clim1', 0, 1, 0.01 ).onChange( updateUniforms );
  			gui.add( volconfig, 'clim2', 0, 1, 0.01 ).onChange( updateUniforms );
  			gui.add( volconfig, 'colormap', { gray: 'gray', viridis: 'viridis' } ).onChange( updateUniforms );
  			gui.add( volconfig, 'renderstyle', { mip: 'mip', iso: 'iso' } ).onChange( updateUniforms );
  			gui.add( volconfig, 'isothreshold', 0, 1, 0.01 ).onChange( updateUniforms );
  
  			// Load the data ...
  			new NRRDLoader().load( ASSET_HOST + 'models/nrrd/stent.nrrd', function ( volume ) {
  
  				// Texture to hold the volume. We have scalars, so we put our data in the red channel.
  				// THREEJS will select R32F (33326) based on the THREE.RedFormat and THREE.FloatType.
  				// Also see https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
  				// TODO: look the dtype up in the volume metadata
  				const texture = new THREE.Data3DTexture( volume.data, volume.xLength, volume.yLength, volume.zLength );
  				texture.format = THREE.RedFormat;
  				texture.type = THREE.FloatType;
  				texture.minFilter = texture.magFilter = THREE.LinearFilter;
  				texture.unpackAlignment = 1;
  				texture.needsUpdate = true;
  
  				// Colormap textures
  				cmtextures = {
  					viridis: new THREE.TextureLoader().load( ASSET_HOST + 'textures/cm_viridis.png', render ),
  					gray: new THREE.TextureLoader().load( ASSET_HOST + 'textures/cm_gray.png', render )
  				};
  
  				// Material
  				const shader = VolumeRenderShader1;
  
  				const uniforms = THREE.UniformsUtils.clone( shader.uniforms );
  
  				uniforms[ 'u_data' ].value = texture;
  				uniforms[ 'u_size' ].value.set( volume.xLength, volume.yLength, volume.zLength );
  				uniforms[ 'u_clim' ].value.set( volconfig.clim1, volconfig.clim2 );
  				uniforms[ 'u_renderstyle' ].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
  				uniforms[ 'u_renderthreshold' ].value = volconfig.isothreshold; // For ISO renderstyle
  				uniforms[ 'u_cmdata' ].value = cmtextures[ volconfig.colormap ];
  
  				material = new THREE.ShaderMaterial( {
  					uniforms: uniforms,
  					vertexShader: shader.vertexShader,
  					fragmentShader: shader.fragmentShader,
  					side: THREE.BackSide // The volume shader uses the backface as its "reference point"
  				} );
  
  				// THREE.Mesh
  				const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength );
  				geometry.translate( volume.xLength / 2 - 0.5, volume.yLength / 2 - 0.5, volume.zLength / 2 - 0.5 );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				render();
  
  			} );
  
  			
  
  		
  
  
  		function updateUniforms() {
  
  			material.uniforms[ 'u_clim' ].value.set( volconfig.clim1, volconfig.clim2 );
  			material.uniforms[ 'u_renderstyle' ].value = volconfig.renderstyle == 'mip' ? 0 : 1; // 0: MIP, 1: ISO
  			material.uniforms[ 'u_renderthreshold' ].value = volconfig.isothreshold; // For ISO renderstyle
  			material.uniforms[ 'u_cmdata' ].value = cmtextures[ volconfig.colormap ];
  
  			render();
  
  		}
  
  		
  
  		function render() {
  
  
  
  		}
  
  	
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
