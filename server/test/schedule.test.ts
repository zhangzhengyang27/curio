import test from 'node:test'
import assert from 'node:assert/strict'
import { msUntilDailyRun } from '../src/schedule.ts'

const H = 3_600_000

test('msUntilDailyRun: 凌晨前指向当天定点', () => {
  const now = new Date('2026-09-21T01:00:00+08:00')
  assert.equal(msUntilDailyRun(now, 2, 'Asia/Shanghai'), H)
})

test('msUntilDailyRun: 正点命中时不顺延成 0 而是整天', () => {
  const now = new Date('2026-09-21T02:00:00+08:00')
  assert.equal(msUntilDailyRun(now, 2, 'Asia/Shanghai'), 24 * H)
})

test('msUntilDailyRun: 定点已过指向次日', () => {
  const now = new Date('2026-09-21T03:30:00+08:00')
  assert.equal(msUntilDailyRun(now, 2, 'Asia/Shanghai'), 22.5 * H)
})

test('msUntilDailyRun: 按目标时区算墙钟时间（UTC 入参等价换算）', () => {
  // 2026-09-20T18:00Z == 2026-09-21T02:00+08:00
  const now = new Date('2026-09-20T18:00:00Z')
  assert.equal(msUntilDailyRun(now, 2, 'Asia/Shanghai'), 24 * H)
})
