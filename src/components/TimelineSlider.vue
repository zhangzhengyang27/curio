<template>
  <div class="timeline-bar">
    <button
      class="tl-btn"
      :title="timelineStore.isPlaying ? '暂停' : '播放'"
      @click="timelineStore.toggle"
    >
      {{ timelineStore.isPlaying ? '⏸' : '▶️' }}
    </button>
    <input
      type="range"
      :min="timelineStore.yearRange[0]"
      :max="timelineStore.yearRange[1]"
      :value="timelineStore.currentYear"
      class="year-slider"
      @input="timelineStore.setYear(parseInt(($event.target as HTMLInputElement).value))"
    >
    <span class="year-label">{{ timelineStore.currentYear }}</span>
    <select
      class="speed-select"
      :value="timelineStore.speed"
      @change="timelineStore.setSpeed(parseInt(($event.target as HTMLInputElement).value))"
    >
      <option :value="1">
        1×
      </option>
      <option :value="2">
        2×
      </option>
      <option :value="4">
        4×
      </option>
    </select>
    <Transition name="pulse">
      <div
        v-if="timelineStore.isPlaying"
        class="year-overlay"
      >
        {{ timelineStore.currentYear }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useTimelineStore } from '../stores/useTimelineStore'
const timelineStore = useTimelineStore()
</script>

<style scoped>
.timeline-bar {
  position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  background: rgba(15, 15, 35, 0.9); padding: 8px 16px;
  border-radius: 24px; backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08);
  z-index: 100;
}
.tl-btn {
  background: none; border: none; color: #ccc; font-size: 16px; cursor: pointer;
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: all 0.2s;
}
.tl-btn:hover { background: rgba(255,255,255,0.1); }
.year-slider {
  width: 160px; height: 4px; accent-color: #00cccc; cursor: pointer;
}
.year-label {
  color: #00cccc; font-size: 14px; font-weight: 600; min-width: 36px; text-align: center;
}
.speed-select {
  background: rgba(255,255,255,0.1); border: none; color: #ccc;
  padding: 2px 6px; border-radius: 8px; font-size: 12px; cursor: pointer;
  outline: none;
}
.speed-select:focus { border-color: #00cccc; }
.year-overlay {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 60px; font-weight: 900; color: rgba(0, 204, 204, 0.12);
  pointer-events: none; z-index: 50;
  user-select: none;
}
.pulse-enter-active { transition: all 0.3s ease-out; }
.pulse-leave-active { transition: all 0.5s ease-in; }
.pulse-enter-from { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
.pulse-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
</style>
