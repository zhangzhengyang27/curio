import test from 'node:test'
import assert from 'node:assert/strict'
import { mapFeature } from '../src/usgs.ts'

const feature = (over: Record<string, unknown> = {}) => ({
  id: 'ci41335799',
  properties: {
    mag: 3.2,
    place: '9 km NE of X, CA',
    time: 1_789_955_425_350,
    alert: null,
    type: 'earthquake',
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/ci41335799',
    ...over,
  },
  geometry: { type: 'Point', coordinates: [-116.3, 33.3, 29.07] },
})

test('mapFeature: 字段映射与坐标顺序 [lon, lat, depth]', () => {
  const row = mapFeature(feature() as never)
  assert.equal(row?.id, 'ci41335799')
  assert.equal(row?.lon, -116.3)
  assert.equal(row?.lat, 33.3)
  assert.equal(row?.depth, 29.07)
  assert.equal(row?.time, 1_789_955_425_350)
})

test('mapFeature: 无震级条目丢弃', () => {
  assert.equal(mapFeature(feature({ mag: null }) as never), null)
})

test('mapFeature: 非地震条目（采石场爆破等台网噪声）丢弃', () => {
  assert.equal(mapFeature(feature({ type: 'quarry blast' }) as never), null)
})

test('mapFeature: place 缺失时给兜底文案', () => {
  assert.equal(mapFeature(feature({ place: null }) as never)?.place, '未知位置')
})
