<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[82.48, 22.09, -45.24]"
    :camera-options="{ fov: 45, near: 0.1, far: 1000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { IfcAPI } from 'web-ifc';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t-\n\t\t\tIFC loader using\n\t\t\t<a href=\"https://github.com/ThatOpen/engine_web-ifc\" target=\"_blank\" rel=\"noopener\">web-ifc</a>.\n\t\t\tSee <a href=\"https://github.com/ThatOpen\" target=\"_blank\" rel=\"noopener\">main project repository</a> for more information and BIM tools."
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const WEB_IFC_VERSION = '0.0.77';
  			const WEB_IFC_WASM_PATH = `https://cdn.jsdelivr.net/npm/web-ifc@${ WEB_IFC_VERSION }/`;
  
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x8cc7de );
  
  				
  
  
  				const directionalLight1 = new THREE.DirectionalLight( 0xffeeff, 2.5 );
  				directionalLight1.position.set( 1, 1, 1 );
  				scene.add( directionalLight1 );
  
  				const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 2.5 );
  				directionalLight2.position.set( - 1, 0.5, - 1 );
  				scene.add( directionalLight2 );
  
  				const ambientLight = new THREE.AmbientLight( 0xffffee, 0.75 );
  				scene.add( ambientLight );
  
  				
  
  
  
  
  
  				controls.target.set( 30.86, 7.73, 0.15 );
  				controls.update();
  				controls.addEventListener( 'change', render );
  
  				
  
  				const ifcAPI = new IfcAPI();
  				ifcAPI.SetWasmPath( WEB_IFC_WASM_PATH );
  				await ifcAPI.Init();
  
  				const response = await fetch( ASSET_HOST + 'models/ifc/rac_advanced_sample_project.ifc' );
  				const data = new Uint8Array( await response.arrayBuffer() );
  
  				const modelID = ifcAPI.OpenModel( data, { COORDINATE_TO_ORIGIN: true } );
  				loadAllGeometry( ifcAPI, modelID );
  				ifcAPI.CloseModel( modelID );
  
  				render();
  
  			
  
  
  			function loadAllGeometry( ifcAPI: any, modelID: any ) {
  
  				const opaqueGeometries: any = [];
  				const transparentGeometries: any = [];
  				const materialCache = {};
  
  				ifcAPI.StreamAllMeshes( modelID, ( flatMesh: any ) => {
  
  					const placedGeometries = flatMesh.geometries;
  
  					for ( let i = 0; i < placedGeometries.size(); i ++ ) {
  
  						const placedGeometry = placedGeometries.get( i );
  						const mesh = getPlacedGeometry( ifcAPI, modelID, placedGeometry, materialCache );
  						const geometry = mesh.geometry.applyMatrix4( mesh.matrix );
  
  						if ( placedGeometry.color.w !== 1 ) {
  
  							transparentGeometries.push( geometry );
  
  						} else {
  
  							opaqueGeometries.push( geometry );
  
  						}
  
  					}
  
  				} );
  
  				if ( opaqueGeometries.length > 0 ) {
  
  					const merged = BufferGeometryUtils.mergeGeometries( opaqueGeometries );
  					const material = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, vertexColors: true } );
  					scene.add( new THREE.Mesh( merged, material ) );
  
  				}
  
  				if ( transparentGeometries.length > 0 ) {
  
  					const merged = BufferGeometryUtils.mergeGeometries( transparentGeometries );
  					const material = new THREE.MeshPhongMaterial( {
  						side: THREE.DoubleSide,
  						vertexColors: true,
  						transparent: true,
  					} );
  					scene.add( new THREE.Mesh( merged, material ) );
  
  				}
  
  			}
  
  			function getPlacedGeometry( ifcAPI: any, modelID: any, placedGeometry: any, materialCache: any ) {
  
  				const geometry = getBufferGeometry( ifcAPI, modelID, placedGeometry );
  				const material = getMeshMaterial( placedGeometry.color, materialCache );
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.matrix = new THREE.Matrix4().fromArray( placedGeometry.flatTransformation );
  				mesh.matrixAutoUpdate = false;
  				return mesh;
  
  			}
  
  			function getBufferGeometry( ifcAPI: any, modelID: any, placedGeometry: any ) {
  
  				const geometry = ifcAPI.GetGeometry( modelID, placedGeometry.geometryExpressID );
  				const vertexData = ifcAPI.GetVertexArray( geometry.GetVertexData(), geometry.GetVertexDataSize() );
  				const indexData = ifcAPI.GetIndexArray( geometry.GetIndexData(), geometry.GetIndexDataSize() );
  
  				const bufferGeometry = ifcGeometryToBuffer( placedGeometry.color, vertexData, indexData );
  
  				// Geometry is owned by the WASM heap and must be released.
  				geometry.delete();
  				return bufferGeometry;
  
  			}
  
  			function getMeshMaterial( color: any, materialCache: any ) {
  
  				const id = `${ color.x }-${ color.y }-${ color.z }-${ color.w }`;
  				const cached = materialCache[ id ];
  				if ( cached ) return cached;
  
  				const material = new THREE.MeshPhongMaterial( {
  					color: new THREE.Color( color.x, color.y, color.z ),
  					side: THREE.DoubleSide,
  				} );
  
  				if ( color.w !== 1 ) {
  
  					material.transparent = true;
  					material.opacity = color.w;
  
  				}
  
  				materialCache[ id ] = material;
  				return material;
  
  			}
  
  			const _tmpColor = new THREE.Color();
  
  			function ifcGeometryToBuffer( color: any, vertexData: any, indexData: any ) {
  
  				// web-ifc returns interleaved [px, py, pz, nx, ny, nz] per vertex.
  				const vertexCount = vertexData.length / 6;
  				const positions = new Float32Array( vertexCount * 3 );
  				const normals = new Float32Array( vertexCount * 3 );
  				const colors = new Float32Array( vertexCount * 4 );
  
  				// IFC stores colors in sRGB display space; convert to linear once per geometry.
  				_tmpColor.setRGB( color.x, color.y, color.z, THREE.SRGBColorSpace );
  
  				for ( let v = 0; v < vertexCount; v ++ ) {
  
  					const src = v * 6;
  					const dst3 = v * 3;
  					const dst4 = v * 4;
  
  					positions[ dst3 + 0 ] = vertexData[ src + 0 ];
  					positions[ dst3 + 1 ] = vertexData[ src + 1 ];
  					positions[ dst3 + 2 ] = vertexData[ src + 2 ];
  
  					normals[ dst3 + 0 ] = vertexData[ src + 3 ];
  					normals[ dst3 + 1 ] = vertexData[ src + 4 ];
  					normals[ dst3 + 2 ] = vertexData[ src + 5 ];
  
  					colors[ dst4 + 0 ] = _tmpColor.r;
  					colors[ dst4 + 1 ] = _tmpColor.g;
  					colors[ dst4 + 2 ] = _tmpColor.b;
  					colors[ dst4 + 3 ] = color.w;
  
  				}
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
  				geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 4 ) );
  				geometry.setIndex( new THREE.BufferAttribute( indexData, 1 ) );
  				return geometry;
  
  			}
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
