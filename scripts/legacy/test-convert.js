import fs from 'fs'
import { convertExample } from './convert-threejs-official-to-vue.js'

const htmlPath = '/Users/zhangzhengyang/Downloads/three.js-dev/examples/webgl_loader_nrrd.html'
const result = convertExample(htmlPath)
console.log(result.vueContent.slice(0, 2000))
