<template>
  <nav class="app-nav">
    <div class="nav-brand">
      <svg
        class="brand-logo"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          stroke-width="2"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="8"
          ry="18"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M2 20h36M7 10h26M7 30h26"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
      <span class="brand-name">TerraVista 3D</span>
    </div>

    <div class="nav-links">
      <router-link
        to="/"
        exact-active-class="active"
      >
        地球
      </router-link>
      <router-link
        to="/three-globe"
        active-class="active"
      >
        ThreeGlobe
      </router-link>
      <router-link
        to="/analysis"
        active-class="active"
      >
        全球分析
      </router-link>
      <router-link
        to="/workbench"
        active-class="active"
      >
        分析工作台
      </router-link>
      <router-link
        to="/monitor"
        active-class="active"
      >
        业务监控
      </router-link>
      <router-link
        to="/tools"
        active-class="active"
      >
        地图工具
      </router-link>
      <router-link
        to="/bmap"
        active-class="active"
      >
        百度地图
      </router-link>
      <div
        ref="examplesDropdownRef"
        class="nav-dropdown"
        @mouseenter="preloadExamplesRegistry"
        @focusin="preloadExamplesRegistry"
      >
        <span
          :class="['dropdown-trigger', { active: isExamplesRoute }]"
          @click="toggleExamplesDropdown"
        >
          示例中心
          <svg
            class="dropdown-arrow"
            :class="{ open: showExamplesDropdown }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        <Transition name="dropdown-fade">
          <div
            v-if="showExamplesDropdown"
            class="dropdown-menu single-column"
          >
            <div class="dropdown-items">
              <div
                v-for="tech in exampleTechs"
                :key="tech.key"
                class="dropdown-item"
                @click="navigateToExamples(tech.key)"
              >
                <span class="dropdown-label">{{ tech.label }}</span>
                <span class="dropdown-count">{{ tech.count }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="nav-right">
      <div class="nav-search">
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
          v-model="exampleSearch"
          type="text"
          class="search-input"
          placeholder="搜索示例..."
          @input="updateSearchQuery"
          @focus="preloadExamplesRegistry"
        >
      </div>

      <div class="nav-actions">
        <button
          class="action-btn"
          :title="themeStore.isDark ? '切换到浅色' : '切换到深色'"
          @click="themeStore.toggle"
        >
          <svg
            v-if="themeStore.isDark"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="5"
            />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <svg
            v-else
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        <div class="user-avatar">
          <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle
              cx="12"
              cy="7"
              r="4"
            />
          </svg>
        </div>
      </div>
    </div>
  </nav>
  <router-view />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import { useThemeStore } from './stores/useThemeStore'
import { useExampleFilters } from './examples/composables/useExampleFilters'

const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()
// 顶栏在所有路由（含首页）都挂载，因此这里只取 techList，不触发 registry 加载。
// 加载推迟到「用户真的要看示例分类」时：悬停/聚焦下拉、聚焦搜索框、或已在 /examples。
const { techList, ensureRegistryLoaded } = useExampleFilters()
const preloadExamplesRegistry = ensureRegistryLoaded

const showExamplesDropdown = ref(false)
const examplesDropdownRef = ref<HTMLElement | null>(null)
const exampleSearch = ref('')
const exampleTechs = computed(() => techList.value.filter(t => t.key !== 'all'))
const isExamplesRoute = computed(() => route.path === '/examples' || route.path.startsWith('/examples/'))

onMounted(() => {
  themeStore.init()
  // 直接以 /examples 落地时，分类菜单马上就要用；其余路由一律不预载
  if (isExamplesRoute.value) preloadExamplesRegistry()
})

watch(() => route.query.search, val => {
  // ?search= 重复出现时是数组；join(',') 与原数组隐式 ToString 赋给 input 的结果一致
  exampleSearch.value = Array.isArray(val) ? val.join(',') : (val ?? '')
}, { immediate: true })

function toggleExamplesDropdown() {
  // 触屏 / 键盘操作不触发 mouseenter，这里兜底
  if (!showExamplesDropdown.value) preloadExamplesRegistry()
  showExamplesDropdown.value = !showExamplesDropdown.value
}

function navigateToExamples(tech: string) {
  const query: LocationQueryRaw = { tech }
  if (exampleSearch.value.trim()) query.search = exampleSearch.value.trim()
  router.push({ path: '/examples', query })
  showExamplesDropdown.value = false
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function updateSearchQuery() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const query = { ...route.query }
    const val = exampleSearch.value.trim()
    if (val) {
      query.search = val
    } else {
      delete query.search
    }
    router.push({ path: '/examples', query })
  }, 300)
}

