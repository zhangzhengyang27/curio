<template>
  <div class="search-box">
    <input
      ref="inputRef"
      v-model="query"
      class="search-input"
      placeholder="搜索国家..."
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
        {{ item.flag || '🌍' }} {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEarthStore } from '../stores/useEarthStore.js'

const props = defineProps({
  onSelect: Function
})

const emit = defineEmits(['select'])

const earthStore = useEarthStore()
const query = ref('')
const showSuggestions = ref(false)
const activeIndex = ref(0)
const inputRef = ref(null)

const countryFlags = {
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

function select(item) {
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

function onClickOutside(e) {
  if (!e.target.closest('.search-box')) {
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
}
.search-input {
  background: rgba(20, 20, 40, 0.8);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  width: 200px;
  outline: none;
  backdrop-filter: blur(10px);
  transition: border-color 0.2s;
}
.search-input::placeholder {
  color: rgba(255,255,255,0.4);
}
.search-input:focus {
  border-color: rgba(0, 204, 204, 0.5);
}
.suggestions {
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  background: rgba(20, 20, 40, 0.95);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  z-index: 300;
  list-style: none;
  padding: 4px 0;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}
.suggestion-item {
  padding: 8px 16px;
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(0, 204, 204, 0.2);
  color: #fff;
}
</style>
