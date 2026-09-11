const fs = require('fs')
const path = require('path')

const baseDir = path.resolve(__dirname, '../src/examples/components/threejs-official')
const dryRun = process.argv.includes('--dry-run')

function findVueFiles(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      findVueFiles(fullPath, files)
    } else if (stat.isFile() && fullPath.endsWith('.vue')) {
      files.push(fullPath)
    }
  }
  return files
}

function hasControlsVariableUsage(content) {
  // Must have actual usage of `controls` as a variable (property access or assignment RHS).
  // Avoid matching Vue props like :enable-controls="false" or attribute names ending with controls.
  const hasUsage =
    /\bcontrols\s*\./.test(content) ||
    /(?<![-\w])controls\s*=/.test(content)
  if (!hasUsage) return false

  // Exclude function declaration named controls (e.g. GamesFpsExample.vue)
  if (/function\s+controls\s*\(/.test(content)) return false

  return true
}

function isAlreadyFixed(content) {
  // Already has controls declared (with or without initializer) or assigned from __stage
  const alreadyAssigned = [
    /const\s+controls\b/,
    /let\s+controls\b/,
    /var\s+controls\b/,
    /\bcontrols\s*=\s*__stage\.controls/,
  ]
  for (const re of alreadyAssigned) {
    if (re.test(content)) return true
  }
  return false
}

function insertAfterLine(lines, pattern, newLine) {
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      lines.splice(i + 1, 0, newLine)
      return true
    }
  }
  return false
}

function addStageControls(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')

  const onReadyMatch = content.match(/function\s+onReady\s*\([^)]*\)\s*\{/)
  if (!onReadyMatch) return null

  const insertPos = onReadyMatch.index + onReadyMatch[0].length
  const beforeBody = content.slice(0, insertPos)
  const afterBody = content.slice(insertPos)
  const lines = afterBody.split('\n')

  const newLine = '  const controls = __stage.controls'

  // Prefer inserting after renderer / camera / scene extraction lines
  const inserted =
    insertAfterLine(lines, /__stage\.renderer/, newLine) ||
    insertAfterLine(lines, /__stage\.camera/, newLine) ||
    insertAfterLine(lines, /__stage\.scene/, newLine)

  if (!inserted) {
    // Insert right after opening brace, before the first non-empty line
    let idx = 0
    while (idx < lines.length && lines[idx].trim() === '') idx++
    lines.splice(idx, 0, newLine)
  }

  return beforeBody + lines.join('\n')
}

function declareNewControls(filePath) {
  // Pattern: `controls = new SomeControls(...)` => `const controls = new SomeControls(...)`
  const content = fs.readFileSync(filePath, 'utf-8')
  const newContent = content.replace(
    /(^|\n)([ \t]*)(controls\s*=\s*new\s+\w+Controls\s*\()/g,
    '$1$2const $3'
  )
  return newContent === content ? null : newContent
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  if (!hasControlsVariableUsage(content) || isAlreadyFixed(content)) return null

  // Pattern 2: file creates its own controls instance
  let newContent = declareNewControls(filePath)
  if (newContent) {
    if (!dryRun) fs.writeFileSync(filePath, newContent, 'utf-8')
    return 'new-controls'
  }

  // Pattern 1: use controls from __stage
  newContent = addStageControls(filePath)
  if (newContent) {
    if (!dryRun) fs.writeFileSync(filePath, newContent, 'utf-8')
    return 'stage-controls'
  }

  return null
}

const files = findVueFiles(baseDir)
const fixedFiles = []

for (const file of files) {
  const result = fixFile(file)
  if (result) {
    fixedFiles.push({ path: path.relative(process.cwd(), file), type: result })
  }
}

console.log(`${dryRun ? 'Would fix' : 'Fixed'} ${fixedFiles.length} files`)
if (fixedFiles.length > 0) {
  for (const item of fixedFiles) {
    console.log(`[${item.type}] ${item.path}`)
  }
}
