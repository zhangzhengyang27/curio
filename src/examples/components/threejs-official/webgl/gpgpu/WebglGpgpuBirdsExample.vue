<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 1, far: 3000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl gpgpu birds<br/>\n\t\t\tMove mouse to disturb birds."

const velocityShader = /* glsl */`
  uniform float time;
  uniform float testing;
  uniform float delta;
  uniform float separationDistance;
  uniform float alignmentDistance;
  uniform float cohesionDistance;
  uniform float freedomFactor;
  uniform vec3 predator;

  const float width = resolution.x;
  const float height = resolution.y;

  const float PI = 3.141592653589793;
  const float PI_2 = PI * 2.0;

  float zoneRadius = 40.0;
  float zoneRadiusSquared = 1600.0;

  float separationThresh = 0.45;
  float alignmentThresh = 0.65;

  const float UPPER_BOUNDS = BOUNDS;
  const float LOWER_BOUNDS = -UPPER_BOUNDS;

  const float SPEED_LIMIT = 9.0;

  float rand( vec2 co ) {
    return fract( sin( dot( co.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
  }

  void main() {
    zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
    separationThresh = separationDistance / zoneRadius;
    alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
    zoneRadiusSquared = zoneRadius * zoneRadius;

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 birdPosition, birdVelocity;

    vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
    vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

    float dist;
    vec3 dir;
    float distSquared;

    float separationSquared = separationDistance * separationDistance;
    float cohesionSquared = cohesionDistance * cohesionDistance;

    float f;
    float percent;

    vec3 velocity = selfVelocity;

    float limit = SPEED_LIMIT;

    dir = predator * UPPER_BOUNDS - selfPosition;
    dir.z = 0.;
    dist = length( dir );
    if ( dist < 150.0 ) {
      f = 1.0 - dist / 150.0;
      f = pow( f, 2.0 );
      velocity += normalize( dir ) * f * 2.0;
      limit = SPEED_LIMIT * 2.0;
    }

    vec3 separation = vec3( 0.0 );
    vec3 alignment = vec3( 0.0 );
    vec3 cohesion = vec3( 0.0 );

    float count = 0.0;

    for ( float y = 0.0; y < height; y++ ) {
      for ( float x = 0.0; x < width; x++ ) {
        vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
        birdPosition = texture2D( texturePosition, ref ).xyz;
        dir = birdPosition - selfPosition;
        dist = length( dir );
        if ( dist < 0.0001 ) continue;
        distSquared = dist * dist;
        if ( distSquared > zoneRadiusSquared ) continue;
        percent = distSquared / zoneRadiusSquared;
        if ( percent < separationSquared ) {
          f = ( separationSquared - percent ) / separationSquared;
          separation -= dir * f;
        } else if ( percent < alignmentThresh ) {
          f = ( alignmentThresh - percent ) / ( alignmentThresh - separationSquared );
          birdVelocity = texture2D( textureVelocity, ref ).xyz;
          alignment += birdVelocity * f;
        } else {
          f = ( 1.0 - percent ) / ( 1.0 - alignmentThresh );
          cohesion += birdPosition * f;
        }
        count++;
      }
    }

    if ( count > 0.0 ) {
      separation /= count;
      alignment /= count;
      cohesion = ( cohesion / count ) - selfPosition;
    }

    velocity += separation * 1.0;
    velocity += alignment * 1.0;
    velocity += cohesion * 0.5;
    velocity += ( normalize( vec3( sin( time * 0.1 ), cos( time * 0.05 ), sin( time * 0.07 ) ) ) * 0.1 ) * freedomFactor;

    if ( length( velocity ) > limit ) {
      velocity = normalize( velocity ) * limit;
    }

    gl_FragColor = vec4( velocity, 1.0 );
  }
`;

