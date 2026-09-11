const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, 'convert-threejs-official-to-vue.js');
let content = fs.readFileSync(file, 'utf8');

// 1. 在 main 函数读取 registry 后添加 existingIds Set，用于跳过已注册示例
const oldMainStart = `async function main() {
  const args = process.argv.slice(2)`;
const newMainStart = `async function main() {
  const args = process.argv.slice(2)

  // 加载已有注册表，避免覆盖现有组件
  let existingIds = new Set()
  try {
    const mod = await import(\`file://\${registryPath}?t=\${Date.now()}\`)
    existingIds = new Set(mod.default.examples.map((ex) => ex.id))
  } catch (e) {
    // ignore
  }`;

if (!content.includes('existingIds = new Set()')) {
  content = content.replace(oldMainStart, newMainStart);
}

// 2. 在循环开头跳过已注册示例
const oldLoopStart = `  for (const file of files) {
    const htmlPath = path.join(sourceExamplesDir, file)
    const result = convertExample(htmlPath)`;
const newLoopStart = `  for (const file of files) {
    const id = file.replace(/\\.html$/, '')
    if (existingIds.has(id)) {
      console.log(\`[skip] \${id} already in registry\`)
      continue
    }
    const htmlPath = path.join(sourceExamplesDir, file)
    const result = convertExample(htmlPath)`;

if (!content.includes('already in registry')) {
  content = content.replace(oldLoopStart, newLoopStart);
}

// 3. 将 manual 示例也加入 registry，runner 为 iframe
const oldManualPush = `      manualReviews.push({
        id: result.id,
        category: result.category,
        title: result.title,
        reason: result.manual.reason,
        note: result.manual.note,
      })
      continue`;

const newManualPush = `      manualReviews.push({
        id: result.id,
        category: result.category,
        title: result.title,
        reason: result.manual.reason,
        note: result.manual.note,
      })

      const categoryLabel = CATEGORY_LABEL_MAP[result.category] || CATEGORY_LABEL_MAP[result.category.split('/')[0]] || result.category
      registryExamples.push({
        id: result.id,
        category: result.category,
        categoryLabel,
        title: result.title,
        titleEn: result.title,
        description: result.title,
        thumbnail: \`/threejs-official/screenshots/\${result.id}.jpg\`,
        entry: '',
        runner: 'iframe',
        tags: ['threejs-official', ...result.category.split('/')],
        globals: {
          ASSET_HOST: '/threejs-official/',
        },
      })
      continue`;

if (!content.includes("runner: 'iframe'")) {
  content = content.replace(oldManualPush, newManualPush);
}

fs.writeFileSync(file, content);
console.log('patched', file);
