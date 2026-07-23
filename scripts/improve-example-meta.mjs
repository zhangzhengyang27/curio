// 示例元信息优化（铺开到全部 11 个源）
// 逐个读取示例 .vue 组件，从真实代码（import / THREE.* 用法 / 原示例名）提取信号，
// 重写 description（讲清它做了什么、用了哪些技术）、tags（内容标签）。
// title 策略：保留本身已是优质中文的标题；只重写劣质（等于 id / 等于描述 / 套话）或纯英文标题。
// 描述按各源技术栈定制（Cesium 源写 Cesium、WebGL 源写原生 WebGL …），不套 three.js 话术。
// 保留文件头注释、其它字段（source/category/categoryLabel/titleEn/thumbnail/runner/globals/entry…）不变。
//
// 用法：node scripts/improve-example-meta.mjs [source]
//   source 缺省为 threejs-official。

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REG_DIR = join(ROOT, 'src/examples/registry')
const COMP_ROOT = join(ROOT, 'src/examples/components')

const SOURCE = process.argv[2] || 'threejs-official'
// source -> registry 文件名（不带 .js）
const REG_FILE_MAP = {
  'threejs-official': 'threejsOfficialExamples',
  'cesium-examples': 'cesiumExamples',
  'three-cesium-examples': 'threeCesiumExamples',
  webgl: 'webglExamples',
  'granary-3d': 'granary3dExamples',
  graphics: 'graphicsExamples',
  mygrapics: 'mygrapicsExamples',
  'three-project': 'threeProjectExamples',
  'city-realtime-webgl': 'cityRealtimeWebglExamples',
  'earth-lessons': 'earthLessons',
  'threejs-lesson': 'threejsLesson',
}
const REG_BASE = REG_FILE_MAP[SOURCE] || SOURCE
const REG_FILE = join(REG_DIR, `${REG_BASE}.js`)

// 各源配置：tech=描述里用的技术词；tag0=标签首标签（干净的中文/专有名词）；
// useCatPrefix=标题/描述是否带 categoryLabel 前缀（仅当 categoryLabel 是有意义的中文子类时）。
const SOURCE_CONFIG = {
  'threejs-official': { tech: 'three.js', tag0: 'Three.js', useCatPrefix: true },
  'cesium-examples': { tech: 'Cesium', tag0: 'Cesium', useCatPrefix: false },
  'three-cesium-examples': { tech: 'Three.js / Cesium', tag0: 'Three.js+Cesium', useCatPrefix: false },
  webgl: { tech: '原生 WebGL', tag0: 'WebGL', useCatPrefix: false },
  'granary-3d': { tech: 'Three.js', tag0: '粮仓3D', useCatPrefix: false },
  graphics: { tech: 'Graphics(ogl)', tag0: 'Graphics', useCatPrefix: false },
  mygrapics: { tech: 'MyGrapics', tag0: 'MyGrapics', useCatPrefix: false },
  'three-project': { tech: 'Three.js', tag0: 'Three.js', useCatPrefix: false },
  'city-realtime-webgl': { tech: 'WebGL 着色器', tag0: '实时城市', useCatPrefix: false },
  'earth-lessons': { tech: 'Cesium / Three.js', tag0: '地球可视化', useCatPrefix: true },
  'threejs-lesson': { tech: 'Three.js', tag0: 'Three.js课程', useCatPrefix: true },
}
const CFG = SOURCE_CONFIG[SOURCE] || { tech: 'three.js', tag0: SOURCE, useCatPrefix: false }

// ---------- 工具 ----------
const CJK = /[一-鿿]/
function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}

// 预构建组件文件索引：base(去 Example.vue, 转小写) -> 相对路径
function buildComponentIndex(source) {
  const map = new Map()
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else if (name.endsWith('.vue')) {
        const base = name.replace(/\.vue$/, '').toLowerCase()
        map.set(base, p)
      }
    }
  }
  const srcDir = join(COMP_ROOT, source)
  if (existsSync(srcDir)) walk(srcDir)
  return map
}