const positionShader = /* glsl */`
  uniform float time;
  uniform float delta;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;
    vec3 vel = normalize( texture2D( textureVelocity, uv ).xyz );

    vec4 tmpVel = texture2D( textureVelocity, uv );
    pos += vel * tmpVel.xyz * delta;

    if ( pos.x < -bounds || pos.x > bounds ) {
      pos.x = -pos.x;
    }
    if ( pos.y < -bounds || pos.y > bounds ) {
      pos.y = -pos.y;
    }
    if ( pos.z < -bounds || pos.z > bounds ) {
      pos.z = -pos.z;
    }

    gl_FragColor = vec4( pos, 1.0 );
  }
`;

const birdVertexShader = /* glsl */`
  attribute vec2 reference;
  attribute float birdVertex;

  attribute vec3 birdColor;

  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;

  varying vec4 vColor;
  varying float z;

  uniform float time;

  void main() {
    vec4 tmpPos = texture2D( texturePosition, reference );
    vec3 pos = tmpPos.xyz;
    vec3 velocity = normalize( texture2D( textureVelocity, reference ).xyz );

    vec3 newPosition = position;

    if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
      newPosition.y = sin( time * 10.0 ) * 5.0;
    }

    newPosition = mat3( modelMatrix ) * newPosition;

    velocity.z *= -1.;
    float xz = length( velocity.xz );
    float xyz = 1.;
    float x = sqrt( 1. - velocity.y * velocity.y );

    float cosry = velocity.x / xz;
    float sinry = velocity.z / xz;

    float cosrz = x / xyz;
    float sinrz = velocity.y / xyz;

    mat3 maty = mat3(
      cosry, 0, -sinry,
      0    , 1, 0     ,
      sinry, 0, cosry
    );

    mat3 matz = mat3(
      cosrz , sinrz, 0,
      -sinrz, cosrz, 0,
      0     , 0    , 1
    );

    newPosition = maty * matz * newPosition;
    newPosition += pos;

    z = newPosition.z;

    vColor = vec4( birdColor, 1.0 );
    gl_Position = projectionMatrix * viewMatrix * vec4( newPosition, 1.0 );
  }
`;

const birdFragmentShader = /* glsl */`
  varying vec4 vColor;
  varying float z;

  uniform vec3 color;

  void main() {
    float d = 1.0 - smoothstep( - 200.0, 200.0, z );
    gl_FragColor = vec4( vColor.rgb * d, 1.0 );
  }
`;

