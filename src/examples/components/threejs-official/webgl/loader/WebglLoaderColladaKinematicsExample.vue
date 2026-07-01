<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[2, 2, 3]"
    :camera-look-at="[0, 5, 0]"
    :camera-options="{ fov: 45, near: 1, far: 2000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> collada loader - kinematics<br/>\n\t\t\trobot from <a href=\"https://github.com/rdiankov/collada_robots\" target=\"_blank\" rel=\"noopener\">collada robots</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  			let dae;
  
  
  			let kinematicsTween;
  			const tweenParameters = {};
  
  			const loader = new ColladaLoader();
  			loader.load( './models/collada/abb_irb52_7_120.dae', function ( collada ) {
  
  				dae = collada.scene;
  
  				dae.scale.x = dae.scale.y = dae.scale.z = 10.0;
  				dae.updateMatrix();
  
  				kinematics = collada.kinematics;
  
  				
  			} );
  
  			
  
  
  				
  
  
  				
  
  				// Grid
  
  				const grid = new THREE.GridHelper( 20, 20, 0xc1c1c1, 0x8d8d8d );
  				scene.add( grid );
  
  				// Add the COLLADA
  
  				scene.add( dae );
  
  				// Lights
  
  				const light = new THREE.HemisphereLight( 0xfff7f7, 0x494966, 3 );
  				scene.add( light );
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				setupTween();
  
  				//
  
  				
  
  			
  
  
  			function setupTween() {
  
  				const duration = THREE.MathUtils.randInt( 1000, 5000 );
  
  				const target = {};
  
  				for ( const prop in kinematics.joints ) {
  
  					if ( kinematics.joints.hasOwnProperty( prop ) ) {
  
  						if ( ! kinematics.joints[ prop ].static ) {
  
  							const joint = kinematics.joints[ prop ];
  
  							const old = tweenParameters[ prop ];
  
  							const position = old ? old : joint.zeroPosition;
  
  							tweenParameters[ prop ] = position;
  
  							target[ prop ] = THREE.MathUtils.randInt( joint.limits.min, joint.limits.max );
  
  						}
  
  					}
  
  				}
  
  				kinematicsTween = new TWEEN.Tween( tweenParameters ).to( target, duration ).easing( TWEEN.Easing.Quadratic.Out );
  
  				kinematicsTween.onUpdate( function ( object ) {
  
  					for ( const prop in kinematics.joints ) {
  
  						if ( kinematics.joints.hasOwnProperty( prop ) ) {
  
  							if ( ! kinematics.joints[ prop ].static ) {
  
  								kinematics.setJointValue( prop, object[ prop ] );
  
  							}
  
  						}
  
  					}
  
  				} );
  
  				kinematicsTween.start();
  
  				setTimeout( setupTween, duration );
  
  			}
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    TWEEN.update();
    {
    const timer = Date.now() * 0.0001;
    				camera.position.x = Math.cos( timer ) * 20;
    				camera.position.y = 10;
    				camera.position.z = Math.sin( timer ) * 20;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const timer = Date.now() * 0.0001;
  
  				camera.position.x = Math.cos( timer ) * 20;
  				camera.position.y = 10;
  				camera.position.z = Math.sin( timer ) * 20;
  
  
  
  
  
  			}
  
  		
}
</script>
