<template>
  <div class="search-box">
    <svg
      class="search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle
        cx="11"
        cy="11"
        r="8"
      />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      ref="inputRef"
      v-model="query"
      class="search-input"
      placeholder="搜索坐标、地点或数据..."
      @input="onInput"
      @focus="showSuggestions = true"
      @keydown.enter="selectFirst"
      @keydown.escape="close"
    >
    <ul
      v-if="showSuggestions && suggestions.length"
      class="suggestions"
    >
      <li
        v-for="(item, i) in suggestions"
        :key="item.name"
        :class="['suggestion-item', { active: i === activeIndex }]"
        @mousedown.prevent="select(item)"
      >
        <span
          v-if="item.flag"
          class="suggestion-flag"
        >{{ item.flag }}</span>
        <span
          v-else
          class="suggestion-flag"
        >🌍</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEarthStore } from '../stores/useEarthStore'

interface SearchSuggestion {
  name: string
  lon: number
  lat: number
  flag: string
}

const props = defineProps<{
  onSelect?: (item: SearchSuggestion) => void
}>()

const emit = defineEmits(['select'])

const earthStore = useEarthStore()
const query = ref('')
const showSuggestions = ref(false)
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const countryFlags: Record<string, string> = {
  '中国': '🇨🇳', '美国': '🇺🇸', '日本': '🇯🇵', '英国': '🇬🇧', '法国': '🇫🇷',
  '德国': '🇩🇪', '俄罗斯': '🇷🇺', '印度': '🇮🇳', '巴西': '🇧🇷', '加拿大': '🇨🇦',
  '澳大利亚': '🇦🇺', '韩国': '🇰🇷', '意大利': '🇮🇹', '西班牙': '🇪🇸', '墨西哥': '🇲🇽'
}

const suggestions = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.toLowerCase()
  const idx = earthStore.searchIndex
  return Object.entries(idx)
    .filter(([name]) => name.toLowerCase().includes(q))
    .map(([name, data]) => ({
      name,
      lon: data.lon,
      lat: data.lat,
      flag: countryFlags[name]
    }))
    .slice(0, 8)
})

function onInput() {
  showSuggestions.value = true
  activeIndex.value = 0
}

function select(item: SearchSuggestion) {
  query.value = item.name
  showSuggestions.value = false
  emit('select', item)
  props.onSelect?.(item)
}

function selectFirst() {
  if (suggestions.value.length) {
    select(suggestions.value[activeIndex.value])
  }
}

function close() {
  showSuggestions.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!(e.target as HTMLElement | null)?.closest('.search-box')) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--cu-surface-container-lowest);
  backdrop-filter: blur(16px);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-full);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 8px 12px;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.search-box:focus-within {
  border-color: color-mix(in srgb, var(--cu-primary) 50%, var(--cu-outline-variant));
  box-shadow: 0 4px 16px rgba(0, 87, 194, 0.12);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--cu-outline);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--cu-on-surface);
  font-size: 14px;
  line-height: 22px;
  padding: 0 10px;
  outline: none;
}

.search-input::placeholder {
  color: var(--cu-outline);
}

.suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--cu-surface-container-lowest);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  list-style: none;
  padding: 6px 0;
  z-index: 300;
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  color: var(--cu-on-surface);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: var(--cu-primary-fixed);
  color: var(--cu-on-primary-fixed);
}

.suggestion-flag {
  font-size: 16px;
  line-height: 1;
}
</style>
