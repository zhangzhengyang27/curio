import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyEnvFile, parseEnvFile } from '../src/envfile.ts'

test('parseEnvFile 跳过注释与空行，剥成对引号', () => {
  const parsed = parseEnvFile(
    [
      '# 注释',
      '',
      'A=1',
      'B =  two  ',
      'C="quoted"',
      "D='single'",
      'E=with=equals',
      'F=',
      'NOEQUALS',
    ].join('\n')
  )
  assert.deepEqual(parsed, { A: '1', B: 'two', C: 'quoted', D: 'single', E: 'with=equals', F: '' })
})

test('applyEnvFile 不覆盖已有环境变量（显式传入优先，CI 可控）', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tv-envfile-'))
  const file = join(dir, '.env.local')
  await writeFile(file, 'TDT_TOKEN=from-file\nQUAKE_PORT_UNUSED=9\n', 'utf8')
  process.env.TDT_TOKEN = 'from-shell'
  try {
    const applied = applyEnvFile(file)
    assert.equal(process.env.TDT_TOKEN, 'from-shell', '已存在的变量不能被文件覆盖')
    assert.deepEqual(applied, ['QUAKE_PORT_UNUSED'])
    assert.equal(process.env.QUAKE_PORT_UNUSED, '9')
  } finally {
    delete process.env.TDT_TOKEN
    delete process.env.QUAKE_PORT_UNUSED
    await rm(dir, { recursive: true, force: true })
  }
})

test('.env.local 不存在时静默返回（新克隆 / CI 无凭据）', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tv-envfile-'))
  try {
    assert.deepEqual(applyEnvFile(join(dir, 'missing.env')), [])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
