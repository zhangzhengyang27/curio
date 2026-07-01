<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 8]"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three';
import gsap from 'gsap';
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  // reference Victor Vergara https://codepen.io/vcomics/pen/KBMyjE
  function init() {
    createWorld();
    createLights();
    createPrimitive();
    createParticleWord();

  }

  var world = new THREE.Object3D();
  var _width, _height;
  function createWorld() {
    _width = window.innerWidth;
    _height= window.innerHeight;
    
    scene.fog = new THREE.Fog(0x000000, 4, 12);
    //scene.background = new THREE.Color(0xF00000);
    
  
    
    renderer.shadowMap.enabled = true;
    
  
    
  }
  function onWindowResize() {
    _width = window.innerWidth;
    _height = window.innerHeight;
    camera.aspect = _width / _height;
    camera.updateProjectionMatrix();
    console.log('- resize -');
  }
  var _ambientLights, _lights;
  function createLights() {
    _ambientLights = new THREE.HemisphereLight(0x111111, 0x000000, 5);
    _lights = new THREE.PointLight(0xF00555, 0.5);
    _lights.position.set(0, 0, 3);
    _lights.castShadow = true;
    scene.add(_ambientLights);
    scene.add(_lights);
  }
  function createParticleWord() {
    var geometry = new THREE.IcosahedronGeometry(0.7, 3);
    var circle_start = 10;

    for (var i = 0; i<120; i++) {
      var material = new THREE.MeshBasicMaterial( {
        color: 0xFFFF
     } );
      var circle = new THREE.Mesh( geometry, material );
      circle.castShadow  = true;
      circle.receivedShadow = true;

      circle.position.x = -Math.random()* circle_start + Math.random()* circle_start;
      circle.position.z = -Math.random()* circle_start + Math.random()* circle_start;
      circle.position.y = -Math.random()* circle_start + Math.random()* circle_start;
      var circle_scale = Math.random()* 1;
      circle.scale.set(circle_scale, circle_scale, circle_scale);

      world.add( circle );
    }
    scene.add(world);
  }
  function primitiveElement() {
    this.mesh = new THREE.Object3D();
    var geo = new THREE.IcosahedronGeometry();
    var mat = new THREE.MeshBasicMaterial({color:0x500000});
    var mesh = new THREE.Mesh(geo, mat);
  
    //this.mesh.add(mesh);
  }
  var _primitive;
  function createPrimitive() {
    _primitive = new primitiveElement();
    _primitive.mesh.scale.set(1,1,1);
    scene.add(_primitive.mesh);
  }
  function createGrid() {
    var gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
  }

  init();

  ctx.addUpdateCallback(() => {
    var time = Date.now() * 0.003;
      _primitive.mesh.rotation.y += 0.003;
      world.rotation.y = Math.sin(time) * Math.PI / 180;
      world.rotation.z = Math.cos(time) * Math.PI / 180;
      var object_place = world.children[ 0 ];
      object_place.visible = false;
      for ( let i = 0, l = world.children.length; i < l; i ++ ) {
        var object = world.children[ i ];
        var object_left = world.children[ i-1 ];
        if (i>1) {
          gsap.to(object.position, {
            duration: 2,
            x:Math.cos(object_left.position.x * Math.PI) * 1,
            y:Math.sin(object_left.position.y * Math.PI) * 1,
            z:Math.cos(object_left.position.z * Math.PI) * 1,
          });
        }
      }
      var object_speed = 0.6;
      var object_guide = world.children[ 1 ];
      object_guide.position.x += Math.sin(object_place.position.x) - object_guide.position.x * object_speed;
      object_guide.position.y += Math.cos(object_place.position.y) - object_guide.position.y * object_speed;
      object_guide.position.z += object_place.position.z - object_guide.position.z * object_speed;
  })
}
</script>
