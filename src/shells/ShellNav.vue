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
      <RouterLink
        :to="homeTo"
        class="brand-name"
      >
        Curio
      </RouterLink>
      <span
        v-if="tag"
        class="brand-tag"
      >{{ tag }}</span>
    </div>

    <div class="nav-links">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="{ active: isActive(link) }"
      >
        {{ link.label }}
      </RouterLink>
    </div>

    <div class="nav-right">
      <slot />

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
      </div>

      <RouterLink
        class="shell-switch"
        :to="switchTo"
      >
        {{ switchLabel }}
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useThemeStore } from '../stores/useThemeStore'
import '../styles/shell-nav.css'

export interface NavLink {
  to: string
  label: string
  /** 默认按前缀匹配；首页这类必须精确匹配，否则任何路径都会高亮 */
  exact?: boolean
}

defineProps<{
  links: NavLink[]
  /** 品牌右侧的小标签，用来标明当前是哪个产品 */
  tag?: string
  /** 点品牌名回哪儿 */
  homeTo: string
  /** 去另一个产品的入口 */
  switchTo: string
  switchLabel: string
}>()

const route = useRoute()
const themeStore = useThemeStore()

function isActive(link: NavLink) {
  if (link.exact || link.to === '/') return route.path === link.to
  return route.path === link.to || route.path.startsWith(link.to + '/')
}
</script>
