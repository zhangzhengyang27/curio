// 引入three.js
import * as THREE from 'three';
// 引入lon2xyz,经纬度转球面坐标
import {lon2xyz} from './math.js'

// R:球面半径
function countryLine(R) {
    var loader = new THREE.FileLoader();
    loader.setResponseType('json');
    var group = new THREE.Group();// 组对象mapGroup是所有国家边界父对象
    loader.load('./world.json', function (data) {
        // 访问所有国家边界坐标数据：data.features
        data.features.forEach(function (country) {
            // "Polygon"：国家country有一个封闭轮廓
            //"MultiPolygon"：国家country有多个封闭轮廓
            if (country.geometry.type === "Polygon") {
                // 把"Polygon"和"MultiPolygon"的geometry.coordinates数据结构处理为一致
                country.geometry.coordinates = [country.geometry.coordinates];
            }
            // 解析所有封闭轮廓边界坐标country.geometry.coordinates
            // 批量渲染一个国家的多个轮廓线(>=1个)
            country.geometry.coordinates.forEach(polygon => {
                var pointArr = [];//边界线顶点坐标
                polygon[0].forEach(elem => {
                    // 经纬度转球面坐标
                    var coord = lon2xyz(R, elem[0], elem[1])
                    pointArr.push(coord.x, coord.y, coord.z);
                });
                group.add(line(pointArr));
            });

        });
    })
    return group;
}

// pointArr：行政区一个多边形轮廓边界坐标(2个元素为一组，分别表示一个顶点x、y值)
function line(pointArr) {
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array(pointArr);
    var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
    // 设置几何体attributes属性的位置属性
    geometry.setAttribute('position', attribue)
    // 线条渲染几何体顶点数据
    var material = new THREE.LineBasicMaterial({
        color: 0x00aaaa //线条颜色
    });
    var line = new THREE.LineLoop(geometry, material);//首尾顶点连线，轮廓闭合
    return line;
}


export {countryLine};
