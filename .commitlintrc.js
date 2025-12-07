import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

/**
 * 获取 monorepo 中的所有包
 * @returns {{ packages: Array<{ packageJson: object, path: string }> }} 包含所有包信息的对象
 */
function getPackagesSync() {
  const packages = []
  const rootDir = __dirname

  // 根据 pnpm-workspace.yaml 定义的包路径
  const packagePatterns = [
    'apps/*',
    'packages/*',
    'components/**',
    'utils/**',
  ]

  /**
   * 检查目录是否存在
   */
  function existsSync(path) {
    try {
      return statSync(path).isDirectory()
    }
    catch {
      return false
    }
  }

  /**
   * 读取 package.json
   */
  function readPackageJson(dir) {
    const packageJsonPath = join(dir, 'package.json')
    try {
      const content = readFileSync(packageJsonPath, 'utf-8')
      return JSON.parse(content)
    }
    catch {
      return null
    }
  }

  /**
   * 扫描目录下的所有包
   */
  function scanDirectory(pattern) {
    // 处理通配符模式
    if (pattern.includes('**')) {
      // 递归扫描
      const baseDir = pattern.replace('/**', '').replace('**', '')
      const fullPath = join(rootDir, baseDir)
      if (existsSync(fullPath)) {
        scanRecursive(fullPath)
      }
    }
    else if (pattern.includes('*')) {
      // 单层通配符
      const baseDir = pattern.replace('/*', '').replace('*', '')
      const fullPath = join(rootDir, baseDir)
      if (existsSync(fullPath)) {
        const entries = readdirSync(fullPath, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const packageDir = join(fullPath, entry.name)
            const packageJson = readPackageJson(packageDir)
            if (packageJson) {
              packages.push({
                packageJson,
                path: packageDir,
              })
            }
          }
        }
      }
    }
    else {
      // 直接路径
      const fullPath = join(rootDir, pattern)
      if (existsSync(fullPath)) {
        const packageJson = readPackageJson(fullPath)
        if (packageJson) {
          packages.push({
            packageJson,
            path: fullPath,
          })
        }
      }
    }
  }

  /**
   * 递归扫描目录
   */
  function scanRecursive(dir) {
    try {
      const packageJson = readPackageJson(dir)
      if (packageJson) {
        packages.push({
          packageJson,
          path: dir,
        })
        // 找到 package.json 后不再递归子目录
        return
      }

      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        // 跳过 node_modules 和 test 目录
        if (entry.name === 'node_modules' || entry.name === 'test') {
          continue
        }

        if (entry.isDirectory()) {
          scanRecursive(join(dir, entry.name))
        }
      }
    }
    catch {
      // 忽略无法访问的目录
    }
  }

  // 扫描所有包路径
  for (const pattern of packagePatterns) {
    scanDirectory(pattern)
  }

  return { packages }
}

const { packages } = getPackagesSync()

const allowedScopes = [
  ...packages.map(pkg => pkg.packageJson.name),
  'project',
  'style',
  'lint',
  'ci',
  'dev',
  'deploy',
  'other',
]

