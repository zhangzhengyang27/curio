<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="cu-palette-mask"
      data-testid="command-palette"
      @mousedown.self="close"
    >
      <div
        class="cu-palette"
        role="dialog"
        aria-label="命令面板"
      >
        <div class="cu-palette__input-row">
          <UiIcon
            name="search"
            :size="18"
            class="cu-palette__search-icon"
          />
          <input
            ref="inputRef"
            v-model="query"
            class="cu-palette__input"
            placeholder="搜索地点、图层或工具…"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="executeActive()"
            @keydown.escape.prevent="close"
          >
          <kbd class="cu-palette__esc">Esc</kbd>
        </div>
        <div class="cu-palette__results">
          <template
            v-for="group in visibleGroups"
            :key="group.name"
          >
            <p class="cu-palette__group-name">
              {{ group.name }}
            </p>
            <button
              v-for="item in group.items"
              :key="item.key"
              class="cu-palette__item"
              :class="{ active: item.key === activeKey }"
              type="button"
              @click="execute(item)"
              @mousemove="active = flat.findIndex(f => f.key === item.key)"
            >
              <span class="cu-palette__item-label">{{ item.label }}</span>
              <span
                v-if="item.hint"
                class="cu-palette__item-hint"
              >{{ item.hint }}</span>
            </button>
          </template>
          <p
            v-if="!flat.length"
            class="cu-palette__empty"
          >
            没有匹配的结果
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import UiIcon from './UiIcon'
import { filterItems, moveActive, type CommandItem } from '../composables/commandPaletteCore'

const props = defineProps<{
  groups: Array<{ name: string; items: CommandItem[] }>
}>()

const emit = defineEmits<{ execute: [item: CommandItem] }>()

const open = ref(false)
const query = ref('')
const active = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const flat = computed(() =>
  filterItems(
    props.groups.flatMap(g => g.items),
    query.value,
  ),
)

const visibleGroups = computed(() => {
  const keys = new Set(flat.value.map(i => i.key))
  return props.groups
    .map(g => ({ name: g.name, items: g.items.filter(i => keys.has(i.key)) }))
    .filter(g => g.items.length)
})

const activeKey = computed(() => flat.value[active.value]?.key)

watch(query, () => { active.value = 0 })

watch(open, async (v) => {
  if (v) {
    query.value = ''
    active.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function move(delta: number) {
  active.value = moveActive(active.value, delta, flat.value.length)
}

function execute(item: CommandItem) {
  close()
  item.run()
  emit('execute', item)
}

function executeActive() {
  const item = flat.value[active.value]
  if (item) execute(item as CommandItem)
}

function close() {
  open.value = false
}

defineExpose({
  open: () => { open.value = true },
})
</script>

<style scoped>
.cu-palette-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: color-mix(in srgb, var(--cu-background) 55%, transparent);
  display: flex;
  justify-content: center;
  /* 顶栏 56px 之下视觉居中 */
  padding-top: calc(var(--cu-top-nav-height) + 12vh);
  animation: cu-palette-fade var(--cu-dur-fast) var(--cu-ease);
}
.cu-palette {
  width: min(560px, calc(100% - var(--cu-margin) * 2));
  height: fit-content;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--cu-surface-container-lowest);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-xl);
  box-shadow: var(--cu-shadow-3);
  overflow: hidden;
  animation: cu-palette-pop var(--cu-dur) var(--cu-ease);
}
.cu-palette__input-row {
  display: flex;
  align-items: center;
  gap: var(--cu-sm);
  padding: var(--cu-md);
  border-bottom: 1px solid var(--cu-outline-variant);
}
.cu-palette__search-icon { color: var(--cu-outline); flex-shrink: 0; }
.cu-palette__input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--cu-on-surface);
  font-size: var(--cu-fs-lg);
}
.cu-palette__input::placeholder { color: var(--cu-outline); }
.cu-palette__esc {
  font-family: var(--cu-font-mono);
  font-size: var(--cu-fs-xs);
  color: var(--cu-on-surface-variant);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-sm);
  padding: 1px 6px;
}
.cu-palette__results { overflow-y: auto; padding: var(--cu-sm); }
.cu-palette__group-name {
  font-size: var(--cu-fs-xs);
  font-weight: 600;
  color: var(--cu-on-surface-variant);
  padding: var(--cu-sm) var(--cu-sm) var(--cu-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cu-palette__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cu-sm);
  width: 100%;
  padding: 9px var(--cu-sm);
  border: none;
  border-radius: var(--cu-radius-md);
  background: transparent;
  color: var(--cu-on-surface);
  font-size: var(--cu-fs-md);
  cursor: pointer;
  text-align: left;
}
.cu-palette__item.active,
.cu-palette__item:hover {
  background: var(--cu-surface-container-high);
}
.cu-palette__item-hint {
  font-size: var(--cu-fs-xs);
  color: var(--cu-on-surface-variant);
  font-variant-numeric: tabular-nums;
}
.cu-palette__empty {
  padding: var(--cu-lg);
  text-align: center;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}

@keyframes cu-palette-fade {
  from { opacity: 0; }
}
@keyframes cu-palette-pop {
  from {
    opacity: 0;
    translate: 0 -6px;
  }
}
</style>
