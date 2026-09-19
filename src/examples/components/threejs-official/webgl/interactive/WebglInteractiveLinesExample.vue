<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 1, far: 10000 }"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container: any, stats: any;
  			let raycaster: any, parentTransform: any, sphereInter: any;
  
  			const pointer = new THREE.Vector2();
  			const radius = 100;
  			let theta = 0;
  
  			
  
  
  				const info = document.createElement( 'div' );
  				info.style.position = 'absolute';
  				info.style.top = '10px';
  				info.style.width = '100%';
  				info.style.textAlign = 'center';
  				info.innerHTML = '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> webgl - interactive lines';
  				container.appendChild( info );
  
  				
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				const geometry = new THREE.SphereGeometry( 5 );
  				const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  
  				sphereInter = new THREE.Mesh( geometry, material );
  				sphereInter.visible = false;
  				scene.add( sphereInter );
  
  				const lineGeometry = new THREE.BufferGeometry();
  				const points = [];
  
  				const point = new THREE.Vector3();
  				const direction = new THREE.Vector3();
  
  				for ( let i = 0; i < 50; i ++ ) {
  
  					direction.x += Math.random() - 0.5;
  					direction.y += Math.random() - 0.5;
  					direction.z += Math.random() - 0.5;
  					direction.normalize().multiplyScalar( 10 );
  
  					point.add( direction );
  					points.push( point.x, point.y, point.z );
  
  				}
  
  				lineGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( points, 3 ) );
  
  				parentTransform = new THREE.Object3D();
  				parentTransform.position.x = Math.random() * 40 - 20;
  				parentTransform.position.y = Math.random() * 40 - 20;
  				parentTransform.position.z = Math.random() * 40 - 20;
  
  				parentTransform.rotation.x = Math.random() * 2 * Math.PI;
  				parentTransform.rotation.y = Math.random() * 2 * Math.PI;
  				parentTransform.rotation.z = Math.random() * 2 * Math.PI;
  
  				parentTransform.scale.x = Math.random() + 0.5;
  				parentTransform.scale.y = Math.random() + 0.5;
  				parentTransform.scale.z = Math.random() + 0.5;
  
  				for ( let i = 0; i < 50; i ++ ) {
  
  					let object;
  
  					const lineMaterial = new THREE.LineBasicMaterial( { color: Math.random() * 0xffffff } );
  
  					if ( Math.random() > 0.5 ) {
  
  						object = new THREE.Line( lineGeometry, lineMaterial );
  
  					} else {
  
  						object = new THREE.LineSegments( lineGeometry, lineMaterial );
  
  					}
  
  					object.position.x = Math.random() * 400 - 200;
  					object.position.y = Math.random() * 400 - 200;
  					object.position.z = Math.random() * 400 - 200;
  
  					object.rotation.x = Math.random() * 2 * Math.PI;
  					object.rotation.y = Math.random() * 2 * Math.PI;
  					object.rotation.z = Math.random() * 2 * Math.PI;
  
  					object.scale.x = Math.random() + 0.5;
  					object.scale.y = Math.random() + 0.5;
  					object.scale.z = Math.random() + 0.5;
  
  					parentTransform.add( object );
  
  				}
  
  				scene.add( parentTransform );
  
  				raycaster = new THREE.Raycaster();
  				raycaster.params.Line.threshold = 3;
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				document.addEventListener( 'pointermove', onPointerMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onPointerMove( event: any ) {
  
  				pointer.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				pointer.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    theta += 0.1;
    				camera.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
    				camera.position.y = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
    				camera.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta ) );
    				camera.updateMatrixWorld();
    				// find intersections
    				raycaster.setFromCamera( pointer, camera );
    				const intersects = raycaster.intersectObjects( parentTransform.children, true );
    				if ( intersects.length > 0 ) {
    					sphereInter.visible = true;
    					sphereInter.position.copy( intersects[ 0 ].point );
    				} else {
    					sphereInter.visible = false;
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				theta += 0.1;
  
  				camera.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
  				camera.position.y = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
  				camera.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta ) );
  
  
  				camera.updateMatrixWorld();
  
  				// find intersections
  
  				raycaster.setFromCamera( pointer, camera );
  
  				const intersects = raycaster.intersectObjects( parentTransform.children, true );
  
  				if ( intersects.length > 0 ) {
  
  					sphereInter.visible = true;
  					sphereInter.position.copy( intersects[ 0 ].point );
  
  				} else {
  
  					sphereInter.visible = false;
  
  				}
  
  
  
  			}
  
  		
}
</script>
