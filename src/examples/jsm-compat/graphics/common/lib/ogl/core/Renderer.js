// ⚠ 本文件现在导出的是「课程自研渲染器」，**不是**原版 OGL 的 Renderer。
//
// 该路径下有 84 个课程组件直接导入本文件（graphics/ 与 mygrapics/ 两棵树的
// animate_webgl、noise、polar-shader、shaping-functions、repeat-and-random、
// performance-*、3d-basic、3d-camera、pixels-shader、pass 等），它们用的是课程自研 API：
//   new Renderer(canvas) / compileSync(frag, vert) / useProgram(program) / setMeshData(data)
//   / uniforms / createFBO() / bindFBO(target) / loadTexture(url) / _draw()
//
// 历史上本文件是**原版 OGL 的 Renderer**（只有 render({scene,camera})），
// 于是这 84 个组件全部抛 `renderer.compileSync is not a function` ——
// 示例在线上也渲染不出来，不只是封面空白。
//
// 原版 OGL 的 Renderer 已移到同目录的 OglRenderer.js，供 barrel（ogl/index.mjs）
// 那一路消费者使用（它们用 `new Renderer({canvas,...})` + `render({scene,camera})`）。
// 两套 API 不兼容，所以必须按导入路径区分，不能合并成一个类。
//
// 实现体在 src/examples/jsm-compat/gl-renderer.esm.js（由
// scripts/generate-gl-renderer-esm.mjs 从 public/graphics/common/lib/gl-renderer.js 生成）。
export { Renderer } from '@/examples/jsm-compat/gl-renderer.esm.js';
export { default } from '@/examples/jsm-compat/gl-renderer.esm.js';
