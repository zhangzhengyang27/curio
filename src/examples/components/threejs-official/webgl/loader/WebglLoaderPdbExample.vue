<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 1, far: 5000 }"
    css-renderer="css2d"
    :enable-controls="false"
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
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js webgl</a> - molecules"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			let labelRenderer;
  
  
  
  
  			const MOLECULES = {
  				'Ethanol': 'ethanol.pdb',
  				'Aspirin': 'aspirin.pdb',
  				'Caffeine': 'caffeine.pdb',
  				'Nicotine': 'nicotine.pdb',
  				'LSD': 'lsd.pdb',
  				'Cocaine': 'cocaine.pdb',
  				'Cholesterol': 'cholesterol.pdb',
  				'Lycopene': 'lycopene.pdb',
  				'Glucose': 'glucose.pdb',
  				'Aluminium oxide': 'Al2O3.pdb',
  				'Cubane': 'cubane.pdb',
  				'Copper': 'cu.pdb',
  				'Fluorite': 'caf2.pdb',
  				'Salt': 'nacl.pdb',
  				'YBCO superconductor': 'ybco.pdb',
  				'Buckyball': 'buckyball.pdb',
  				'Graphite': 'graphite.pdb'
  			};
  
  			const params = {
  				molecule: 'caffeine.pdb'
  			};
  
  			const loader = new PDBLoader();
  			const offset = new THREE.Vector3();
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  
  				
  				camera.position.z = 1000;
  				scene.add( camera );
  
  				const light1 = new THREE.DirectionalLight( 0xffffff, 2.5 );
  				light1.position.set( 1, 1, 1 );
  				scene.add( light1 );
  
  				const light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
  				light2.position.set( - 1, - 1, 1 );
  				scene.add( light2 );
  
  				root = new THREE.Group();
  				scene.add( root );
  
  				//
  
  				
  
  
  				labelRenderer = new CSS2DRenderer();
  				labelRenderer.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				labelRenderer.domElement.style.position = 'absolute';
  				labelRenderer.domElement.style.top = '0px';
  				labelRenderer.domElement.style.pointerEvents = 'none';
  				document.getElementById( 'container' ).appendChild( labelRenderer.domElement );
  
  				//
  
  				
  				controls.minDistance = 500;
  				controls.maxDistance = 2000;
  
  				//
  
  				loadMolecule( params.molecule );
  
  				//
  
  				
  
  				//
  
  				gui = new GUI();
  
  				gui.add( params, 'molecule', MOLECULES ).onChange( loadMolecule );
  				gui.open();
  
  			
  
  
  			//
  
  			function loadMolecule( model ) {
  
  				const url = ASSET_HOST + 'models/pdb/' + model;
  
  				while ( root.children.length > 0 ) {
  
  					const object = root.children[ 0 ];
  					object.parent.remove( object );
  
  				}
  
  				loader.load( url, function ( pdb ) {
  
  					const geometryAtoms = pdb.geometryAtoms;
  					const geometryBonds = pdb.geometryBonds;
  					const json = pdb.json;
  
  					const boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
  					const sphereGeometry = new THREE.IcosahedronGeometry( 1, 3 );
  
  					geometryAtoms.computeBoundingBox();
  					geometryAtoms.boundingBox.getCenter( offset ).negate();
  
  					geometryAtoms.translate( offset.x, offset.y, offset.z );
  					geometryBonds.translate( offset.x, offset.y, offset.z );
  
  					let positions = geometryAtoms.getAttribute( 'position' );
  					const colors = geometryAtoms.getAttribute( 'color' );
  
  					const position = new THREE.Vector3();
  					const color = new THREE.Color();
  
  					for ( let i = 0; i < positions.count; i ++ ) {
  
  						position.x = positions.getX( i );
  						position.y = positions.getY( i );
  						position.z = positions.getZ( i );
  
  						color.r = colors.getX( i );
  						color.g = colors.getY( i );
  						color.b = colors.getZ( i );
  
  						const material = new THREE.MeshPhongMaterial( { color: color } );
  
  						const object = new THREE.Mesh( sphereGeometry, material );
  						object.position.copy( position );
  						object.position.multiplyScalar( 75 );
  						object.scale.multiplyScalar( 25 );
  						root.add( object );
  
  						const atom = json.atoms[ i ];
  
  						const text = document.createElement( 'div' );
  						text.className = 'label';
  						text.style.color = 'rgb(' + atom[ 3 ][ 0 ] + ',' + atom[ 3 ][ 1 ] + ',' + atom[ 3 ][ 2 ] + ')';
  						text.textContent = atom[ 4 ];
  
  						const label = new CSS2DObject( text );
  						label.position.copy( object.position );
  						root.add( label );
  
  					}
  
  					positions = geometryBonds.getAttribute( 'position' );
  
  					const start = new THREE.Vector3();
  					const end = new THREE.Vector3();
  
  					for ( let i = 0; i < positions.count; i += 2 ) {
  
  						start.x = positions.getX( i );
  						start.y = positions.getY( i );
  						start.z = positions.getZ( i );
  
  						end.x = positions.getX( i + 1 );
  						end.y = positions.getY( i + 1 );
  						end.z = positions.getZ( i + 1 );
  
  						start.multiplyScalar( 75 );
  						end.multiplyScalar( 75 );
  
  						const object = new THREE.Mesh( boxGeometry, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
  						object.position.copy( start );
  						object.position.lerp( end, 0.5 );
  						object.scale.set( 5, 5, start.distanceTo( end ) );
  						object.lookAt( end );
  						root.add( object );
  
  					}
  
  				} );
  
  			}
  
  			//
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.0004;
    				root.rotation.x = time;
    				root.rotation.y = time * 0.7;
    {
    labelRenderer.render( scene, camera );
    }
  })
  
  			function render() {
  
  
  				labelRenderer.render( scene, camera );
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
