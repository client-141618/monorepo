import path from "node:path"
// import path, { resolve } from 'node:path'
import { fileURLToPath } from "node:url"
import antfu from "@antfu/eslint-config"
// import antfu, { typescript } from '@antfu/eslint-config'
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs"
// import { FlatCompat } from '@eslint/eslintrc'
// import js from '@eslint/js'
import tsParser from "@typescript-eslint/parser"
// import importPlugin from 'eslint-plugin-import'
// import unUsedImport from 'eslint-plugin-unused-imports'
// import globals from 'globals'
// import vueParser from 'vue-eslint-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: js.configs.recommended,
//   allConfig: js.configs.all,
// })

const antfuConfig = antfu(
  {
    // JZTODO 该配置的实际效果对比与性能损失权衡 TypeScript and Vue are autodetected, you can also explicitly enable them:
    // typescript: {
    //   tsconfigPath: 'tsconfig.json',
    // },
    typescript: true,
    unocss: true,
    vue: true,
    // customize the stylistic rules
    stylistic: {
      indent: 2, // 4, or 'tab'
      quotes: "single", // or 'double'
    },
    formatters: {
      /**
       * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
       * By default uses Prettier
       */
      css: true,
      /**
       * Format HTML files
       * By default uses Prettier
       */
      html: true,
      /**
       * Format Markdown files
       * Supports Prettier and dprint
       * By default uses Prettier
       */
      markdown: "prettier",
    },
    // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
    ignores: [
      "**/miniprogram_npm",
      "packages/eslint-config/**/fixtures",
      "packages/eslint-config/**/_fixtures",
      "**/.DS_Store",
      "**/node_modules",
      "**/public",
      "**/dist",
      "**/dist-ssr",
      "**/*.local",
      "pnpm-lock.yaml",
      // '**/*.wxml',
      "**/iconfont",
      // ...globs
      "**/*.md",
    ],
  },
  {
    // TODO 类型转换
    ...(comments.recommended as any),
  },
  // {
  //   files: ['**/*.vue'],
  //   languageOptions: {
  //     parser: tsParser,
  //     parserOptions: {
  //       parser: '@typescript-eslint/parser',
  //     },
  //   },
  // },
  {
    files: ["**/*.{js,jsx,ts,tsx,vue}"],
    // languageOptions: {
    //   globals: {
    //     ...globals.browser,
    //     ...globals.node,
    //     defineProps: 'readonly',
    //     defineEmits: 'readonly',
    //     defineExpose: 'readonly',
    //     withDefaults: 'readonly',
    //     defineOptions: 'readonly',
    //     TMap: true,
    //   },

    //   parser: vueParser,
    //   ecmaVersion: 2020,
    //   sourceType: 'module',

    //   parserOptions: {
    //     parser: '@typescript-eslint/parser',
    //     jsxPragma: 'React',

    //     ecmaFeatures: {
    //       jsx: true,
    //       tsx: true,
    //     },
    //   },
    // },

    // settings: {
    //   'import/external-module-folders': ['node_modules', 'node_modules/@types'],
    //   'import/parsers': {
    //     '@typescript-eslint/parser': ['.ts', '.tsx'],
    //   },
    //   'import/resolver': {
    //     alias: {
    //       map: [['@', resolve(__dirname, './src')]],
    //       extensions: ['.ts', '.js', '.jsx', '.json'],
    //     },
    //     typescript: {
    //       alwaysTryTypes: true,
    //     },
    //   },
    // },

    // plugins: {
    //   'unused-imports': unUsedImport,
    //   'import': importPlugin,
    //   '@typescript-eslint': typescript,
    // },
    rules: {
      // 自动排序 import
      // 检查并去掉未使用的 import
      "unused-imports/no-unused-imports": "error",
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: [] },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // 其他 import 相关的规则
      "import/no-duplicates": "error",
      // "import/first": "error",
      // "import/newline-after-import": "error",
      // 'import/order': [
      //   'error',
      //   {
      //     'groups': [['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type']],
      //     'pathGroups': [
      //       {
      //         pattern: '~/**',
      //         group: 'external',
      //       },
      //       {
      //         pattern: '@/**',
      //         group: 'internal',
      //       },
      //     ],
      //     'pathGroupsExcludedImportTypes': ['builtin'],
      //     'newlines-between': 'always',
      //     'alphabetize': { order: 'asc', caseInsensitive: true },
      //   },
      // ],
      "@typescript-eslint/no-explicit-any": "off",
      "no-debugger": "off",
      // JZTODO 开启如下规则
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "vue/multiline-html-element-content-newline": "off",
      "vue/no-v-html": "off",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-side-effects-in-computed-properties": "error",

      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always",
          },

          svg: "always",
          math: "always",
        },
      ],

      // 'prettier/prettier': [
      //   'error',
      //   {
      //     endOfLine: 'auto',
      //   },
      // ],

      // JZTODO 后续配置为 error
      "no-param-reassign": ["warn", { props: true }],
      "no-return-assign": ["error", "always"],
      "no-return-await": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unused-expressions": "error",
      "no-void": "error",

      "style/quote-props": "off",
      "style/lines-between-class-members": "off",
      "style/jsx-curly-brace-presence": "off",
      "style/brace-style": "off",
      "style/operator-linebreak": "off",
      "ts/no-use-before-define": "off",
      "vue/attributes-order": "off",
      "vue/block-order": "off",
      "vue/singleline-html-element-content-newline": "off",
      "style/arrow-parens": "off",
      "antfu/if-newline": "off",
      "antfu/top-level-function": "off",
      "vue/prefer-separate-static-class": "off",
      "style/quotes": "off",
      "no-shadow": "off",
      eqeqeq: "off",
      "no-console": "off",
      "vue/eqeqeq": "off",
      "unicorn/prefer-number-properties": "off",
      "prefer-arrow-callback": "off",
      "vue/prefer-template": "off",

      // 新添加的规则
      "style/multiline-ternary": "off",
      "style/indent-binary-ops": "off",
      "prefer-template": "off",
      "style/member-delimiter-style": "off",
      "regexp/prefer-range": "off",
      "regexp/confusing-quantifier": "off",
      "regexp/control-character-escape": "off",
      "regexp/letter-case": "off",
      "regexp/prefer-d": "off",
      "regexp/negation": "off",
      "vue/custom-event-name-casing": "off",
      "ts/ban-ts-comment": "off",
      "regexp/prefer-w": "off",
      "regexp/no-super-linear-backtracking": "off",
      "regexp/no-useless-lazy": "off",
      "regexp/no-unused-capturing-group": "off",
      "no-useless-return": "off",
      "regexp/prefer-character-class": "off",
      "vue/operator-linebreak": "off",
      "vue/define-macros-order": "off",
      "vue/padding-line-between-blocks": "off",
      "ts/consistent-type-definitions": "off",
      "vue/no-useless-v-bind": "off",
      "vue/component-name-in-template-casing": "off",
      "prefer-exponentiation-operator": "off",
      "antfu/consistent-chaining": "off",
      "style/jsx-one-expression-per-line": "off",
      "dot-notation": "off",
      "vue/attribute-hyphenation": "off",
      "array-callback-return": "off",
      "no-useless-computed-key": "off",
      "unicorn/prefer-includes": "off",
      "antfu/curly": "off",
      "vue/no-unused-refs": "off",
      "node/prefer-global/process": "off",
    },
  },
  // ...compat.extends(
  //   'plugin:vue/vue3-essential',
  //   // "plugin:import/errors",
  //   // "plugin:import/warnings",
  //   // "plugin:import/typescript",
  //   'eslint:recommended',
  //   '@vue/typescript/recommended',
  //   '@vue/prettier',
  //   '@vue/eslint-config-typescript',
  // ),
  {
    files: ["**/*.{md}"],
    rules: {
      "markdown/heading-increment": "error",
      "markdown/no-html": "error",
      "markdown/no-duplicate-headings": "error",
      "markdown/no-empty-links": "error",
      "markdown/no-invalid-label-refs": "error",
      "markdown/no-missing-label-refs": "error",
      "markdown/fenced-code-language": "error",
    },
  },
  {
    files: ["apps/blog/**"],
    // TODO 完善
    // compat.extends("@remix-run/eslint-config", "@remix-run/eslint-config/node")
  },
  {
    files: ["packages/logger/**"],
    // TODO 完善
    // compat.extends("@repo/eslint-config/index.js")
    // env: {
    //   jest: true,
    // },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ["apps/storefront/**"],
    // TODO 完善
    // compat.extends("@repo/eslint-config/next.js")
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ["packages/ui/**", "apps/admin/**"],
    // TODO 完善
    // compat.extends("@repo/eslint-config/react.js")
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ["apps/api/**"],
    // TODO 完善
    // compat.extends("@repo/eslint-config/server.js")
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "script",
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: [
      "packages/codegen/teashop-base-api/**",
      "packages/codegen/teashop-merchant-api/**",
      "packages/codegen/teashop-supplier-api/**",
    ],
    rules: {
      "eslint-comments/no-unlimited-disable": "off",
    },
  },
  {
    files: ["packages/codegen/**/*.{js,ts}"],
    rules: {
      "style/semi": "off",
      "perfectionist/sort-exports": "off",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["packages/codegen/**/*.json"],
    rules: {
      "style/eol-last": "off",
      "jsonc/sort-keys": "off",
    },
  },
)

export default antfuConfig
