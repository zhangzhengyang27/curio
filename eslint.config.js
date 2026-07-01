import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.vite', 'public'] },

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

  // 由 HTML 自动转换的 WebGL 示例：保留原始代码风格，关闭对转换产物过于严格的规则
  {
    files: ['src/examples/components/webgl/**/*.vue', 'src/examples/jsm-compat/webgl/**/*.js'],
    rules: {
      'no-useless-assignment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  // Config/env files — relaxed
  {
    files: ['*.config.*', 'env.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
