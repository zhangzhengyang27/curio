<template>
  <!-- 路线选择浮层：尚未进入任何路线时展示 -->
  <div
    v-if="!tour.route.value"
    class="tour-picker cu-glass-panel"
    data-testid="tour-picker"
  >
    <header class="tour-picker-head">
      <h3>数据巡游</h3>
      <p>选一条路线，地球自动开讲</p>
    </header>
    <div class="tour-route-list">
      <button
        v-for="r in routes"
        :key="r.id"
        class="tour-route-card"
        :data-tour-id="r.id"
        @click="$emit('pick', r)"
      >
        <span class="tour-route-title">{{ r.title }}</span>
        <span class="tour-route-meta">{{ r.steps.length }} 站 · {{ r.durationText }}</span>
        <span class="tour-route-desc">{{ r.description }}</span>
      </button>
    </div>
    <button
      class="tour-picker-close"
      title="关闭"
      @click="$emit('close')"
    >
      ×
    </button>
  </div>

  <!-- 播放器：字幕卡 + 底部播放条 -->
  <template v-else>
    <div
      v-if="tour.caption.value"
      class="tour-caption"
      data-testid="tour-caption"
    >
      <p class="tour-caption-step">
        {{ tour.stepIndex.value + 1 }} / {{ tour.stepCount.value }}
      </p>
      <h3 class="tour-caption-title">
        {{ tour.caption.value.title }}
      </h3>
      <p class="tour-caption-text">
        {{ tour.caption.value.text }}
      </p>
    </div>

    <div
      class="tour-bar cu-glass-panel"
      data-testid="tour-bar"
    >
      <span class="tour-bar-title">{{ (tour.route.value as TourRouteWithDuration)?.title }}</span>

      <div class="tour-dots">
        <button
          v-for="(s, i) in tour.route.value.steps"
          :key="i"
          class="tour-dot"
          :class="{ active: i === tour.stepIndex.value, played: i < tour.stepIndex.value }"
          :title="`${i + 1}. ${s.caption.title}`"
          @click="tour.goTo(i)"
        />
      </div>

      <div class="tour-controls">
        <button
          class="tour-ctrl"
          data-testid="tour-prev"
          :disabled="tour.stepIndex.value === 0"
          title="上一站（←）"
          @click="tour.prev()"
        >
          ‹ 上一站
        </button>
        <button
          class="tour-ctrl tour-play"
          data-testid="tour-toggle"
          title="播放 / 暂停（空格）"
          @click="tour.toggle()"
        >
          {{ tour.status.value === 'playing' ? '⏸ 暂停' : '▶ 播放' }}
        </button>
        <button
          class="tour-ctrl"
          data-testid="tour-next"
          :disabled="tour.stepIndex.value === tour.stepCount.value - 1"
          title="下一站（→）"
          @click="tour.next()"
        >
          下一站 ›
        </button>
      </div>

      <button
        class="tour-exit"
        data-testid="tour-exit"
        title="退出巡游（Esc）"
        @click="$emit('close')"
      >
        退出
      </button>
    </div>
  </template>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { useTourEngine } from '../composables/useTourEngine'
import type { TourRouteWithDuration } from '../three/tours/routes'

type TourEngine = ReturnType<typeof useTourEngine>

/**
 * 数据巡游播放器：路线选择浮层 + 字幕卡 + 播放条。
 * 纯展示与键鼠交互，播放状态机在 useTourEngine（props.tour）。
 * tour 是引擎返回的普通对象，内部为 ref，模板中需显式 .value。
 */
const props = defineProps<{
  tour: TourEngine
  routes: TourRouteWithDuration[]
}>()

const emit = defineEmits<{
  pick: [route: TourRouteWithDuration]
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    props.tour.stop()
    // 无论在选线页还是播放中，Esc 都等同于退出整个巡游界面
    emit('close')
  } else if (e.key === 'ArrowRight') {
    props.tour.next()
  } else if (e.key === 'ArrowLeft') {
    props.tour.prev()
  } else if (e.key === ' ' && props.tour.route.value) {
    e.preventDefault()
    props.tour.toggle()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.tour-picker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 60;
  width: 420px;
  max-height: 70vh;
  overflow: auto;
  padding: 20px;
  border-radius: var(--cu-radius-lg, 16px);
}

.tour-picker-head h3 {
  margin: 0;
  font-size: 18px;
}

.tour-picker-head p {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.7;
}

.tour-route-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.tour-route-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.tour-route-card:hover {
  border-color: var(--cu-primary, #4f8ef7);
  background: var(--cu-primary-fixed, rgba(79, 142, 247, 0.08));
}

.tour-route-title {
  font-size: 15px;
  font-weight: 600;
}

.tour-route-meta {
  font-size: 11px;
  opacity: 0.65;
}

.tour-route-desc {
  font-size: 12px;
  opacity: 0.85;
  line-height: 1.5;
}

.tour-picker-close {
  position: absolute;
  top: 10px;
  right: 12px;
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
}

.tour-caption {
  position: absolute;
  left: 24px;
  bottom: 92px;
  z-index: 55;
  max-width: 380px;
  padding: 14px 18px;
  border-radius: 14px;
  background: var(--cu-inverse-surface, rgba(20, 20, 24, 0.82));
  color: var(--cu-inverse-on-surface, #fff);
  backdrop-filter: blur(8px);
}

.tour-caption-step {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.08em;
  opacity: 0.65;
}

.tour-caption-title {
  margin: 4px 0 6px;
  font-size: 18px;
}

.tour-caption-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.9;
}

.tour-bar {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: var(--cu-radius-full, 999px);
}

.tour-bar-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.tour-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tour-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.35);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tour-dot.played {
  background: var(--cu-primary, #4f8ef7);
  opacity: 0.5;
}

.tour-dot.active {
  background: var(--cu-primary, #4f8ef7);
  transform: scale(1.35);
  opacity: 1;
}

.tour-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tour-ctrl {
  padding: 5px 12px;
  border: none;
  border-radius: var(--cu-radius-full, 999px);
  background: rgba(128, 128, 128, 0.14);
  color: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.tour-ctrl:hover:not(:disabled) {
  background: rgba(128, 128, 128, 0.26);
}

.tour-ctrl:disabled {
  opacity: 0.4;
  cursor: default;
}

.tour-play {
  background: var(--cu-primary, #4f8ef7);
  color: var(--cu-on-primary, #fff);
  font-weight: 600;
}

.tour-play:hover:not(:disabled) {
  background: var(--cu-primary, #4f8ef7);
  filter: brightness(1.08);
}

.tour-exit {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.65;
  white-space: nowrap;
}

.tour-exit:hover {
  opacity: 1;
}
</style>