// ---------- 信号字典 ----------
// 能力检测：正则(小写文本) -> 中文短标签
const CAP_RULES = [
  [/orbitcontrols/, '轨道控制'],
  [/trackballcontrols/, '轨迹球控制'],
  [/transformcontrols/, '变换控制(Gizmo)'],
  [/mapcontrols/, '地图控制'],
  [/flycontrols/, '飞行控制'],
  [/pointerlockcontrols/, '指针锁定(FPS)控制'],
  [/firstpersoncontrols/, '第一人称控制'],
  [/effectcomposer/, '后处理管线'],
  [/unrealbloompass/, '辉光(Bloom)'],
  [/bokehpass/, '景深(DoF)'],
  [/ssaopass|saopass/, '环境光遮蔽(SSAO)'],
  [/outlinepass/, '描边高亮'],
  [/filmpass/, '胶片滤镜'],
  [/outputpass/, '输出合成'],
  [/shaderpass/, '着色器后处理'],
  [/shadermaterial|rawshadermaterial/, '自定义GLSL着色器'],
  [/'three\/tsl'|from ['"]three\/tsl['"]/, 'TSL节点着色器'],
  [/webgpurenderer/, 'WebGPU渲染'],
  [/postprocessing/, 'WebGPU后处理'],
  [/points|pointsmaterial/, '粒子/点云'],
  [/instancedmesh|instancedarray/, '实例化(Instancing)'],
  [/skinnedmesh|skeleton|bone/, '骨骼蒙皮动画'],
  [/gltfloader/, 'GLTF模型加载'],
  [/fbxloader/, 'FBX模型加载'],
  [/objloader/, 'OBJ模型加载'],
  [/stlloader/, 'STL模型加载'],
  [/pdbloader/, '分子数据(PDB)加载'],
  [/rgbeLoader|ultrahdrloder|exrloader/, 'HDR环境贴图'],
  [/textureloader|ktx2loader/, '纹理加载'],
  [/fontloader|textgeometry/, '3D文字'],
  [/line2|linegeometry|linesegments|linebasicmaterial/, '线条/线框'],
  [/water|water2/, '水面模拟'],
  [/sky\b/, '天空盒'],
  [/marchingcubes/, '等值面(MarchingCubes)'],
  [/ccdikhelper|ikhelper/, '反向动力学(IK)'],
  [/gpucomputationrenderer/, 'GPGPU计算'],
  [/ammo|cannon|rapier|physics/i, '物理引擎模拟'],
  [/raycaster/, '射线拾取交互'],
  [/octree/, '八叉树碰撞'],
  [/convexhull/, '凸包计算'],
  [/dracoloader/, 'Draco压缩'],
  [/meshoptdecoder/, 'Meshopt优化'],
  [/lil-gui|dat\.gui|new gui\(/, 'GUI调试面板'],
  [/positionalaudio|audiolistener|webaudio|audioContext/i, '空间音频(WebAudio)'],
  [/xrcontroller|webxr|vr\b/, 'WebXR沉浸'],
  [/svgrenderer/, 'SVG矢量渲染'],
  [/css3drenderer|css3dobject/, 'CSS3D渲染'],
  [/css2drenderer|css2dobject/, 'CSS2D渲染'],
  [/videotexture/, '视频纹理'],
  [/cubetexture|equirectangular/, '立方体/全景环境'],
  [/wireframe/, '线框模式'],
  [/fog\b/, '雾化'],
  [/shadowmap|castshadow|receiveshadow/, '实时阴影'],
  [/pmrem|envmap/, '环境反射(PBR)'],
  [/normalblending|additiveblending/, '混合模式'],
  [/tessellatemodifier|simplifymodifier/, '网格简化'],
  // Cesium 相关特征（cesium / earth-lessons / three-cesium 源）
  [/new viewer|cesium\.viewer|viewer\.scene/i, 'Cesium Viewer'],
  [/entities|\.entity\b/i, '实体(Entity)'],
  [/czml/i, 'CZML数据'],
  [/3d\s*tiles|3dtiles/i, '3D Tiles'],
  [/terrain|ellipsoidterrain|terrainprovider/i, '地形(Terrain)'],
  [/imagery|imagerylayer|imageryprovider/i, '影像图层'],
  [/flyto|flytocamera|zoomto/i, '相机飞行'],
  [/kml/i, 'KML'],
  [/geojson/i, 'GeoJSON'],
  [/primitive|primitives\b/i, '图元(Primitive)'],
  [/polygon|polyline|pointprimitive/i, '矢量几何'],
  [/sampledposition|velocityorientation/i, '运动轨迹'],
  [/clampToGround|heightReference/i, '贴地显示'],
]

// 主题词中英映射（小写 token -> 中文）
const SUBJECT_DICT = {
  molecules: '分子结构', cloth: '布料', ocean: '海洋', water: '水面',
  particles: '粒子', particle: '粒子', shadow: '阴影', shadows: '阴影',
  morph: '形变', morphing: '形变', morphtargets: '形变目标',
  instancing: '实例化', instance: '实例化', skinning: '蒙皮', skeleton: '骨骼', skin: '蒙皮',
  physics: '物理', bird: '鸟群', birds: '鸟群', fish: '鱼群',
  terrain: '地形', fire: '火焰', smoke: '烟雾', flame: '火焰',
  refraction: '折射', reflect: '反射', raymarch: '光线步进', raycasting: '射线拾取',
  noise: '噪声', volumetric: '体积', volume: '体积',
  gltf: 'GLTF模型', loader: '模型加载', video: '视频', texture: '纹理',
  panorama: '全景', cube: '立方体', sphere: '球体', torus: '圆环', knot: '环面纽结',
  geometry: '几何体', line: '线条', lines: '线条', points: '点云',
  camera: '相机', animation: '动画', deform: '形变', convex: '凸包',
  amoeba: '变形体', voxel: '体素', minecraft: '方块世界', chess: '棋盘', puzzle: '解谜',
  car: '汽车', racing: '赛车', fps: '第一人称', strategy: '策略',
  sea: '海洋', wave: '波浪', light: '光照', lights: '光照', lensflare: '镜头光晕',
  projector: '投影', decal: '贴花', clipping: '裁剪', depthtexture: '深度纹理',
  hdr: 'HDR', equirectangular: '全景', instanced: '实例化',
  dynamic: '动态', performance: '性能', cluster: '聚类', lod: '细节层次',
  mirror: '镜像', caustics: '焦散', grass: '草地', tree: '树木', forest: '森林',
  flower: '花朵', bubble: '气泡', gel: '凝胶', spider: '蜘蛛', snake: '蛇',
  horse: '马', cap: '帽子', hat: '帽子', mandelbrot: '曼德博集合', fractal: '分形',
  voronoi: '沃罗诺伊', galaxy: '星系', star: '恒星', stars: '星空', planet: '行星',
  sun: '太阳',   earth: '地球', moon: '月球', comet: '彗星', asteroid: '小行星',
  satellite: '卫星', rocket: '火箭', drone: '无人机', robot: '机器人',
  train: '火车', boat: '船', ship: '船只', plane: '飞机', helicopter: '直升机',
  tank: '坦克', building: '建筑', city: '城市', village: '村庄', house: '房屋',
  bridge: '桥梁', road: '道路', factory: '工厂', solar: '太阳能', wind: '风能',
  nuclear: '核能', compute: '计算', tsl: 'TSL着色器', shader: '着色器', shaders: '着色器',
  postprocessing: '后处理', post: '后处理', bloom: '辉光', depth: '景深', outline: '描边',
  gui: '控制面板', audio: '音频', sound: '音频',
  snake: '蛇', spider: '蜘蛛',
  groups: '组', group: '组', basic: '基础', keys: '关键帧', key: '关键帧', clip: '片段',
  periodic: '周期', table: '表', collisions: '碰撞', octree: '八叉树',
  selection: '选择', drag: '拖拽', arcball: '弧球', map: '地图',
  orbit: '轨道', fly: '飞行', pointerlock: '指针锁定', controls: '控制',
  misc: '杂项',
  periodictable: '元素周期表', boxselection: '框选', label: '标签',
  orthographic: '正交投影', sandbox: '沙盒', sprites: '精灵',
  orientation: '朝向', timing: '时序', visualizer: '可视化',
  clipculldistance: '裁剪距离', custom: '自定义', attributes: '属性',
  furnace: '炉测试', gpgpu: 'GPGPU', protoplanet: '原行星',
  helpers: '辅助对象', lensflares: '镜头光晕', lightprobe: '光照探针',
  lightprobes: '光照探针', marchingcubes: '等值面', mesh: '网格',
  batch: '批处理', modifier: '修改器', curve: '曲线', edgesplit: '边分割',
  simplifier: '简化器', subdivision: '细分', tessellation: '细分',
  multisampled: '多重采样', renderbuffers: '渲染缓冲', pmrem: 'PMREM',
  cubemap: '立方体贴图', cubecamera: '立方体相机', complex: '复杂',
  clip: '裁剪', cull: '剔除', distance: '距离', points: '点',
  axis: '轴', angle: '角度', euler: '欧拉', quaternion: '四元数', matrix: '矩阵',
  rotation: '旋转', transition: '过渡', scene: '场景', map: '贴图', buffer: '缓冲',
  vertex: '顶点', mixer: '混合器', crossfade: '交叉淡入', skeletal: '骨骼',
  debug: '调试', home: '主页', number: '数值', path: '路径', keyframe: '关键帧',
  boolean: '布尔', color: '颜色', trackball: '轨迹球', transform: '变换',
  ortho: '正交', perspective: '透视', document: '文档', covid: '疫情', static: '静态',
  bezier: '贝塞尔', spline: '样条', webgl: 'WebGL', glsl: 'GLSL',
  canvas: '画布', buffer: '缓冲', framebuffer: '帧缓冲', transform: '变换',
  kaikeba: '开课吧', metaball: '元球', blinds: '百叶窗', transition: '过渡',
}

function detectCaps(text) {
  const lower = text.toLowerCase()
  const found = []
  for (const [re, tag] of CAP_RULES) {
    if (re.test(lower) && !found.includes(tag)) found.push(tag)
  }
  return found
}

function subjectFromName(nameEn) {
  if (!nameEn) return { cn: '', en: '' }
  // 去掉 "three.js" 前缀与开头的短横
  let subj = nameEn.replace(/^three\.js\s*/i, '').trim()
  subj = subj.replace(/^[-–—]\s*/, '')
  // 取最后一个 " - " 之后的真实主题（如 "webgpu - fly controls - earth" -> "earth"）
  const dash = subj.lastIndexOf(' - ')
  if (dash !== -1) subj = subj.slice(dash + 3)
  subj = subj.trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, ' ')
  return { en: subj }
}

// 从 id 提取主题（更完整、顺序更好）：驼峰+下划线分词，剔除渲染器/控制等停用词
const ID_STOP = new Set([
  'misc', 'webgl', 'webgl2', 'webgpu', 'css3d', 'css2d', 'svg', 'webaudio', 'webxr',
  'physics', 'games', 'threejs', 'official', 'controls', 'control', 'example', 'examples',
  'test', 'demo', 'scene', 'web', 'three', 'js', 'app', 'view', 'simple', 'renderer',
  'render', 'sample', 'webglrenderer', 'kaikeba', 'start', 'lesson', 'lessons',
])
function tokenizeId(id) {
  const spaced = id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  return spaced.split(/[-_\s]+/).filter(Boolean).map((t) => t.toLowerCase())
}
function subjectFromId(id) {
  const raw = tokenizeId(id)
  const hasControls = raw.includes('controls')
  const toks = raw.filter((t) => !ID_STOP.has(t) && !/^\d+$/.test(t))
  // 上下文消歧：controls + map 指「地图控制」而非纹理「贴图」
  if (hasControls && toks.includes('map')) {
    toks[toks.indexOf('map')] = '地图'
  }
  return toks.join(' ')
}

function subjectCN(subjEn) {
  const tokens = subjEn.split(/[\s_]+/).filter(Boolean)
  const mapped = tokens.map((t) => SUBJECT_DICT[t] || null).filter(Boolean)
  if (mapped.length === 0) return ''
  // 去重相邻重复
  return [...new Set(mapped)].join('')
}

// ---------- 标题/描述/标签 ----------
const GARBAGE_TITLE = new Set([
  'ogl', '3d绘图', 'test', '测试', 'webgl 基础', 'webgl基础', 'graphics',
  'mygrapics', 'animation', 'webgl', 'three-project', 'cesium-examples',
  'threejs-lesson', 'earth-lessons', 'three-cesium-examples', 'three.js 官方示例',
  'three.js 课程', '地球可视化教程', '实时城市 webgl', '粮仓 3d 可视化', 'webgl 基础',
])
function isGarbageTitle(ex) {
  const t = (ex.title || '').trim()
  if (!t) return true
  if (t === ex.id) return true
  if (GARBAGE_TITLE.has(t.toLowerCase())) return true
  // 纯英文/无中文 → 需重写为中文主题
  if (!CJK.test(t)) return true
  return false
}

function buildTitle(categoryLabel, dataLabel, subjEn) {
  const cn = subjectCN(subjEn)
  const subject = cn || subjEn
  const usePrefix = CFG.useCatPrefix && categoryLabel && categoryLabel !== dataLabel && CJK.test(categoryLabel)
  return usePrefix ? `${categoryLabel}：${subject}` : subject
}

function buildDescription(categoryLabel, dataLabel, subjEn, caps, titleChanged) {
  const cn = subjectCN(subjEn)
  const subject = cn || (CJK.test(subjEn) ? subjEn : '')
  // 仅当标题被重写（原标题劣质）时才用 id 推导的主题，避免误用原标题已准确命名的示例
  const showSubject = titleChanged && !!subject
  const subjectText = showSubject ? `演示${subject}` : ''
  const useCat = CFG.useCatPrefix && categoryLabel && categoryLabel !== dataLabel && CJK.test(categoryLabel)
  let s = `这是一个基于 ${CFG.tech} 的`
  if (useCat) s += `${categoryLabel}`
  s += `示例`
  if (subjectText) s += `，${subjectText}`
  s += '。'
  if (caps.length) {
    const top = caps.slice(0, 5)
    s += `运用了 ${top.join('、')}`
    if (caps.length > 5) s += ' 等'
    s += ' 技术。'
  } else {
    s += '通过标准渲染流程呈现。'
  }
  return s
}

function buildTags(categoryLabel, dataLabel, caps) {
  const first = CFG.useCatPrefix && categoryLabel && categoryLabel !== dataLabel && CJK.test(categoryLabel)
    ? categoryLabel
    : CFG.tag0
  const tags = [first]
  for (const c of caps) {
    if (!tags.includes(c)) tags.push(c)
    if (tags.length >= 5) break
  }
  return tags
}

// ---------- 主流程 ----------
async function main() {
  const text = readFileSync(REG_FILE, 'utf-8')
  const marker = 'export default '
  const idx = text.indexOf(marker)
  if (idx === -1) throw new Error('未找到 export default')
  const header = text.slice(0, idx)
  // 动态 import 支持 JSON 与 JS 字面量两种格式（项目 package.json 为 type:module）
  const mod = await import(pathToFileURL(REG_FILE).href)
  const data = mod.default
  const dataLabel = data.label

  const compIndex = buildComponentIndex(SOURCE)
  let improved = 0
  let notFound = 0
  let titleKept = 0
  const samples = []

  for (const ex of data.examples) {
    // 候选 id：原始 id，以及去掉开头 "数字-" 前缀后的 id（部分源组件名不含课时序号）
    const candIds = [ex.id]
    const stripped = ex.id.replace(/^\d+[-_]/, '')
    if (stripped !== ex.id) candIds.push(stripped)
    let compPath = null
    for (const cid of candIds) {
      const t = `${toPascalCase(cid).toLowerCase()}example`
      if (compIndex.has(t)) { compPath = compIndex.get(t); break }
    }
    if (!compPath) {
      for (const cid of candIds) {
        const partial = toPascalCase(cid).toLowerCase()
        for (const [base, p] of compIndex) {
          if (base.includes(partial)) { compPath = p; break }
        }
        if (compPath) break
      }
    }
    if (!compPath) {
      notFound++
      if (samples.length < 30) samples.push({ id: ex.id, note: '组件未找到，保留原值' })
      continue
    }
    const compText = readFileSync(compPath, 'utf-8')
    const caps = detectCaps(compText)
    const nameEn = ex.titleEn || ex.title || ''
    // 优先用 id 提取主题（更完整），titleEn 作为兜底
    const subjEn = subjectFromId(ex.id) || subjectFromName(nameEn).en

    const cn = subjectCN(subjEn)
    const hasCJKSubject = !!cn || CJK.test(subjEn)
    let newTitle = ex.title
    let titleChanged = false
    if (isGarbageTitle(ex) && hasCJKSubject) {
      newTitle = buildTitle(ex.categoryLabel, dataLabel, subjEn)
      if (newTitle !== ex.title) titleChanged = true
    } else {
      titleKept++
    }

    const newDesc = buildDescription(ex.categoryLabel, dataLabel, subjEn, caps, titleChanged)
    const newTags = buildTags(ex.categoryLabel, dataLabel, caps)

    const changed = titleChanged || newDesc !== ex.description || JSON.stringify(newTags) !== JSON.stringify(ex.tags)
    ex.title = newTitle
    ex.description = newDesc
    ex.tags = newTags
    if (changed) improved++
    if (samples.length < 30) {
      samples.push({
        id: ex.id,
        categoryLabel: ex.categoryLabel,
        titleEn: nameEn,
        title: newTitle,
        description: newDesc,
        tags: newTags,
        capsFound: caps.length,
        titleKept: !titleChanged,
      })
    }
  }

  // 写回（统一序列化为 JSON，保留头部注释与字段顺序）
  const out = header + marker + JSON.stringify(data, null, 2) + '\n'
  writeFileSync(REG_FILE, out)

  console.log(`source=${SOURCE}`)
  console.log(`总条目: ${data.examples.length} | 已优化: ${improved} | 标题保留: ${titleKept} | 组件未找到(保留原值): ${notFound}`)
  console.log('\n=== 抽样（前 18 条）===')
  for (const s of samples.slice(0, 18)) {
    if (s.note) { console.log(`- [未找到] ${s.id}`); continue }
    console.log(`\n• ${s.id}  (${s.categoryLabel})`)
    console.log(`  原En : ${s.titleEn}`)
    console.log(`  标题 : ${s.title}${s.titleKept ? '  (保留原中文)' : ''}`)
    console.log(`  描述 : ${s.description}`)
    console.log(`  标签 : ${s.tags.join(', ')}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
