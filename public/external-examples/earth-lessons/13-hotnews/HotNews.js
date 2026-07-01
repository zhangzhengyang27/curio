// 引入three.js
import * as THREE from 'three';
import { createPointMesh } from './pointMesh.js';
import { createLightPillar } from './LightPillar.js';
import  HotNewsData  from './HotNewsData.js';
import config from './config.js';
var R = config.R;//地球半径

var group = new THREE.Group();//声明一个组对象包含所有光柱、光柱底座、波动光圈
HotNewsData.forEach(function(obj){
  var lon = obj.E;//经度
  var lat = obj.N//纬度
  var mesh = createPointMesh(R, lon, lat);//光柱底座矩形平面
  group.add(mesh);
  var LightPillar = createLightPillar(R, lon, lat);//光柱
  group.add(LightPillar);
})

export default group;
