const fs = require('fs');

const file = '/Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球 3D 可视化/earth-app/scripts/convert-threejs-official-to-vue.js';
let content = fs.readFileSync(file, 'utf8');

// 1. 清空 IFRAME_CATEGORIES
content = content.replace(
  /const IFRAME_CATEGORIES = new Set\(\[.*\]\)/,
  "const IFRAME_CATEGORIES = new Set([])"
);

// 2. 清空 SKIP_PATTERNS
content = content.replace(
  /const SKIP_PATTERNS = \[\s*[\s\S]*?\s*\]/,
  "const SKIP_PATTERNS = []"
);

// 3. 添加 base scene 检测函数
const baseSceneDetector = `
function detectBaseScene(category, scriptCode) {
  if (category.startsWith('webgpu')) return 'WebGPUExampleScene'
  if (category.startsWith('webxr')) return 'WebXRExampleScene'
  return 'ExampleScene'
}
`;

if (!content.includes('function detectBaseScene')) {
  content = content.replace('function isManualReviewNeeded(id, category, scriptCode) {', baseSceneDetector + '\nfunction isManualReviewNeeded(id, category, scriptCode) {');
}

// 4. 修改 extractImports 保留 three/webgpu 和 three/tsl
content = content.replace(
  /function extractImports\(code\) \{[\s\S]*?return imports[\s\S]*?\}/,
  `function extractImports(code, category = '') {
  const lines = code.split('\\n')
  const imports = []
  let inMultiline = false

  for (const line of lines) {
    const isImport = /^\\s*import\\s+/.test(line)
    if (!isImport && !inMultiline) continue

    imports.push(line)

    if (line.includes('{') && !line.includes('}')) inMultiline = true
    if (line.includes('}')) inMultiline = false
  }

  return imports
    .map((line) => {
      if (/from\\s+(['"])three\\/webgpu\\1/.test(line)) return line.trim()
      if (/from\\s+(['"])three\\/tsl\\1/.test(line)) return line.trim()
      return line.replace(
        /from\\s+(['"])three\\/addons\\/(.+?)\\1/g,
        (_, quote, modulePath) => \`from \${quote}three/examples/jsm/\${modulePath.trim()}\${quote}\`
      )
    })
    .map((line) => line.trim())
}`
);

// 5. 修改 generateVueComponent 签名
content = content.replace(
  /function generateVueComponent\(id, title, scriptCode, infoHtml\) \{/,
  'function generateVueComponent(id, title, scriptCode, infoHtml, category = \'\') {'
);

// 6. 动态替换 base scene import
const importPlaceholder = "import ExampleScene from '@/examples/components/ExampleScene.vue'";
const dynamicBaseImport = `const baseScene = detectBaseScene(category, scriptCode)
const baseSceneImport = baseScene === 'WebGPUExampleScene'
  ? "import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'"
  : baseScene === 'WebXRExampleScene'
  ? "import WebXRExampleScene from '@/examples/components/WebXRExampleScene.vue'"
  : "import ExampleScene from '@/examples/components/ExampleScene.vue'"`;

content = content.replace(importPlaceholder, dynamicBaseImport);

// 7. 模板中使用动态组件
content = content.replace(/<ExampleScene/g, '<component :is="baseScene"');
content = content.replace(/<\/ExampleScene>/g, '</component>');

// 8. WebGPU/WebXR 清理逻辑
const cleanupHook = `
  // WebGPU 基座已调用 renderer.init()，移除示例中的重复调用
  if (baseScene === 'WebGPUExampleScene') {
    bodyCode = bodyCode.replace(/await\\s+renderer\\.init\\s*\\(\\s*\\)\\s*;?\\s*/g, '')
  }

  // WebXR 基座已启用 xr 并添加 VR 按钮，移除示例中的重复代码
  if (baseScene === 'WebXRExampleScene') {
    bodyCode = bodyCode.replace(/renderer\\.xr\\.enabled\\s*=\\s*true\\s*;?\\s*/g, '')
    bodyCode = bodyCode.replace(/document\\.body\\.appendChild\\s*\\(\\s*VRButton\\.createButton\\s*\\(\\s*renderer\\s*\\)\\s*\\)\\s*;?\\s*/g, '')
  }
`;

if (!content.includes('WebGPU 基座已调用')) {
  content = content.replace(
    'bodyCode = removeDuplicateDeclarations(bodyCode)',
    'bodyCode = removeDuplicateDeclarations(bodyCode)\n' + cleanupHook
  );
}

// 9. 修改 convertExample 调用
content = content.replace(
  'const vueContent = generateVueComponent(id, title, scriptCode, infoHtml)',
  'const vueContent = generateVueComponent(id, title, scriptCode, infoHtml, category)'
);

fs.writeFileSync(file, content);
console.log('patched convert script for iframe examples');