function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  let gpuCompute: any;
  let velocityUniforms: any;
  let birdUniforms: any;

  
  
  
  
  
  			/* TEXTURE WIDTH FOR SIMULATION */
  			const WIDTH = 32;
  
  			const BIRDS = WIDTH * WIDTH;
  
  			// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
  			class BirdGeometry extends THREE.BufferGeometry {
  
  				constructor() {
  
  					super();
  
  					const trianglesPerBird = 3;
  					const triangles = BIRDS * trianglesPerBird;
  					const points = triangles * 3;
  
  					const vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
  					const birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
  					const references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
  					const birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 );
  
  					this.setAttribute( 'position', vertices );
  					this.setAttribute( 'birdColor', birdColors );
  					this.setAttribute( 'reference', references );
  					this.setAttribute( 'birdVertex', birdVertex );
  
  					// this.setAttribute( 'normal', new Float32Array( points * 3 ), 3 );
  
  
  					let v = 0;
  
  					function verts_push( ..._args: any[] ) {
  
  						for ( let i = 0; i < arguments.length; i ++ ) {
  
  							vertices.array[ v ++ ] = arguments[ i ];
  
  						}
  
  					}
  
  					const wingsSpan = 20;
  
  					for ( let f = 0; f < BIRDS; f ++ ) {
  
  						// Body
  
  						verts_push(
  							0, - 0, - 20,
  							0, 4, - 20,
  							0, 0, 30
  						);
  
  						// Wings
  
  						verts_push(
  							0, 0, - 15,
  							- wingsSpan, 0, 0,
  							0, 0, 15
  						);
  
  						verts_push(
  							0, 0, 15,
  							wingsSpan, 0, 0,
  							0, 0, - 15
  						);
  
  					}
  
  					for ( let v = 0; v < triangles * 3; v ++ ) {
  
  						const triangleIndex = ~ ~ ( v / 3 );
  						const birdIndex = ~ ~ ( triangleIndex / trianglesPerBird );
  						const x = ( birdIndex % WIDTH ) / WIDTH;
  						const y = ~ ~ ( birdIndex / WIDTH ) / WIDTH;
  
  						const c = new THREE.Color(
  							0x666666 +
  							~ ~ ( v / 9 ) / BIRDS * 0x666666
  						);
  
  						birdColors.array[ v * 3 + 0 ] = c.r;
  						birdColors.array[ v * 3 + 1 ] = c.g;
  						birdColors.array[ v * 3 + 2 ] = c.b;
  
  						references.array[ v * 2 ] = x;
  						references.array[ v * 2 + 1 ] = y;
  
  						birdVertex.array[ v ] = v % 9;
  
  					}
  
  					this.scale( 0.2, 0.2, 0.2 );
  
  				}
  
  			}
  
  			//
  
  			let container, stats;
  			container = __stage.container;
  
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			const BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2;
  
  			let last = performance.now();
  
  
  			let velocityVariable: any;
  			let positionVariable: any;
  			let positionUniforms: any;
  
  
  
  			
  
  
  				
  				camera.position.z = 350;
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  				scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
  
  				
  
  
  				initComputeRenderer();
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				container.style.touchAction = 'none';
  				container.addEventListener( 'pointermove', onPointerMove );
  
  				//
  
  				
  
  				gui = new GUI();
  
  
  				const effectController = {
  					separation: 20.0,
  					alignment: 20.0,
  					cohesion: 20.0,
  					freedom: 0.75
  				};
  
  				const valuesChanger = function () {
  
  					velocityUniforms[ 'separationDistance' ].value = effectController.separation;
  					velocityUniforms[ 'alignmentDistance' ].value = effectController.alignment;
  					velocityUniforms[ 'cohesionDistance' ].value = effectController.cohesion;
  					velocityUniforms[ 'freedomFactor' ].value = effectController.freedom;
  
  				};
  
  				valuesChanger();
  
  				gui.add( effectController, 'separation', 0.0, 100.0, 1.0 ).onChange( valuesChanger );
  				gui.add( effectController, 'alignment', 0.0, 100, 0.001 ).onChange( valuesChanger );
  				gui.add( effectController, 'cohesion', 0.0, 100, 0.025 ).onChange( valuesChanger );
  				gui.close();
  
  				initBirds();
  
  			
  
  
  			function initComputeRenderer() {
  
  				gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );
  
  				const dtPosition = gpuCompute.createTexture();
  				const dtVelocity = gpuCompute.createTexture();
  				fillPositionTexture( dtPosition );
  				fillVelocityTexture( dtVelocity );
  
  				velocityVariable = gpuCompute.addVariable( 'textureVelocity', velocityShader, dtVelocity );
  				positionVariable = gpuCompute.addVariable( 'texturePosition', positionShader, dtPosition );
  
  				gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
  				gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
  
  				positionUniforms = positionVariable.material.uniforms;
  				velocityUniforms = velocityVariable.material.uniforms;
  
  				positionUniforms[ 'time' ] = { value: 0.0 };
  				positionUniforms[ 'delta' ] = { value: 0.0 };
  				velocityUniforms[ 'time' ] = { value: 1.0 };
  				velocityUniforms[ 'delta' ] = { value: 0.0 };
  				velocityUniforms[ 'testing' ] = { value: 1.0 };
  				velocityUniforms[ 'separationDistance' ] = { value: 1.0 };
  				velocityUniforms[ 'alignmentDistance' ] = { value: 1.0 };
  				velocityUniforms[ 'cohesionDistance' ] = { value: 1.0 };
  				velocityUniforms[ 'freedomFactor' ] = { value: 1.0 };
  				velocityUniforms[ 'predator' ] = { value: new THREE.Vector3() };
  				velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 );
  
  				velocityVariable.wrapS = THREE.RepeatWrapping;
  				velocityVariable.wrapT = THREE.RepeatWrapping;
  				positionVariable.wrapS = THREE.RepeatWrapping;
  				positionVariable.wrapT = THREE.RepeatWrapping;
  
  				const error = gpuCompute.init();
  
  				if ( error !== null ) {
  
  					console.error( error );
  
  				}
  
  			}
  
  			function initBirds() {
  
  				const geometry = new BirdGeometry();
  
  				// For Vertex and Fragment
  				birdUniforms = {
  					'color': { value: new THREE.Color( 0xff2200 ) },
  					'texturePosition': { value: null },
  					'textureVelocity': { value: null },
  					'time': { value: 1.0 },
  					'delta': { value: 0.0 }
  				};
  
  				// THREE.ShaderMaterial
  				const material = new THREE.ShaderMaterial( {
  					uniforms: birdUniforms,
  					vertexShader: birdVertexShader,
  					fragmentShader: birdFragmentShader,
  					side: THREE.DoubleSide
  
  				} );
  
  				const birdMesh = new THREE.Mesh( geometry, material );
  				birdMesh.rotation.y = Math.PI / 2;
  				birdMesh.matrixAutoUpdate = false;
  				birdMesh.updateMatrix();
  
  				scene.add( birdMesh );
  
  			}
  
  			function fillPositionTexture( texture: any ) {
  
  				const theArray = texture.image.data;
  
  				for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {
  
  					const x = Math.random() * BOUNDS - BOUNDS_HALF;
  					const y = Math.random() * BOUNDS - BOUNDS_HALF;
  					const z = Math.random() * BOUNDS - BOUNDS_HALF;
  
  					theArray[ k + 0 ] = x;
  					theArray[ k + 1 ] = y;
  					theArray[ k + 2 ] = z;
  					theArray[ k + 3 ] = 1;
  
  				}
  
  			}
  
  			function fillVelocityTexture( texture: any ) {
  
  				const theArray = texture.image.data;
  
  				for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {
  
  					const x = Math.random() - 0.5;
  					const y = Math.random() - 0.5;
  					const z = Math.random() - 0.5;
  
  					theArray[ k + 0 ] = x * 10;
  					theArray[ k + 1 ] = y * 10;
  					theArray[ k + 2 ] = z * 10;
  					theArray[ k + 3 ] = 1;
  
  				}
  
  			}
  
  			
  
  			function onPointerMove( event: any ) {
  
  				if ( event.isPrimary === false ) return;
  
  				mouseX = event.clientX - windowHalfX;
  				mouseY = event.clientY - windowHalfY;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    const now = performance.now();
    				let delta = ( now - last ) / 1000;
    				if ( delta > 1 ) delta = 1; // safety cap on large deltas
    				last = now;
    				positionUniforms[ 'time' ].value = now;
    				positionUniforms[ 'delta' ].value = delta;
    				velocityUniforms[ 'time' ].value = now;
    				velocityUniforms[ 'delta' ].value = delta;
    				birdUniforms[ 'time' ].value = now;
    				birdUniforms[ 'delta' ].value = delta;
    				velocityUniforms[ 'predator' ].value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 );
    				mouseX = 10000;
    				mouseY = 10000;
    				gpuCompute.compute();
    				birdUniforms[ 'texturePosition' ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
    				birdUniforms[ 'textureVelocity' ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const now = performance.now();
  				let delta = ( now - last ) / 1000;
  
  				if ( delta > 1 ) delta = 1; // safety cap on large deltas
  				last = now;
  
  				positionUniforms[ 'time' ].value = now;
  				positionUniforms[ 'delta' ].value = delta;
  				velocityUniforms[ 'time' ].value = now;
  				velocityUniforms[ 'delta' ].value = delta;
  				birdUniforms[ 'time' ].value = now;
  				birdUniforms[ 'delta' ].value = delta;
  
  				velocityUniforms[ 'predator' ].value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 );
  
  				mouseX = 10000;
  				mouseY = 10000;
  
  				gpuCompute.compute();
  
  				birdUniforms[ 'texturePosition' ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
  				birdUniforms[ 'textureVelocity' ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
