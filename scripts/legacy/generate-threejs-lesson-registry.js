import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  loadExistingExamples,
  parseWriteFlags,
  preserveCuratedFields,
  writeRegistry,
} from './lib/registry-guard.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const lessonRoot = path.join(projectRoot, 'public', 'external-examples', 'threejs-lesson')
const componentsDir = path.join(projectRoot, 'src', 'examples', 'components', 'threejs-lesson')

function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

function hasVueComponent(chapter, id) {
  const catDir = path.join(componentsDir, chapter)
  const pascal = toPascalCase(id)
  return fs.existsSync(path.join(catDir, `${pascal}Example.vue`))
}

// 章节中文标题映射
const chapterLabels = {
  '02-machineroom': '机房',
  '03-basics': '基础',
  '04-geometry': '几何体',
  '05-scenegraph': '场景图',
  '06-materials': '材质',
  '07-light': '灯光',
  '08-quaternion': '四元数',
  '09-cleanup': '资源释放',
}

// 示例标题映射（未定义时使用文件名格式化）
const titleMap = {
  '02-machineroom/machineRoom': '机房展示',
  '03-basics/renderStructure': '渲染结构',
  '03-basics/responsiveDesign': '响应式设计',
  '03-basics/illustration': '三维插图',
  '03-basics/dpr': '设备像素比',
  '04-geometry/geo2D': '二维几何体',
  '04-geometry/geo3D': '三维几何体',
  '04-geometry/customGeo': '自定义几何体',
  '04-geometry/pathCompose': '路径合成几何体',
  '04-geometry/computeNormal': '计算法线',
  '04-geometry/waveGeo': '波浪球',
  '05-scenegraph/tank': '坦克',
  '05-scenegraph/universe': '宇宙',
  '06-materials/meshBasicMaterialTest': '基础材质',
  '06-materials/meshStandardMaterialTest': '标准材质',
  '06-materials/meshPhysicalMaterialTest': '物理材质',
  '06-materials/shaderMaterialTest': '着色器材质',
  '06-materials/alpha': '透明度',
  '06-materials/blendTest': '混合测试',
  '06-materials/vertextColors': '顶点颜色',
  '07-light/light': '灯光基础',
  '07-light/spotLightTest': '聚光灯',
  '07-light/directionalLightShadowTest': '平行光阴影',
  '07-light/pointLightShadowTest': '点光源阴影',
  '07-light/lightProbeTest': '光照探针',
  '07-light/lensflareTest': '镜头光晕',
  '08-quaternion/rotate01': '旋转01',
  '08-quaternion/rotate02': '旋转02',
  '08-quaternion/rotate03': '旋转03',
  '08-quaternion/rotate04': '旋转04',
  '09-cleanup/memory01': '内存管理01',
  '09-cleanup/memory02': '内存管理02',
  '09-cleanup/useEffectTest': 'useEffect 测试',
}

function formatTitle(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

function addExample(examples, chapter, id, entryPath) {
  const key = `${chapter}/${id}`
  const entry = `/${path.relative(path.join(projectRoot, 'public'), entryPath).replace(/\\/g, '/')}`
  examples.push({
    id,
    category: chapter,
    categoryLabel: chapterLabels[chapter] || chapter,
    title: titleMap[key] || formatTitle(id),
    description: titleMap[key] || formatTitle(id),
    entry,
    runner: hasVueComponent(chapter, id) ? 'vue' : 'iframe',
    tags: ['threejs-lesson', chapter],
  })
}

function collectExamples() {
  const examples = []
  const chapters = fs.readdirSync(lessonRoot).filter((name) => /^\d{2}-/.test(name))

  for (const chapter of chapters) {
    const chapterDir = path.join(lessonRoot, chapter)

    // 收集 src/view 下的示例
    const viewDir = path.join(chapterDir, 'src', 'view')
    if (fs.existsSync(viewDir)) {
      const files = fs.readdirSync(viewDir).filter((f) => f.endsWith('.js'))
      for (const file of files) {
        const id = path.basename(file, '.js')
        addExample(examples, chapter, id, path.join(viewDir, file))
      }
    }

    // 收集章节根目录下的示例 JS（如 02-machineroom/machineRoom.js、03-basics/renderStructure.js）
    const rootFiles = fs.readdirSync(chapterDir).filter((f) => {
      if (!f.endsWith('.js')) return false
      // 排除构建/配置类文件
      const name = path.basename(f, '.js')
      const excludes = ['webpack.config', 'tsconfig', 'package', 'index', 'reportWebVitals', 'setupTests']
      return !excludes.includes(name) && !name.endsWith('.config')
    })
    for (const file of rootFiles) {
      const id = path.basename(file, '.js')
      // 避免与 src/view 下同名示例重复
      if (examples.some((ex) => ex.category === chapter && ex.id === id)) continue
      addExample(examples, chapter, id, path.join(chapterDir, file))
    }
  }

  return examples
}

const examples = collectExamples()
const registry = {
  source: 'threejs-lesson',
  label: 'Three.js 课程',
  examples,
}

const outputPath = path.join(projectRoot, 'src', 'examples', 'registry', 'threejsLesson.ts')

// 保留人工/流水线产出的字段（title/description/tags/thumbnail/runner），
// 否则重跑会把封面、精修文案与 runner:'vue' 全部重置（实测丢 29 张封面 + 全部精修文案）。
const { preserved, runnerKept } = preserveCuratedFields(examples, await loadExistingExamples(outputPath))
if (Object.keys(preserved).length) {
  console.log(
    `[registry-guard] 已保留已有字段：${Object.entries(preserved)
      .map(([k, v]) => `${k}×${v}`)
      .join(', ')}`
  )
}
if (runnerKept.length) {
  console.warn(
    `[registry-guard] runner 未经生成器确认（保留了已有值），共 ${runnerKept.length} 条，` +
      '请以 npm run verify:registry 的结果为准：'
  )
  for (const r of runnerKept.slice(0, 10)) console.warn(`  - ${r}`)
}

const content = `// 由 scripts/generate-threejs-lesson-registry.js 自动生成，请勿手动修改

export default ${JSON.stringify(registry, null, 2)}
`
// 注意：本脚本会整体重写三处：条目集合（按磁盘 .js 扫描）、runner（由 hasVueComponent 推导）、
// 以及顺序/格式。精修字段已由 preserveCuratedFields 保留，但写入仍受 registry-guard 拦截，
// 需先 --dry-run 预览、再 --force 确认。详见 docs/KNOWN_PITFALLS.md B1。
const { written } = writeRegistry(outputPath, content, parseWriteFlags(), 'generate-threejs-lesson-registry.js')
if (written) {
  console.log(`已生成 threejs-lesson 注册表: ${outputPath}，共 ${examples.length} 个示例`)
}
