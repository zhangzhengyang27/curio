<template>
  <CSS3DExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 5000 }"
    :enable-controls="false"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </CSS3DExampleScene>
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import CSS3DExampleScene from '@/examples/components/CSS3DExampleScene.vue'
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> css3d - molecules"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  let controls;
  
  
  
  			let root;
  
  			const objects = [];
  			const tmpVec1 = new THREE.Vector3();
  			const tmpVec2 = new THREE.Vector3();
  			const tmpVec3 = new THREE.Vector3();
  			const tmpVec4 = new THREE.Vector3();
  			const offset = new THREE.Vector3();
  
  			const VIZ_TYPE = {
  				'Atoms': 0,
  				'Bonds': 1,
  				'Atoms + Bonds': 2
  			};
  
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
  				// 'Diamond': 'diamond.pdb',
  				'Graphite': 'graphite.pdb'
  			};
  
  			const params = {
  				vizType: 2,
  				molecule: 'caffeine.pdb'
  			};
  
  			const loader = new PDBLoader();
  			const colorSpriteMap = {};
  			const baseSprite = document.createElement( 'img' );
  
  			init();
  
  			function init() {
  
  				
  				camera.position.z = 1000;
  
  				
  
  				root = new THREE.Object3D();
  				scene.add( root );
  
  				//
  
  				
  
  
  
  				//
  
  				controls = new TrackballControls( camera, renderer.domElement );
				controls.rotateSpeed = 0.5;
  
  				//
  
  				baseSprite.onload = function () {
  
  					loadMolecule( params.molecule );
  
  				};
  
  				baseSprite.src = ASSET_HOST + 'textures/sprites/ball.png';
  
  				//
  
  				
  
  				//
  
  				gui = new GUI();
  
  				gui.add( params, 'vizType', VIZ_TYPE ).onChange( changeVizType );
  				gui.add( params, 'molecule', MOLECULES ).onChange( loadMolecule );
  				gui.open();
  
  			}
  
  			function changeVizType( value ) {
  
  				if ( value === 0 ) showAtoms();
  				else if ( value === 1 ) showBonds();
  				else showAtomsBonds();
  
  			}
  
  			//
  
  			function showAtoms() {
  
  				for ( let i = 0; i < objects.length; i ++ ) {
  
  					const object = objects[ i ];
  
  					if ( object instanceof CSS3DSprite ) {
  
  						object.element.style.display = '';
  						object.visible = true;
  
  					} else {
  
  						object.element.style.display = 'none';
  						object.visible = false;
  
  					}
  
  				}
  
  			}
  
  			function showBonds() {
  
  				for ( let i = 0; i < objects.length; i ++ ) {
  
  					const object = objects[ i ];
  
  					if ( object instanceof CSS3DSprite ) {
  
  						object.element.style.display = 'none';
  						object.visible = false;
  
  					} else {
  
  						object.element.style.display = '';
  						object.element.style.height = object.userData.bondLengthFull;
  						object.visible = true;
  
  					}
  
  				}
  
  			}
  
  			function showAtomsBonds() {
  
  				for ( let i = 0; i < objects.length; i ++ ) {
  
  					const object = objects[ i ];
  
  					object.element.style.display = '';
  					object.visible = true;
  
  					if ( ! ( object instanceof CSS3DSprite ) ) {
  
  						object.element.style.height = object.userData.bondLengthShort;
  
  					}
  
  				}
  
  			}
  
  			//
  
  			function colorify( ctx, width, height, color ) {
  
  				const r = color.r, g = color.g, b = color.b;
  
  				const imageData = ctx.getImageData( 0, 0, width, height );
  				const data = imageData.data;
  
  				for ( let i = 0, l = data.length; i < l; i += 4 ) {
  
  					data[ i + 0 ] *= r;
  					data[ i + 1 ] *= g;
  					data[ i + 2 ] *= b;
  
  				}
  
  				ctx.putImageData( imageData, 0, 0 );
  
  			}
  
  			function imageToCanvas( image ) {
  
  				const width = image.width;
  				const height = image.height;
  
  				const canvas = document.createElement( 'canvas' );
  
  				canvas.width = width;
  				canvas.height = height;
  
  				const context = canvas.getContext( '2d' );
  				context.drawImage( image, 0, 0, width, height );
  
  				return canvas;
  
  			}
  
  			//
  
  			function loadMolecule( model ) {
  
  				const url = ASSET_HOST + 'models/pdb/' + model;
  
  				for ( let i = 0; i < objects.length; i ++ ) {
  
  					const object = objects[ i ];
  					object.parent.remove( object );
  
  				}
  
  				objects.length = 0;
  
  				loader.load( url, function ( pdb ) {
  
  					const geometryAtoms = pdb.geometryAtoms;
  					const geometryBonds = pdb.geometryBonds;
  					const json = pdb.json;
  
  					geometryAtoms.computeBoundingBox();
  					geometryAtoms.boundingBox.getCenter( offset ).negate();
  
  					geometryAtoms.translate( offset.x, offset.y, offset.z );
  					geometryBonds.translate( offset.x, offset.y, offset.z );
  
  					const positionAtoms = geometryAtoms.getAttribute( 'position' );
  					const colorAtoms = geometryAtoms.getAttribute( 'color' );
  
  					const position = new THREE.Vector3();
  					const color = new THREE.Color();
  
  					for ( let i = 0; i < positionAtoms.count; i ++ ) {
  
  						position.fromBufferAttribute( positionAtoms, i );
  						color.fromBufferAttribute( colorAtoms, i );
  
  						const atomJSON = json.atoms[ i ];
  						const element = atomJSON[ 4 ];
  
  						if ( ! colorSpriteMap[ element ] ) {
  
  							const canvas = imageToCanvas( baseSprite );
  							const context = canvas.getContext( '2d' );
  
  							colorify( context, canvas.width, canvas.height, color );
  
  							const dataUrl = canvas.toDataURL();
  
  							colorSpriteMap[ element ] = dataUrl;
  
  						}
  
  						const colorSprite = colorSpriteMap[ element ];
  
  						const atom = document.createElement( 'img' );
  						atom.src = colorSprite;
  
  						const object = new CSS3DSprite( atom );
  						object.position.copy( position );
  						object.position.multiplyScalar( 75 );
  
  						object.matrixAutoUpdate = false;
  						object.updateMatrix();
  
  						root.add( object );
  
  						objects.push( object );
  
  					}
  
  					const positionBonds = geometryBonds.getAttribute( 'position' );
  
  					const start = new THREE.Vector3();
  					const end = new THREE.Vector3();
  
  					for ( let i = 0; i < positionBonds.count; i += 2 ) {
  
  						start.fromBufferAttribute( positionBonds, i );
  						end.fromBufferAttribute( positionBonds, i + 1 );
  
  						start.multiplyScalar( 75 );
  						end.multiplyScalar( 75 );
  
  						tmpVec1.subVectors( end, start );
  						const bondLength = tmpVec1.length() - 50;
  
  						//
  
  						let bond = document.createElement( 'div' );
  						bond.className = 'bond';
  						bond.style.height = bondLength + 'px';
  
  						let object = new CSS3DObject( bond );
  						object.position.copy( start );
  						object.position.lerp( end, 0.5 );
  
  						object.userData.bondLengthShort = bondLength + 'px';
  						object.userData.bondLengthFull = ( bondLength + 55 ) + 'px';
  
  						//
  
  						const axis = tmpVec2.set( 0, 1, 0 ).cross( tmpVec1 );
  						const radians = Math.acos( tmpVec3.set( 0, 1, 0 ).dot( tmpVec4.copy( tmpVec1 ).normalize() ) );
  
  						const objMatrix = new THREE.Matrix4().makeRotationAxis( axis.normalize(), radians );
  						object.matrix.copy( objMatrix );
  						object.quaternion.setFromRotationMatrix( object.matrix );
  
  						object.matrixAutoUpdate = false;
  						object.updateMatrix();
  
  						root.add( object );
  
  						objects.push( object );
  
  						//
  
  						const joint = new THREE.Object3D();
  						joint.position.copy( start );
  						joint.position.lerp( end, 0.5 );
  
  						joint.matrix.copy( objMatrix );
  						joint.quaternion.setFromRotationMatrix( joint.matrix );
  
  						joint.matrixAutoUpdate = false;
  						joint.updateMatrix();
  
  						bond = document.createElement( 'div' );
  						bond.className = 'bond';
  						bond.style.height = bondLength + 'px';
  
  						object = new CSS3DObject( bond );
  						object.rotation.y = Math.PI / 2;
  
  						object.matrixAutoUpdate = false;
  						object.updateMatrix();
  
  						object.userData.bondLengthShort = bondLength + 'px';
  						object.userData.bondLengthFull = ( bondLength + 55 ) + 'px';
  
  						object.userData.joint = joint;
  
  						joint.add( object );
  						root.add( joint );
  
  						objects.push( object );
  
  					}
  
  					//console.log( "CSS3DObjects:", objects.length );
  
  					changeVizType( params.vizType );
  
  				} );
  
  
  			}
  
  			//
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.0004;
    				root.rotation.x = time;
    				root.rotation.y = time * 0.7;
    				render();
  })
  
  			function render() {
  
  
  
  			}
  
      
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
