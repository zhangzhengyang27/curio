// 把课程原版渲染器（webpack UMD 产物）转成可被 Vite 打包的 ESM 模块。
//
// 背景：graphics / mygrapics 两棵示例树共 84 个组件调用
//   renderer.compileSync() / useProgram() / setMeshData() / uniforms / createFBO() / bindFBO()
// 但 jsm-compat 里 vendored 的 ogl/core/Renderer.js 是**原版 OGL 的 Renderer**，
// 只有 render({scene,camera}) —— 那 84 个组件用的是课程自研渲染器的 API，
// 于是全部抛 `renderer.compileSync is not a function`，示例在线上也渲染不出来。
//
// 真正的实现在 public/{graphics,mygrapics}/common/lib/gl-renderer.js（webpack UMD，
// 两处字节相同）。它靠 UMD 的 `root["GlRenderer"] = factory()` 挂到 window，
// 而 ESM 模块作用域里 `this` 是 undefined → 直接 import 会抛错，
// 所以这里把 UMD 外层拆掉、只保留 factory，生成一个真正的 ESM 模块。
//
// 用法:
//   node scripts/generate-gl-renderer-esm.mjs            # 生成
//   node scripts/generate-gl-renderer-esm.mjs --check    # 只比对，不写（漂移检测）
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UMD = path.join(ROOT, 'public/graphics/common/lib/gl-renderer.js')
const OUT = path.join(ROOT, 'src/examples/jsm-compat/gl-renderer.esm.js')

// UMD 的两处固定标记：结尾的 `})(this, ` 之后是 factory 函数
const FACTORY_MARKER = '})(this, function() {'

const src = readFileSync(UMD, 'utf8')
const at = src.indexOf(FACTORY_MARKER)
if (at < 0) {
  console.error(`[FAIL] 在 ${path.relative(ROOT, UMD)} 里找不到 UMD factory 标记。`)
  console.error('       UMD 结构可能变了，请检查后更新本脚本的 FACTORY_MARKER。')
  process.exit(1)
}

// 取出 `function() { ... }`（含结尾的 `}`，不含 UMD 的 `);`）
let factory = src.slice(at + '})(this, '.length)
const close = factory.lastIndexOf('});')
if (close < 0) {
  console.error('[FAIL] 找不到 UMD factory 的结尾 `});`。')
  process.exit(1)
}
factory = factory.slice(0, close + 1)

const banner = `// ⚠ 本文件由 scripts/generate-gl-renderer-esm.mjs 生成，请勿手工编辑。
//
// 来源: public/graphics/common/lib/gl-renderer.js（webpack UMD，课程原版渲染器）
// 为什么要生成: 该 UMD 依赖 \`root["GlRenderer"] = factory()\` 挂到 window，
//   在 ESM 模块作用域里 \`this\` 为 undefined 会直接抛错；这里剥掉 UMD 外壳、
//   只保留 factory 并显式调用，得到可被 Vite 打包的等价模块。
// 改动上游后重跑: node scripts/generate-gl-renderer-esm.mjs
//
// 消费者: src/examples/jsm-compat/{graphics,mygrapics}/common/lib/ogl/core/Renderer.js
//   （那 84 个课程组件用的 compileSync / useProgram / setMeshData / uniforms /
//     createFBO / bindFBO / loadTexture 都来自这里）
`

const out = `${banner}const GlRenderer = (${factory})();

export const Renderer = GlRenderer;
export default GlRenderer;
`

if (process.argv.includes('--check')) {
  const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null
  if (cur === out) {
    console.log('[OK] gl-renderer.esm.js 与上游 UMD 一致，无漂移。')
    process.exit(0)
  }
  console.error('[FAIL] gl-renderer.esm.js 与上游 UMD 不一致（漂移）。')
  console.error('       重跑: node scripts/generate-gl-renderer-esm.mjs')
  process.exit(1)
}

writeFileSync(OUT, out)
console.log(`[OK] 已生成 ${path.relative(ROOT, OUT)}`)
console.log(`     上游 ${(src.length / 1024).toFixed(1)} KB → 产物 ${(out.length / 1024).toFixed(1)} KB`)