// precomputed scope
const scopeComplete = execSync('git status --porcelain || true')
  .toString()
  .trim()
  .split('\n')
  .find(r => ~r.indexOf('M  src'))
  ?.replace(/\//g, '%%')
  ?.match(/src%%(\w|-)*/)?.[1]
  ?.replace(/s$/, '')

const userConfig = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    'commitlint-plugin-function-rules',
    {
      rules: {
        'fix-aliyun-rule': ({ type, subject }) => {
          const issuePrefixe = 'RUSR-'
          if (type === 'fix') {
            return [
              subject?.includes(issuePrefixe),
              `必须包含云效的 bug 地址; eg. https://devops.aliyun.com/projex/bug/RUSR-1180`,
            ]
          }
          else {
            return [
              true,
            ]
          }
        },
      },
    },
  ],
  prompt: {
    /** @use `pnpm commit :f` */
    alias: {
      b: 'build: bump dependencies',
      c: 'chore: update config',
      f: 'docs: fix typos',
      r: 'docs: update README',
      s: 'style: update code format',
    },
    allowCustomIssuePrefixs: false,
    // scopes: [...scopes, 'mock'],
    allowEmptyIssuePrefixs: false,
    customScopesAlign: scopeComplete ? 'bottom' : 'top',
    defaultScope: scopeComplete,
    // English
    typesAppend: [
      { name: 'workflow: workflow improvements', value: 'workflow' },
      { name: 'types:    type definition file changes', value: 'types' },
    ],

    // 中英文对照版
    // messages: {
    //   type: '选择你要提交的类型 :',
    //   scope: '选择一个提交范围 (可选):',
    //   customScope: '请输入自定义的提交范围 :',
    //   subject: '填写简短精炼的变更描述 :\n',
    //   body: '填写更加详细的变更描述 (可选)。使用 "|" 换行 :\n',
    //   breaking: '列举非兼容性重大的变更 (可选)。使用 "|" 换行 :\n',
    //   footerPrefixsSelect: '选择关联issue前缀 (可选):',
    //   customFooterPrefixs: '输入自定义issue前缀 :',
    //   footer: '列举关联issue (可选) 例如: #31, #I3244 :\n',
    //   confirmCommit: '是否提交或修改commit ?',
    // },
    // types: [
    //   { value: 'feat', name: 'feat:     新增功能' },
    //   { value: 'fix', name: 'fix:      修复缺陷' },
    //   { value: 'docs', name: 'docs:     文档变更' },
    //   { value: 'style', name: 'style:    代码格式' },
    //   { value: 'refactor', name: 'refactor: 代码重构' },
    //   { value: 'perf', name: 'perf:     性能优化' },
    //   { value: 'test', name: 'test:     添加疏漏测试或已有测试改动' },
    //   { value: 'build', name: 'build:    构建流程、外部依赖变更 (如升级 npm 包、修改打包配置等)' },
    //   { value: 'ci', name: 'ci:       修改 CI 配置、脚本' },
    //   { value: 'revert', name: 'revert:   回滚 commit' },
    //   { value: 'chore', name: 'chore:    对构建过程或辅助工具和库的更改 (不影响源文件、测试用例)' },
    //   { value: 'wip', name: 'wip:      正在开发中' },
    //   { value: 'workflow', name: 'workflow: 工作流程改进' },
    //   { value: 'types', name: 'types:    类型定义文件修改' },
    // ],
    // emptyScopesAlias: 'empty:      不填写',
    // customScopesAlias: 'custom:     自定义',
  },
  rules: {
    /**
     * type[scope]: [function] description
     *
     * ^^^^^^^^^^^^^^ empty line.
     * - Something here
     */
    'body-leading-blank': [2, 'always'],
    /**
     * type[scope]: [function] description
     *
     * - something here
     *
     * ^^^^^^^^^^^^^^
     */
    'footer-leading-blank': [1, 'always'],
    /**
     * type[scope]: [function] description
     *      ^^^^^
     */
    'function-rules/scope-enum': [
      2, // level: error
      'always',
      (parsed) => {
        if (!parsed.scope || allowedScopes.includes(parsed.scope)) {
          return [true]
        }

        return [false, `scope must be one of ${allowedScopes.join(', ')}`]
      },
    ],
    /**
     * type[scope]: [function] description [No more than 108 characters]
     *      ^^^^^
     */
    'header-max-length': [2, 'always', 108],

    'scope-enum': [0],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    /**
     * type[scope]: [function] description
     * ^^^^
     */
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'style',
        'docs',
        'test',
        'refactor',
        'build',
        'ci',
        'chore',
        'revert',
        'types',
        'release',
      ],
    ],
  },
}
export default {
  ...userConfig,
  rules: {
    ...userConfig.rules,
    // 'fix-aliyun-rule': [1, 'always'],
    // 'references-empty': [2, 'never'],
    // 'header-max-length': [2, 'always', 100],
    // 'scope-case': [2, 'always', 'lower-case']
  },
  plugins: [
    ...userConfig.plugins,
  ],
  parserPreset: {
    parserOpts: {
      // Validate for issue/ticket numbers
      // issuePrefixes: ['RUSR-'],
      // headerPattern: /^(.*?)(?:\((.*)\))?: (.*)$/,
      // headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
}

// "commitlint.config.extend.rules": {
//   "type-enum": [2, "always", ["feat", "fix", "perf", "style", "docs", "test", "refactor", "build", "ci", "chore", "revert"]]
// }
// TODO fix 需要有云效对应的id
// https://devops.aliyun.com/projex/bug/RUSR-1180
