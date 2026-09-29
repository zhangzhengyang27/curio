import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterItems, moveActive, type PaletteItem } from '../../src/composables/commandPaletteCore.ts'

const items: PaletteItem[] = [
  { key: '地点:中国', group: '地点', label: '中国' },
  { key: '地点:智利', group: '地点', label: '智利' },
  { key: '图层:地震', group: '图层', label: '地震历史数据' },
  { key: '工具:截图', group: '工具', label: '截图' },
]

test('空查询按原序返回,受 limit 截断', () => {
  assert.equal(filterItems(items, '').length, 4)
  assert.deepEqual(filterItems(items, '', 2).map(i => i.key), ['地点:中国', '地点:智利'])
})

test('子串过滤命中 label', () => {
  assert.deepEqual(filterItems(items, '地震').map(i => i.key), ['图层:地震'])
})

test('无命中返回空数组(不抛错)', () => {
  assert.deepEqual(filterItems(items, '不存在的词'), [])
})

test('moveActive 环绕移动,空列表安全', () => {
  assert.equal(moveActive(0, -1, 4), 3)
  assert.equal(moveActive(3, 1, 4), 0)
  assert.equal(moveActive(0, 1, 0), 0)
})
