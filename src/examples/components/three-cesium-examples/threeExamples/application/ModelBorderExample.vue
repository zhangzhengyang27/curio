<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 10, 12]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { BufferGeometry, EdgesGeometry } from 'three';
import { mergeAttributes } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  class MeshEdgesGeometry extends BufferGeometry {
  
      constructor(object: any, thresholdAngle = 1) {
  
          super();
  
          object.updateWorldMatrix(true, true);
  
          var position = this.extractEdges(object, thresholdAngle);
  
          this.setAttribute('position', position);
  
      } // MeshEdgesGeometry.constructor
  
      extractEdges(object: any, thresholdAngle: number) {

          var attributes: any[] = [];
          object.traverse((child: any) => {
  
              if (child.geometry) {
  
                  var geo = new EdgesGeometry(child.geometry, thresholdAngle);
                  var pos = geo.getAttribute('position');
  
                  attributes.push(pos.applyMatrix4(child.matrixWorld));
  
              } // if
  
          }); // object.traverse
  
          if (attributes.length == 0) {
  
              throw 'MeshEdgesGeometry: No edges found';
  
          }
  
          return mergeAttributes(attributes);
  
      } // MeshEdgesGeometry.extractEdges
  
  } // MeshEdgesGeometry
  
  const loader = new GLTFLoader()
  
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
  loader.load(
  
      props.example?.globals?.FILE_HOST + 'files/model/elegant.glb',
  
      gltf => {
  
          const model = new THREE.LineSegments(new MeshEdgesGeometry(gltf.scene), new THREE.LineBasicMaterial({ color: 'pink' }));
  
          scene.add(model)
  
      }
  
  )
}
</script>