function onClickOutside(e: MouseEvent) {
  if (examplesDropdownRef.value && !examplesDropdownRef.value.contains(e.target as Node)) {
    showExamplesDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped>
.app-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: var(--tv-top-nav-height);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 var(--tv-gutter);
  background: color-mix(in srgb, var(--tv-surface-container-lowest) 80%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--tv-outline-variant);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  justify-self: start;
}

.brand-logo {
  width: 32px;
  height: 32px;
  color: var(--tv-primary);
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--tv-primary);
  letter-spacing: -0.01em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--tv-lg);
  height: 100%;
  justify-self: center;
}

.nav-links a {
  display: flex;
  align-items: center;
  height: 100%;
  color: var(--tv-on-surface-variant);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  padding-top: 2px;
  transition: color 0.2s, border-color 0.2s;
}

.nav-links a:hover {
  color: var(--tv-primary);
}

.nav-links a.active {
  color: var(--tv-primary);
  border-bottom-color: var(--tv-primary);
}

.nav-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  height: 100%;
  color: var(--tv-on-surface-variant);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  padding-top: 2px;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
  cursor: pointer;
}

.dropdown-trigger:hover {
  color: var(--tv-primary);
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  margin-left: 2px;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-trigger.active {
  color: var(--tv-primary);
  border-bottom-color: var(--tv-primary);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--tv-surface-container-lowest) 95%, transparent);
  backdrop-filter: blur(20px);
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-xl);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  padding: 12px;
  min-width: 220px;
  z-index: 1001;
}

.dropdown-menu.single-column {
  min-width: 160px;
  padding: 8px;
}

.dropdown-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--tv-outline);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 10px;
  margin-bottom: 4px;
}

.dropdown-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tv-sm);
  padding: 8px 10px;
  border-radius: var(--tv-radius-lg);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
}

.dropdown-label {
  font-size: 14px;
  line-height: 20px;
}

.dropdown-count {
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
  color: var(--tv-on-surface-variant);
  background: var(--tv-surface-container-high);
  padding: 1px 6px;
  border-radius: var(--tv-radius-full);
}

.dropdown-item:hover .dropdown-count,
.dropdown-item.active .dropdown-count {
  background: color-mix(in srgb, var(--tv-on-primary-container) 15%, transparent);
  color: var(--tv-on-primary-container);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  justify-self: end;
}

.nav-search {
  display: flex;
  align-items: center;
  background: var(--tv-surface-container);
  border-radius: var(--tv-radius-full);
  padding: 0 var(--tv-md);
  height: 36px;
  min-width: 200px;
}

.nav-search .search-icon {
  width: 18px;
  height: 18px;
  color: var(--tv-outline);
  flex-shrink: 0;
}

.nav-search .search-input {
  border: none;
  background: transparent;
  outline: none;
  color: var(--tv-on-surface);
  flex: 1;
  padding: 0 var(--tv-sm);
  font-size: 14px;
  line-height: 22px;
}

.nav-search .search-input::placeholder {
  color: var(--tv-outline);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--tv-radius-full);
  border: none;
  background: transparent;
  color: var(--tv-on-surface-variant);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.action-btn:hover {
  background: var(--tv-surface-container);
  color: var(--tv-primary);
}

.icon {
  width: 20px;
  height: 20px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--tv-radius-full);
  background: var(--tv-surface-container);
  border: 1px solid var(--tv-outline-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tv-on-surface-variant);
  margin-left: var(--tv-xs);
}

.user-avatar .icon {
  width: 18px;
  height: 18px;
}

html.dark .dropdown-menu {
  background: color-mix(in srgb, var(--tv-surface-container-lowest) 92%, transparent);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

html.dark .dropdown-item:hover,
html.dark .dropdown-item.active {
  background: var(--tv-secondary-container);
  color: var(--tv-on-secondary-container);
}

html.dark .dropdown-item:hover .dropdown-count,
html.dark .dropdown-item.active .dropdown-count {
  background: color-mix(in srgb, var(--tv-on-secondary-container) 15%, transparent);
  color: var(--tv-on-secondary-container);
}
</style>
