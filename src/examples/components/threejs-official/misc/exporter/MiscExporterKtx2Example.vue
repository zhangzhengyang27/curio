<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[10, 0, 0]"
    :camera-options="{ fov: 50, near: 0.1, far: 100 }"
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
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { KTX2Exporter } from 'three/examples/jsm/exporters/KTX2Exporter.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - exporter - ktx2"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls






			let exporter: any, mesh: any, renderTarget: any, dataTexture: any;
  
  			const params = {
  				target: 'pmrem',
  				export: exportFile
  			};
  
  			
  
  
  				
  				renderer.toneMapping = THREE.AgXToneMapping;
  
  
  				//
  
  				
  
  
  				
  
  				exporter = new KTX2Exporter();
  				const hdrLoader = new HDRLoader();
  
  				//
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				pmremGenerator.compileEquirectangularShader();
  
  				hdrLoader.load( ASSET_HOST + 'textures/equirectangular/venice_sunset_1k.hdr', function ( texture ) {
  
  					texture.mapping = THREE.EquirectangularReflectionMapping;
  
  					renderTarget = pmremGenerator.fromEquirectangular( texture );
  					scene.background = renderTarget.texture;
  
  				} );
  
  				createDataTexture();
  
  				//
  
  				
  				controls.enableDamping = true;
  				controls.rotateSpeed = - 0.25; // negative, to track mouse pointer
  
  				//
  
  				
  
  				gui = new GUI();
  
  				gui.add( params, 'target' ).options( [ 'pmrem', 'data-texture' ] ).onChange( swapScene );
  				gui.add( params, 'export' ).name( 'Export KTX2' );
  				gui.open();
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  			}
  
  			function createDataTexture() {
  
  				const normal = new THREE.Vector3();
  				const coord = new THREE.Vector2();
  				const size = 800, radius = 320, factor = Math.PI * 0.5 / radius;
  				const data = new Float32Array( 4 * size * size );
  
  				for ( let i = 0; i < size; i ++ ) {
  
  					for ( let j = 0; j < size; j ++ ) {
  
  						const idx = i * size * 4 + j * 4;
  						coord.set( j, i ).subScalar( size / 2 );
  
  						if ( coord.length() < radius )
  							normal.set(
  								Math.sin( coord.x * factor ),
  								Math.sin( coord.y * factor ),
  								Math.cos( coord.x * factor )
  							);
  						else
  							normal.set( 0, 0, 1 );
  
  						data[ idx + 0 ] = .5 + .5 * normal.x;
  						data[ idx + 1 ] = .5 + .5 * normal.y;
  						data[ idx + 2 ] = .5 + .5 * normal.z;
  						data[ idx + 3 ] = 1.;
  
  					}
  
  				}
  
  				dataTexture = new THREE.DataTexture( data, size, size, THREE.RGBAFormat, THREE.FloatType );
  				dataTexture.needsUpdate = true;
  
  				const material = new THREE.MeshBasicMaterial( { map: dataTexture } );
  				const quad = new THREE.PlaneGeometry( 50, 50 );
  				mesh = new THREE.Mesh( quad, material );
  				mesh.visible = false;
  
  				scene.add( mesh );
  
  			}
  
  			function swapScene() {
  
  				if ( params.target == 'pmrem' ) {
  
  
  					controls.enabled = true;
  					scene.background = renderTarget.texture;
  					mesh.visible = false;
  					renderer.toneMapping = THREE.AgXToneMapping;
  
  				} else {
  
  
  					controls.enabled = false;
  					scene.background = new THREE.Color( 0, 0, 0 );
  					mesh.visible = true;
  					renderer.toneMapping = THREE.NoToneMapping;
  
  				}
  
  			}
  
  			async function exportFile() {
  
  				let result;
  
  				if ( params.target == 'pmrem' )
  					result = await exporter.parse( renderer, renderTarget );
  				else
  					result = await exporter.parse( dataTexture );
  
  				saveArrayBuffer( result, params.target + '.ktx2' );
  
  			}
  
  			function saveArrayBuffer( buffer: any, filename: any ) {
  
  				const blob = new Blob( [ buffer ], { type: 'image/ktx2' } );
  				const link = document.createElement( 'a' );
  
  				link.href = URL.createObjectURL( blob );
  				link.download = filename;
  				link.click();
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
