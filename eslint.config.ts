import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      '.vite',
      'public',
      // three.js 兼容层（产品依赖，见 vite.config 的 threeCompatResolver / jsm 别名）：
      // vendored 三方代码，不纳入常规 lint
      'src/examples/three-build-compat',
      'src/examples/jsm-compat',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // Global config: browser env + common rules
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
      'no-undef': 'off', // TS handles this
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-escape': 'off',
    },
  },

  // Vue SFC files
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-dupe-keys': 'error',
    },
  },

  // TypeScript files
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // CommonJS 脚本（package.json type=module 下显式 .cjs）
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // 开发脚本 — 允许未使用变量、宽松（注意 .mjs / .cjs 也要覆盖，否则会有噪声告警）
  {
    files: ['scripts/**/*.{js,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Config/env files — relaxed
  {
    files: ['*.config.*', 'env.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // 应用层（首页地球 + BMap 等自有页面）：禁止遗留调试日志。
  // 说明：src/examples/** 下只剩 vendored 兼容层（three-build-compat / jsm-compat），
  // 本就在全局 ignores；这里保留 ignores 是双保险，防止三方副本被纳入 lint 后
  // console 规则误伤。
  {
    files: ['src/**/*.{js,ts,vue}'],
    ignores: ['src/examples/**'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
)
