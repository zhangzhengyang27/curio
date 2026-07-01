<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lut } from 'three/examples/jsm/math/Lut.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - lookup table<br/>\n\t\t\tvertex color values from a range of data values"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  			let perpCamera, orthoCamera, lut;
  
  			let mesh, sprite;
  			let uiScene;
  
  			let params;
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  
  				uiScene = new THREE.Scene();
  
  				lut = new Lut();
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				perpCamera = new THREE.PerspectiveCamera( 60, width / height, 1, 100 );
  				perpCamera.position.set( 0, 0, 10 );
  				scene.add( perpCamera );
  
  				orthoCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 1, 2 );
  				orthoCamera.position.set( 0.5, 0, 1 );
  
  				sprite = new THREE.Sprite( new THREE.SpriteMaterial( {
  					map: new THREE.CanvasTexture( lut.createCanvas() )
  				} ) );
  				sprite.material.map.colorSpace = THREE.SRGBColorSpace;
  				sprite.scale.x = 0.125;
  				uiScene.add( sprite );
  
  				mesh = new THREE.Mesh( undefined, new THREE.MeshLambertMaterial( {
  					side: THREE.DoubleSide,
  					color: 0xF5F5F5,
  					vertexColors: true
  				} ) );
  				scene.add( mesh );
  
  				params	= {
  					colorMap: 'rainbow',
  				};
  				loadModel( );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 3, 0, 0 );
  				perpCamera.add( pointLight );
  
  				
  				renderer.autoClear = false;
  
  
  
  
  				
  
  
  				controls.addEventListener( 'change', render );
  
  				const gui = new GUI();
  
  				gui.add( params, 'colorMap', [ 'rainbow', 'cooltowarm', 'blackbody', 'grayscale' ] ).onChange( function () {
  
  					updateColors();
  					render();
  
  				} );
  
  			
  
  
  			
  
  			function render() {
  
  				renderer.clear();
  				renderer.render( scene, perpCamera );
  				renderer.render( uiScene, orthoCamera );
  
  			}
  
  			function loadModel( ) {
  
  				const loader = new THREE.BufferGeometryLoader();
  				loader.load( ASSET_HOST + 'models/json/pressure.json', function ( geometry ) {
  
  					geometry.center();
  					geometry.computeVertexNormals();
  
  					// default color attribute
  					const colors = [];
  
  					for ( let i = 0, n = geometry.attributes.position.count; i < n; ++ i ) {
  
  						colors.push( 1, 1, 1 );
  
  					}
  
  					geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  					mesh.geometry = geometry;
  					updateColors();
  
  					render();
  
  				} );
  
  			}
  
  			function updateColors() {
  
  				lut.setColorMap( params.colorMap );
  
  				lut.setMax( 2000 );
  				lut.setMin( 0 );
  
  				const geometry = mesh.geometry;
  				const pressures = geometry.attributes.pressure;
  				const colors = geometry.attributes.color;
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < pressures.array.length; i ++ ) {
  
  					const colorValue = pressures.array[ i ];
  
  					color.copy( lut.getColor( colorValue ) ).convertSRGBToLinear();
  
  					colors.setXYZ( i, color.r, color.g, color.b );
  
  				}
  
  				colors.needsUpdate = true;
  
  				const map = sprite.material.map;
  				lut.updateCanvas( map.image );
  				map.needsUpdate = true;
  
  			}
  
  		
}
</script>
