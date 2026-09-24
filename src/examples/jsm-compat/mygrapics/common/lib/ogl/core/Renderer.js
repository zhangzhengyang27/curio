// ⚠ 本文件现在导出的是「课程自研渲染器」，**不是**原版 OGL 的 Renderer。
// 拆分原因、两类消费者的区分、以及 API 清单见 graphics 树的同名文件：
//   src/examples/jsm-compat/graphics/common/lib/ogl/core/Renderer.js
//
// 原版 OGL 的 Renderer 已移到同目录的 OglRenderer.js，供 barrel（ogl/index.mjs）那一路使用。
export { Renderer } from '@/examples/jsm-compat/gl-renderer.esm.js';
export { default } from '@/examples/jsm-compat/gl-renderer.esm.js';
