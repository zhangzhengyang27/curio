<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 200]"
    :camera-options="{ fov: 50, near: 1, far: 1000 }"
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
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - SVGLoader"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let gui, guiData;
  
  			
  			//
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				//
  
  				
  
  
  				//
  
  				
  
  
  
  
  				//
  
  
  				controls.addEventListener( 'change', render );
  				controls.screenSpacePanning = true;
  
  				//
  
  				
  
  				guiData = {
  					currentURL: ASSET_HOST + 'models/svg/tiger.svg',
  					drawFillShapes: true,
  					drawStrokes: true,
  					fillShapesWireframe: false,
  					strokesWireframe: false
  				};
  
  				loadSVG( guiData.currentURL );
  
  				createGUI();
  
  			
  
  
  			function createGUI() {
  
  				if ( gui ) gui.destroy();
  
  				gui = new GUI();
  
  				gui.add( guiData, 'currentURL', {
  
  					'Tiger': ASSET_HOST + 'models/svg/tiger.svg',
  					'Joins and caps': ASSET_HOST + 'models/svg/lineJoinsAndCaps.svg',
  					'Hexagon': ASSET_HOST + 'models/svg/hexagon.svg',
  					'Energy': ASSET_HOST + 'models/svg/energy.svg',
  					'Test 1': ASSET_HOST + 'models/svg/tests/1.svg',
  					'Test 2': ASSET_HOST + 'models/svg/tests/2.svg',
  					'Test 3': ASSET_HOST + 'models/svg/tests/3.svg',
  					'Test 4': ASSET_HOST + 'models/svg/tests/4.svg',
  					'Test 5': ASSET_HOST + 'models/svg/tests/5.svg',
  					'Test 6': ASSET_HOST + 'models/svg/tests/6.svg',
  					'Test 7': ASSET_HOST + 'models/svg/tests/7.svg',
  					'Test 8': ASSET_HOST + 'models/svg/tests/8.svg',
  					'Test 9': ASSET_HOST + 'models/svg/tests/9.svg',
  					'Units': ASSET_HOST + 'models/svg/tests/units.svg',
  					'Ordering': ASSET_HOST + 'models/svg/tests/ordering.svg',
  					'Defs': ASSET_HOST + 'models/svg/tests/testDefs/Svg-defs.svg',
  					'Defs2': ASSET_HOST + 'models/svg/tests/testDefs/Svg-defs2.svg',
  					'Defs3': ASSET_HOST + 'models/svg/tests/testDefs/Wave-defs.svg',
  					'Defs4': ASSET_HOST + 'models/svg/tests/testDefs/defs4.svg',
  					'Defs5': ASSET_HOST + 'models/svg/tests/testDefs/defs5.svg',
  					'Style CSS inside defs': ASSET_HOST + 'models/svg/style-css-inside-defs.svg',
  					'Styled Paths': ASSET_HOST + 'models/svg/styled-paths.svg',
  					'Multiple CSS classes': ASSET_HOST + 'models/svg/multiple-css-classes.svg',
  					'Zero Radius': ASSET_HOST + 'models/svg/zero-radius.svg',
  					'Styles in svg tag': ASSET_HOST + 'models/svg/tests/styles.svg',
  					'Round join': ASSET_HOST + 'models/svg/tests/roundJoinPrecisionIssue.svg',
  					'Ellipse Transformations': ASSET_HOST + 'models/svg/tests/ellipseTransform.svg',
  					'singlePointTest': ASSET_HOST + 'models/svg/singlePointTest.svg',
  					'singlePointTest2': ASSET_HOST + 'models/svg/singlePointTest2.svg',
  					'singlePointTest3': ASSET_HOST + 'models/svg/singlePointTest3.svg',
  					'emptyPath': ASSET_HOST + 'models/svg/emptyPath.svg',
  					'emoji': ASSET_HOST + 'models/svg/emoji.svg',
  					'blueprint': ASSET_HOST + 'models/svg/blueprint.svg',
  					'wideStroke': ASSET_HOST + 'models/svg/tests/wideStroke.svg',
  					'letter': ASSET_HOST + 'models/svg/tests/letter.svg',
  
  				} ).name( 'SVG File' ).onChange( update );
  
  				gui.add( guiData, 'drawStrokes' ).name( 'Draw strokes' ).onChange( update );
  
  				gui.add( guiData, 'drawFillShapes' ).name( 'Draw fill shapes' ).onChange( update );
  
  				gui.add( guiData, 'strokesWireframe' ).name( 'Wireframe strokes' ).onChange( update );
  
  				gui.add( guiData, 'fillShapesWireframe' ).name( 'Wireframe fill shapes' ).onChange( update );
  
  				function update() {
  
  					loadSVG( guiData.currentURL );
  
  				}
  
  			}
  
  			function loadSVG( url ) {
  
  				//
  
  				if ( scene ) disposeScene( scene );
  
  				//
  
  				
  				scene.background = new THREE.Color( 0xb0b0b0 );
  
  				//
  
  				const helper = new THREE.GridHelper( 160, 10, 0x8d8d8d, 0xc1c1c1 );
  				helper.rotation.x = Math.PI / 2;
  				scene.add( helper );
  
  				//
  
  				const loader = new SVGLoader();
  
  				loader.load( url, function ( data ) {
  
  					const group = new THREE.Group();
  					group.scale.multiplyScalar( 0.25 );
  					group.position.x = - 70;
  					group.position.y = 70;
  					group.scale.y *= - 1;
  
  					let renderOrder = 0;
  
  					for ( const path of data.paths ) {
  
  						if ( guiData.drawFillShapes ) {
  
  							const material = SVGLoader.createFillMaterial( path );
  
  							if ( material ) {
  
  								material.wireframe = guiData.fillShapesWireframe;
  
  								const shapes = path.toShapes();
  
  								for ( const shape of shapes ) {
  
  									const geometry = new THREE.ShapeGeometry( shape );
  									const mesh = new THREE.Mesh( geometry, material );
  									mesh.renderOrder = renderOrder ++;
  
  									group.add( mesh );
  
  								}
  
  							}
  
  						}
  
  						if ( guiData.drawStrokes ) {
  
  							const material = SVGLoader.createStrokeMaterial( path );
  
  							if ( material ) {
  
  								material.wireframe = guiData.strokesWireframe;
  
  								for ( const subPath of path.subPaths ) {
  
  									const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );
  
  									if ( geometry ) {
  
  										const mesh = new THREE.Mesh( geometry, material );
  										mesh.renderOrder = renderOrder ++;
  
  										group.add( mesh );
  
  									}
  
  								}
  
  							}
  
  						}
  
  					}
  
  					scene.add( group );
  
  					render();
  
  				} );
  
  			}
  
  			
  
  			function render() {
  
  
  
  			}
  
  			function disposeScene( scene ) {
  
  				scene.traverse( function ( object ) {
  
  					if ( object.isMesh || object.isLine ) {
  
  						object.geometry.dispose();
  						if ( object.material.map ) object.material.map.dispose();
  						object.material.dispose();
  
  					}
  
  				} );
  
  			}
  
  		
}
</script>
