<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-40, 0, 60]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    custom-render
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, storage, Fn, instancedBufferAttribute, instanceIndex, sin, time, float, uniform, shapeCircle, mix, vec3 } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js';

let effectController: any;
let material: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Instanced Points</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let camera2: any, backgroundNode;
  
  
  
  			// viewport
  			let insetWidth: any, insetHeight: any;
  
  
  			// compute
  			let computeSize;
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				
  
  
  				camera2 = new THREE.PerspectiveCamera( 40, 1, 1, 1000 );
  				camera2.position.copy( camera.position );
  
  				backgroundNode = color( 0x222222 );
  
  				effectController = {
  
  					pulseSpeed: uniform( 6 ),
  					minWidth: uniform( 6 ),
  					maxWidth: uniform( 20 )
  
  				};
  
  				// Position and THREE.Color Data
  
  				const points = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );
  
  				const spline = new THREE.CatmullRomCurve3( points );
  				const divisions = Math.round( 4 * points.length );
  				const point = new THREE.Vector3();
  				const pointColor = new THREE.Color();
  
  				const positions = [];
  				const colors = [];
  				const sizes = new Float32Array( divisions );
  
  				for ( let i = 0, l = divisions; i < l; i ++ ) {
  
  					const t = i / l;
  
  					spline.getPoint( t, point );
  					positions.push( point.x, point.y, point.z );
  
  					pointColor.setHSL( t, 1.0, 0.5, THREE.SRGBColorSpace );
  					colors.push( pointColor.r, pointColor.g, pointColor.b );
  
  					sizes[ i ] = 10.0;
  
  				}
  
  				// Instanced Points
  
  				const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );
  				const colorsAttribute = new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 );
  
  				const instanceSizeBufferAttribute = new THREE.StorageInstancedBufferAttribute( sizes, 1 );
  				const instanceSizeStorage = storage( instanceSizeBufferAttribute, 'float', instanceSizeBufferAttribute.count );
  
  				computeSize = Fn( () => {
  
  					const { pulseSpeed, minWidth, maxWidth } = effectController;
  
  					const relativeTime = time.add( float( instanceIndex ) );
  
  					const sizeFactor = sin( relativeTime.mul( pulseSpeed ) ).add( 1 ).div( 2 );
  
  					instanceSizeStorage.element( instanceIndex ).assign( sizeFactor.mul( maxWidth.sub( minWidth ) ).add( minWidth ) );
  
  				} )().compute( divisions );
  			
  				// Material / Sprites
  
  				const attributeRange = instancedBufferAttribute( instanceSizeBufferAttribute );
  				const pointColors = mix( vec3( 0.0 ), (instancedBufferAttribute as any)( colorsAttribute ), (attributeRange as any).div( float( effectController.maxWidth ) ) );
  
  				material = new THREE.PointsNodeMaterial( {
  
  					colorNode: pointColors,
  					opacityNode: shapeCircle(),
  					positionNode: instancedBufferAttribute( positionAttribute ),
  					// rotationNode: time,
  					sizeNode: instancedBufferAttribute( instanceSizeBufferAttribute ),
  					// size: 40, // in pixels units
  					vertexColors: true,
  					sizeAttenuation: false,
  					alphaToCoverage: true
  
  				} );
  
  				const instancedPoints = new THREE.Sprite( material );
  				instancedPoints.count = divisions;
  				scene.add( instancedPoints );
  
  				// Renderer / Controls
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 10;
  				controls.maxDistance = 500;
  
  				
  				onWindowResize();

  				function onWindowResize() {
  					const w = __stage.container?.clientWidth || window.innerWidth
  					const h = __stage.container?.clientHeight || window.innerHeight
  					camera.aspect = w / h
  					camera.updateProjectionMatrix()
  					renderer.setSize( w, h )
  					insetWidth = h / 4 // square
  					insetHeight = h / 4
  					camera2.aspect = insetWidth / insetHeight
  					camera2.updateProjectionMatrix()
  				}

  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( material, 'alphaToCoverage' );
  
  				gui.add( effectController.minWidth, 'value', 1, 30, 1 ).name( 'minWidth' );
  				gui.add( effectController.maxWidth, 'value', 2, 30, 1 ).name( 'maxWidth' );
  				gui.add( effectController.pulseSpeed, 'value', 1, 20, 0.1 ).name( 'pulseSpeed' );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    // compute
    				renderer.compute( computeSize );
    				// main scene
    				renderer.setViewport( 0, 0, (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
    				renderer.autoClear = true;
    				scene.backgroundNode = null;
    				// inset scene
    				const posY = (__stage.container?.clientHeight || window.innerHeight) - insetHeight - 20;
    				renderer.clearDepth(); // important!
    				renderer.setScissorTest( true );
    				renderer.setScissor( 20, posY, insetWidth, insetHeight );
    				renderer.setViewport( 20, posY, insetWidth, insetHeight );
    				camera2.position.copy( camera.position );
    				camera2.quaternion.copy( camera.quaternion );
    				renderer.autoClear = false;
    				scene.backgroundNode = backgroundNode;
    				renderer.render( scene, camera2 );
    				renderer.setScissorTest( false );
  })
  
  			//
  
  		
}
</script>
