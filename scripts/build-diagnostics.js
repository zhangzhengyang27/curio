import { build } from 'vite'

build({
  configFile: 'vite.config.js',
  logLevel: 'silent',
})
  .then(() => {
    console.log('BUILD_OK')
    process.exit(0)
  })
  .catch((err) => {
    const errors = err?.errors || (Array.isArray(err) ? err : [err])
    errors.forEach((e, i) => {
      const loc = e.loc || e.location
      const locStr = loc ? `:${loc.line || loc.start?.line}:${loc.column || loc.start?.column}` : ''
      console.log(`\n--- ERROR ${i + 1} ---`)
      console.log('File:', (e.id || e.filename || e.file || e.plugin || '') + locStr)
      console.log('Message:', e.message || e.text || e.stack || String(e))
      if (e.frame) console.log('Frame:', e.frame)
    })
    process.exit(1)
  })
