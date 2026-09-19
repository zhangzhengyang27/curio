<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 5]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
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

  // 基础场景设置
  
  // 渲染器设置
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  // 控制器
  controls.enableDamping = true
  
  // 光源
  scene.add(new THREE.AmbientLight(0xffffff, 3))
  
  // 响应式调整
  // 动画循环
  
  // 几何体合并函数
  function mergeModelGeometries(model: any, options: any = {}) {
      const { 
          material = new THREE.MeshStandardMaterial({ 
              color: 0x666666, metalness: 0.5, roughness: 0.5,
              polygonOffset: true, polygonOffsetFactor: 1.0, polygonOffsetUnits: 1.0
          }), 
          ignoreHidden = true,
          mergeThreshold = 1e-4
      } = options;
      
      model.updateWorldMatrix(true, true);
      
      // 收集网格
      const meshes: any[] = [];
      model.traverse((object: any) => {
          if (object.isMesh && object.geometry && (!ignoreHidden || object.visible)) {
              meshes.push(object);
          }
      });
      
      if (meshes.length === 0) return null;
      
      // 找出共有属性
      const commonAttribs = new Set<string>();
      let refGeom: any = null;
      
      meshes.forEach(mesh => {
          const geom = mesh.geometry;
          if (!refGeom) {
              refGeom = geom;
              Object.keys(geom.attributes).forEach(name => commonAttribs.add(name));
          } else {
              for (const name of [...commonAttribs]) {
                  if (!geom.attributes[name]) commonAttribs.delete(name);
              }
          }
      });
      
      if (!commonAttribs.has('position')) commonAttribs.add('position');
      
      try {
          // 预处理几何体
          const geometries = meshes.map(mesh => {
              const geom = mesh.geometry.clone();
              
              commonAttribs.forEach(name => {
                  if (!geom.attributes[name]) {
                      if (name === 'normal') {
                          geom.computeVertexNormals();
                      } else if (name !== 'position') {
                          const itemSize = refGeom.attributes[name].itemSize;
                          geom.setAttribute(name, new THREE.BufferAttribute(
                              new Float32Array(geom.attributes.position.count * itemSize), itemSize
                          ));
                      }
                  }
              });
              
              Object.keys(geom.attributes).forEach(name => {
                  if (!commonAttribs.has(name)) geom.deleteAttribute(name);
              });
              
              geom.applyMatrix4(mesh.matrixWorld);
              return geom;
          });
          
          const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
          
          if (mergeThreshold > 0 && (mergedGeometry as any).mergeVertices) {
              (mergedGeometry as any).mergeVertices(mergeThreshold);
          }
          
          return new THREE.Mesh(mergedGeometry, material);
          
      } catch (error) {
          console.error('模型合并失败:', error);
          return null;
      }
  }
  
  // 文件地址
  const urls = [0, 1, 2, 3, 4, 5].map(k => (props.example?.globals?.FILE_HOST + 'files/sky/skyBox0/' + (k + 1) + '.png'));
  
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  
  new GLTFLoader()
  
      .setDRACOLoader(new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/'))
  
      .load(props.example?.globals?.FILE_HOST + "files/model/LittlestTokyo.glb", gltf => {
  
          const mergedModel = mergeModelGeometries(gltf.scene, {
              material: new THREE.MeshStandardMaterial({
                  metalness: 1, roughness: 0, envMap: textureCube,
                  polygonOffset: true, polygonOffsetFactor: 1.0, polygonOffsetUnits: 1.0
              })
          })
          
          if (mergedModel) {
              scene.add(mergedModel);
  
              console.log('模型合并成功:', mergedModel);        
              // 调整相机视角
              const box = new THREE.Box3().setFromObject(mergedModel);
              const size = box.getSize(new THREE.Vector3()).length();
              const center = box.getCenter(new THREE.Vector3());
              
              camera.near = size * 0.01;
              camera.far = size * 100;
              controls.target.copy(center);
              camera.updateProjectionMatrix();
          }
      });
}
</script>
