import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const proc = spawn('pnpm', ['exec', 'vite', 'preview', '--port', '0', '--host'], {
  cwd: root,
  stdio: 'pipe',
})

let output = ''
proc.stdout.on('data', (data) => {
  const s = data.toString()
  output += s
  console.log('STDOUT:', s)
})
proc.stderr.on('data', (data) => {
  const s = data.toString()
  output += s
  console.log('STDERR:', s)
})

setTimeout(() => {
  console.log('--- FINAL OUTPUT ---')
  console.log(output)
  console.log('MATCH:', output.match(/Local:\s*http:\/\/localhost:(\d+)\//))
  proc.kill()
}, 10000)
