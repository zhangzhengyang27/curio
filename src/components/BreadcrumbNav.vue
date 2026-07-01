<template>
  <div
    v-if="breadcrumbs.length > 1"
    class="breadcrumb-nav"
  >
    <span
      v-for="(crumb, i) in breadcrumbs"
      :key="i"
      class="crumb"
      @click="goBack(i)"
    >
      {{ crumb }}
      <span
        v-if="i < breadcrumbs.length - 1"
        class="sep"
      > › </span>
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const breadcrumbs = ref(['世界'])

function drillDown(name) {
  breadcrumbs.value.push(name)
  return breadcrumbs.value.length
}

function goBack(index) {
  if (index === 0) {
    breadcrumbs.value = ['世界']
  } else {
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  }
  return breadcrumbs.value.length === 1
}

function reset() {
  breadcrumbs.value = ['世界']
}

defineExpose({ drillDown, goBack, reset })
</script>

<style scoped>
.breadcrumb-nav {
  position: fixed; top: 68px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 0;
  background: rgba(15, 15, 35, 0.85);
  padding: 6px 16px; border-radius: 20px;
  backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08);
  z-index: 150; font-size: 13px;
}
.crumb { color: #888; cursor: pointer; transition: color 0.15s; }
.crumb:hover { color: #00cccc; }
.crumb:last-child { color: #00cccc; cursor: default; }
.sep { color: #444; margin: 0 4px; cursor: default; }
</style>
