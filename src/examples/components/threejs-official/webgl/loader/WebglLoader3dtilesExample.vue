<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 10, far: 1000000 }"
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
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { TileCreasedNormalsPlugin } from 'three/examples/jsm/misc/TileCreasedNormalsPlugin.js';
import { TilesRenderer, GlobeControls, CAMERA_FRAME } from '3d-tiles-renderer';
import { CesiumIonAuthPlugin } from '3d-tiles-renderer/core/plugins';
import { GLTFExtensionsPlugin, TilesFadePlugin, UpdateOnChangePlugin } from '3d-tiles-renderer/three/plugins';
import { EffectMaterial, EffectPass, NormalPass, SMAAEffect } from 'postprocessing';
import {
CloudsEffect,
CLOUD_SHAPE_TEXTURE_SIZE,
CLOUD_SHAPE_DETAIL_TEXTURE_SIZE,
DEFAULT_LOCAL_WEATHER_URL,
DEFAULT_SHAPE_URL,
DEFAULT_SHAPE_DETAIL_URL,
DEFAULT_TURBULENCE_URL
} from '@takram/three-clouds';
import { AerialPerspectiveEffect, PrecomputedTexturesGenerator, getSunDirectionECEF } from '@takram/three-atmosphere';
import { STBNLoader, DEFAULT_STBN_URL } from '@takram/three-geospatial';
import { DitheringEffect, LensFlareEffect } from '@takram/three-geospatial-effects';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\t<a href=\"https://github.com/NASA-AMMOS/3DTilesRendererJS\" target=\"_blank\" rel=\"noopener\">3d-tiles-renderer</a> +\n\t\t\t<a href=\"https://github.com/takram-design-engineering/three-geospatial\" target=\"_blank\" rel=\"noopener\">three-clouds</a><br/>\n\t\t\t<a href=\"https://developers.google.com/maps/documentation/tile/3d-tiles\" target=\"_blank\" rel=\"noopener\">Google Photorealistic Tiles</a> token courtesy of <a href=\"https://ion.cesium.com/\" target=\"_blank\" rel=\"noopener\">Cesium Ion</a>.<br/>\n\t\t\t<label>time of day: <input id=\"hour\" type=\"range\" min=\"0\" max=\"24\" value=\"0\" step=\"0.01\" style=\"pointer-events: all; vertical-align: middle;\"></label>"
async function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  			// Ion key provided by Cesium for use on threejs.org
  			// A personal Cesium Ion key can be used for development.
  			const ION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiMTFiZTRmZS1mMWIxLTQ5YzYtYjA4Zi0xYTE0MjFmYzQ5OGYiLCJpZCI6MjY3NzgzLCJpYXQiOjE3MzY0NzQxMDh9.ppGPgpse1lq7QeNyljX7THUyK5w1x_4HksSHSlhe5sY';
  
  			let tiles;
  			let clouds, aerialPerspective;
  			let _prevTime = 0, _deltaTime = 0;
  
  			
  
  
  				// camera
  				
  
  				// scene
  				
  
  				// renderer
  				
  
  
  				renderer.toneMapping = THREE.AgXToneMapping;
  				renderer.toneMappingExposure = 10;
  
  
  				// loader
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const DEG2RAD = Math.PI / 180;
  
  				// tiles
  				tiles = new TilesRenderer();
  				tiles.registerPlugin( new CesiumIonAuthPlugin( { apiToken: ION_KEY, assetId: '2275207', autoRefreshToken: true } ) );
  				tiles.registerPlugin( new GLTFExtensionsPlugin( { dracoLoader } ) );
  				tiles.registerPlugin( new TileCreasedNormalsPlugin( { creaseAngle: 30 * DEG2RAD } ) );
  				tiles.registerPlugin( new TilesFadePlugin() );
  				tiles.registerPlugin( new UpdateOnChangePlugin() );
  				tiles.setCamera( camera );
  				tiles.setResolutionFromRenderer( camera, renderer );
  
  				scene.add( tiles.group );
  
  				// position camera above Tokyo
  				tiles.ellipsoid.getObjectFrame(
  					35.6812 * DEG2RAD, 139.80 * DEG2RAD, 500,
  					- 90 * DEG2RAD, - 10 * DEG2RAD, 0,
  					camera.matrix, CAMERA_FRAME
  				);
  				camera.matrix.decompose( camera.position, camera.quaternion, camera.scale );
  
  				// controls
  				const controls = new GlobeControls( scene, camera, renderer.domElement );
  				controls.setEllipsoid( tiles.ellipsoid, tiles.group );
  				controls.enableDamping = true;
  
  				// Workaround: adjustHeight causes camera drift as tiles load.
  				// Disable until first user interaction.
  				controls.adjustHeight = false;
  
  				function enableAdjustHeight() {
  
  					controls.adjustHeight = true;
  					renderer.domElement.removeEventListener( 'pointerdown', enableAdjustHeight );
  					renderer.domElement.removeEventListener( 'wheel', enableAdjustHeight );
  
  				}
  
  				renderer.domElement.addEventListener( 'pointerdown', enableAdjustHeight );
  				renderer.domElement.addEventListener( 'wheel', enableAdjustHeight );
  
  				// sun direction
  				const sunDirection = new THREE.Vector3();
  				const params = { hourUTC: 0 }; // 0:00 UTC = 9:00 AM Tokyo
  
  				function updateSunDirection() {
  
  					const ms = params.hourUTC * 3600000;
  					const date = new Date( Date.UTC( 2024, 2, 1 ) + ms );
  					getSunDirectionECEF( date, sunDirection );
  					aerialPerspective.sunDirection.copy( sunDirection );
  					clouds.sunDirection.copy( sunDirection );
  
  				}
  
  				// aerial perspective (sky + atmosphere + deferred lighting)
  				aerialPerspective = new AerialPerspectiveEffect( camera );
  				aerialPerspective.sky = true;
  				aerialPerspective.sunLight = true;
  				aerialPerspective.skyLight = true;
  
  				const normalPass = new NormalPass( scene, camera );
  				aerialPerspective.normalBuffer = normalPass.texture;
  
  				// clouds
  				clouds = new CloudsEffect( camera );
  				clouds.coverage = 0.3;
  				clouds.localWeatherVelocity.set( 0.001, 0 );
  				clouds.shadow.farScale = 0.25;
  				clouds.shadow.maxFar = 1e5;
  				clouds.shadow.cascadeCount = 2;
  				clouds.shadow.mapSize.set( 512, 512 );
  				clouds.shadow.splitMode = 'practical';
  				clouds.shadow.splitLambda = 0.71;
  
  				// sync cloud shadows to atmosphere
  				clouds.events.addEventListener( 'change', ( event ) => {
  
  					if ( event.property === 'atmosphereOverlay' ) aerialPerspective.overlay = clouds.atmosphereOverlay;
  					if ( event.property === 'atmosphereShadow' ) aerialPerspective.shadow = clouds.atmosphereShadow;
  					if ( event.property === 'atmosphereShadowLength' ) aerialPerspective.shadowLength = clouds.atmosphereShadowLength;
  
  				} );
  
  				// adapter: bridges pmndrs postprocessing passes to renderer.setEffects()
  
  				class EffectPassAdapter {
  
  					constructor( pass ) {
  
  						this.pass = pass;
  						this.needsSwap = pass.needsSwap !== false;
  						this.enabled = true;
  						this._initialized = false;
  
  					}
  
  					render( renderer, writeBuffer, readBuffer ) {
  
  						if ( ! this._initialized ) {
  
  							this.pass.initialize( renderer, false, THREE.HalfFloatType );
  							this.pass.setSize( readBuffer.width, readBuffer.height );
  
  							if ( readBuffer.depthTexture && this.pass.setDepthTexture ) {
  
  								this.pass.setDepthTexture( readBuffer.depthTexture );
  
  							}
  
  							this._initialized = true;
  
  						}
  
  						if ( this.pass.fullscreenMaterial instanceof EffectMaterial ) {
  
  							this.pass.fullscreenMaterial.adoptCameraSettings( camera );
  
  						}
  
  						this.pass.render( renderer, readBuffer, writeBuffer, _deltaTime );
  
  					}
  
  					setSize( width, height ) {
  
  						if ( this._initialized ) this.pass.setSize( width, height );
  
  					}
  
  				}
  
  				// postprocessing
  				renderer.setEffects( [
  					new EffectPassAdapter( normalPass ),
  					new EffectPassAdapter( new EffectPass( camera, clouds, aerialPerspective ) ),
  					new EffectPassAdapter( new EffectPass( camera, new LensFlareEffect() ) ),
  					new EffectPassAdapter( new EffectPass( camera, new SMAAEffect() ) ),
  					new EffectPassAdapter( new EffectPass( camera, new DitheringEffect() ) ),
  				] );
  
  				// generate precomputed atmosphere textures on GPU
  				const texturesGenerator = new PrecomputedTexturesGenerator( renderer );
  				const textures = await texturesGenerator.update();
  				Object.assign( aerialPerspective, textures );
  				Object.assign( clouds, textures );
  
  				// load cloud textures
  				const textureLoader = new THREE.TextureLoader();
  
  				function loadCloudTexture( url, property ) {
  
  					textureLoader.load( url, ( texture ) => {
  
  						texture.minFilter = THREE.LinearMipMapLinearFilter;
  						texture.magFilter = THREE.LinearFilter;
  						texture.wrapS = THREE.RepeatWrapping;
  						texture.wrapT = THREE.RepeatWrapping;
  						texture.colorSpace = THREE.NoColorSpace;
  						texture.needsUpdate = true;
  						clouds[ property ] = texture;
  
  					} );
  
  				}
  
  				loadCloudTexture( DEFAULT_LOCAL_WEATHER_URL, 'localWeatherTexture' );
  				loadCloudTexture( DEFAULT_TURBULENCE_URL, 'turbulenceTexture' );
  
  				function loadData3DTexture( url, size, property ) {
  
  					fetch( url ).then( res => res.arrayBuffer() ).then( buffer => {
  
  						const data = new Uint8Array( buffer );
  						const texture = new THREE.Data3DTexture( data, size, size, size );
  						texture.format = THREE.RedFormat;
  						texture.minFilter = THREE.LinearFilter;
  						texture.magFilter = THREE.LinearFilter;
  						texture.wrapS = THREE.RepeatWrapping;
  						texture.wrapT = THREE.RepeatWrapping;
  						texture.wrapR = THREE.RepeatWrapping;
  						texture.colorSpace = THREE.NoColorSpace;
  						texture.needsUpdate = true;
  						clouds[ property ] = texture;
  
  					} );
  
  				}
  
  				loadData3DTexture( DEFAULT_SHAPE_URL, CLOUD_SHAPE_TEXTURE_SIZE, 'shapeTexture' );
  				loadData3DTexture( DEFAULT_SHAPE_DETAIL_URL, CLOUD_SHAPE_DETAIL_TEXTURE_SIZE, 'shapeDetailTexture' );
  
  				new STBNLoader().load( DEFAULT_STBN_URL, ( texture ) => {
  
  					clouds.stbnTexture = texture;
  					aerialPerspective.stbnTexture = texture;
  
  				} );
  
  				// initial sun position
  				updateSunDirection();
  
  				const hourInput = document.createElement( 'input' );
  				hourInput.type = 'range';
  				hourInput.min = '0';
  				hourInput.max = '24';
  				hourInput.step = '0.1';
  				hourInput.value = String( params.hourUTC );
  				hourInput.style.cssText = 'position:absolute;bottom:10px;left:10px;width:200px;';
  				__stage.overlay?.appendChild( hourInput );
  				hourInput.addEventListener( 'input', ( e ) => {
  
  					params.hourUTC = parseFloat( e.target.value );
  					updateSunDirection();
  
  				} );
  
  				// start rendering
  				
  				onWindowResize();
  
  			
  
  
  			
  
  			function animate( time ) {
  
  				_deltaTime = ( time - _prevTime ) / 1000;
  				_prevTime = time;
  
  				controls.update();
  				tiles.update();
  
  
  
  			}
  
  		
}
</script>
