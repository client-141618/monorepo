import {
  defineConfig,
  toEscapedSelector as e,
  presetAttributify,
  presetIcons,
  presetUno,
} from "unocss"

// type FormItemType =
//   | 'autocomplete'
//   | 'cascader'
//   | 'checkbox'
//   | 'color-picker'
//   | 'date-picker'
//   | 'datetime-picker'
//   | 'input'
//   | 'input-number'
//   | 'mention'
//   | 'radio'
//   | 'rate'
//   | 'select'
//   | 'virtualized-select'
//   | 'slider'
//   | 'switch'
//   | 'time-picker'
//   | 'time-select'
//   | 'transfer'
//   | 'tree-select'
//   | 'upload'

// type FormItemStateType = 'is-disabled' | 'is-error' | 'is-required'

const getUnderlineElFormStyle = (
  selector: string,
  target?: "form" | "form-item" | "native",
) => {
  const targetSelector =
    target === "form-item"
      ? ".el-form-item"
      : target === "form"
        ? ".el-form .el-form-item"
        : ""
  return `
    /** input */
    ${selector}${targetSelector} .el-input__wrapper,
    ${selector}${targetSelector} .el-cascader .el-input .el-input__wrapper {
      background-color: transparent;
      border-radius: 0;
      box-shadow: 0 -1px 0 0 var(--el-input-border-color,var(--el-border-color)) inset;
    }

    ${selector}${targetSelector} .is-disabled .el-input__wrapper,
    ${selector}${targetSelector} .is-disabled .el-cascader .el-input .el-input__wrapper {
      background-color: transparent;
      box-shadow: 0 -1px 0 0 var(--el-input-border-color,var(--el-border-color)) inset;
    }

    ${selector}${targetSelector} .el-input__wrapper:hover,
    ${selector}${targetSelector} .el-cascader .el-input .el-input__wrapper:hover {
      box-shadow: 0 -1px 0 0 var(--el-input-hover-border-color,var(--el-border-color-hover)) inset;
    }

    ${selector}${targetSelector} .el-input__wrapper.is-focus,
    ${selector}${targetSelector} .el-cascader .el-input .el-input__wrapper.is-focus {
      box-shadow: 0 -1px 0 0 var(--el-input-focus-border-color) inset;
    }

    ${selector}${targetSelector}.is-error .el-input__wrapper,
    ${selector}${targetSelector}.is-error .el-input__wrapper:hover,
    ${selector}${targetSelector}.is-error .el-input__wrapper.is-focus,
    ${selector}${targetSelector}.is-error .el-cascader .el-input .el-input__wrapper:hover,
    ${selector}${targetSelector}.is-error .el-cascader .el-input .el-input__wrapper.is-focus {
      box-shadow: 0 -1px 0 0 var(--el-color-danger) inset;
    }

    ${selector} .el-input-group__append,
    ${selector} .el-input-group__prepend {
      background-color: transparent;
      box-shadow: 0 -1px 0 0 var(--el-input-border-color,var(--el-border-color)) inset;
    }

    /** select */
    ${selector}${targetSelector} .el-select__wrapper {
      background-color: transparent;
      border-radius: 0;
      box-shadow: 0 -1px 0 0 var(--el-input-border-color,var(--el-border-color)) inset;
    }

    ${selector}${targetSelector} .el-select__wrapper.is-disabled {
      background-color: transparent;
      box-shadow: 0 -1px 0 0 var(--el-input-border-color,var(--el-border-color)) inset;
    }

    ${selector}${targetSelector} .el-select__wrapper:hover {
      box-shadow: 0 -1px 0 0 var(--el-input-hover-border-color,var(--el-border-color-hover)) inset;
    }

    ${selector}${targetSelector} .el-select__wrapper.is-focus {
      box-shadow: 0 -1px 0 0 var(--el-input-focus-border-color) inset;
    }

    ${selector}${targetSelector}.is-error .el-select__wrapper,
    ${selector}${targetSelector}.is-error .el-select__wrapper:hover,
    ${selector}${targetSelector}.is-error .el-select__wrapper.is-focus {
      box-shadow: 0 -1px 0 0 var(--el-color-danger) inset;
    }
  `
}

export default defineConfig({
  /** 排除 */
  content: {
    pipeline: {
      exclude: ["node_modules"],
    },
  },
  /** 预设 */
  presets: [
    /** 属性化模式 & 无值的属性模式 */
    presetAttributify(),
    /** 预设图标 */
    presetIcons(),
    /** 默认预设 */
    presetUno(),
  ],
  /** 自定义规则 */
  rules: [
    ["uno-padding-20", { padding: "20px" }],
    // https://unocss.dev/config/rules#fully-controlled-rules
    // 标签样式
    [
      /^(product|send|member|cancel|discount|scan)-tag$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        const tagName = _name.split("-")[0]
        const tagColorMap = new Map([
          ["member", "#ebeff4"],
          ["cancel", "#e6e6e6"],
          ["discount", "#ebeff4"],
          ["send", "#90efc7"],
          ["confirm", "#dad8d9"],
          ["scan", "#e4ecfe"],
        ])
        const tagColor = tagColorMap.get(tagName) || "#0052D9"
        return `
          ${selector} {
            font-size: 14px !important;
            display: inline-block;
            border-radius: 5px;
            padding: 1px 3px;
            margin: 0 3px;
            background-color: ${tagColor};
          }
        `
      },
    ],
    // JZTAG 遮罩，迁移其他css代码
    [
      /^custom-overlay$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector} {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgb(0 0 0 / 50%);
            z-index: 999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            border-radius: 12px;
          }
        `
      },
    ],
    // 表单内容 对齐方向，包括错误检验
    [
      /^custom-form-align-(left|center|right)$/,
      ([, direction], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector} .el-form-item__content .el-form-item__error {
            left: auto;
            right: 0;
          }
          ${selector} .el-form-item__content .el-input__wrapper .el-input__inner {
            text-align: ${direction}!important;
          }
          ${selector} .el-form-item__content .el-select__placeholder {
            text-align: ${direction};
          }
        `
      },
    ],
    // 表单项内容 对齐方向，包括错误检验
    [
      /^custom-form-item-align-(left|center|right)$/,
      ([, direction], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector} .el-form-item__content .el-form-item__error {
            left: auto;
            right: 0;
          }
          ${selector} .el-form-item__content .el-input__wrapper .el-input__inner {
            text-align: ${direction}!important;
          }
        `
      },
    ],
    // 表单项内容(脱离form使用) 对齐方向，包括错误检验
    [
      /^custom-item-align-(left|center|right)$/,
      ([, direction], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector}  {
            left: auto;
            right: 0;
          }
          ${selector} .el-input__wrapper .el-input__inner {
            text-align: ${direction}!important;
          }
        `
      },
    ],
    // 表单项内容(脱离form使用) 必填项的红色星号位置
    [
      /^custom-item-required-(after|before)$/,
      ([, position], { rawSelector }) => {
        const selector = e(rawSelector)
        const valueMap = {
          offsetKV: "",
        }
        if (position === "after") {
          valueMap.offsetKV = "margin-left: 4px"
        } else {
          valueMap.offsetKV = "margin-right: 4px"
        }
        return `
          ${selector}::${position} {
            color: var(--el-color-danger);
            content: "*";
            ${valueMap.offsetKV};
          }
        `
      },
    ],
    // 表格样式
    [
      /^custom-table$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        // 去掉底部border效果
        return `
          ${selector}.el-table {
            font-size: 16px;
            --el-table-current-row-bg-color: #0000000d;
            --el-table-row-hover-bg-color: #f5f7fa;
            --el-table-current-row-bg-color: #f5f7fa;
            width: 100%;
          }
          ${selector} .el-table__inner-wrapper::before {
            height: 0;
          }
        `
      },
    ],
    // confirm弹窗
    [
      /^custom-confirm-dialog$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector} .el-message-box__message {
            width: 100%;
          }

          ${selector} .el-button {
            height: 40px;
          }
        `
      },
    ],
    [
      /^custom-triangle-top-right$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector}::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 0;
            height: 0;
            border-top: 0.5em solid #0052d9;
            border-right:0.5em solid #0052d9;
            border-bottom:0.5em solid transparent;
            border-left:0.5em solid transparent;
          }
        `
      },
    ],
    [
      /^badge-(after|before)$/,
      ([, position], { rawSelector }) => {
        const selector = e(rawSelector)
        const valueMap = {
          offsetKV: "",
        }
        if (position === "after") {
          valueMap.offsetKV = "left: -6px"
        } else {
          valueMap.offsetKV = "right: 6px"
        }
        return `
      ${selector} {
        position: relative;
      }
      ${selector}::${position} {
        content: "";
        position: absolute;
        top: 0;
        ${valueMap.offsetKV};
        width: 4px;
        height: 16px;
        border-radius: 4px;
        line-height: 100%;
        background-color: #0052d9;
      }
    `
      },
    ],
    // 表单 所有的错误项目换行
    [
      /^custom-form-item-error-nowrap$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector} .el-form-item__error {
            white-space: nowrap;
          }
        `
      },
    ],
    // 表单 所有表单项下划线样式
    [
      /^custom-form-underline$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return getUnderlineElFormStyle(selector, "form")
      },
    ],
    // 表单项 下划线样式
    [
      /^custom-form-item-underline$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return getUnderlineElFormStyle(selector, "form-item")
      },
    ],
    // 表单项(脱离form使用) 下划线样式
    [
      /^custom-item-underline$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return getUnderlineElFormStyle(selector, "native")
      },
    ],
    // 隐藏必填表单项的红色星号
    [
      /^custom-hide-required-asterisk$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector}.el-form-item.is-required .el-form-item__label::before {
            display: none;
          }`
      },
    ],
    // 文本对齐方式 - 两端对齐
    [
      /^custom-text-align-justify$/,
      ([, _name], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
          ${selector} {
            text-align: justify;
          }
          ${selector}::after {
            display: inline-block;
            content: '';
            width: 100%;
          }`
      },
    ],
    [
      /^custom-(.+)$/,
      ([, _name], { rawSelector, currentSelector }) => {
        const selector = e(rawSelector)
        if (currentSelector === "custom-never") {
          return `
          ${selector} {
            display: none;
          }
         `
        }
        return {}
      },
    ],
    // 淡入动画
    [
      /^fade-in-(\d+)$/,
      ([, duration]) => ({
        animation: `fadeIn ${duration}ms ease-in-out`,
      }),
    ],

    // 缩放动画
    [
      /^scale-in-(\d+)$/,
      ([, duration]) => ({
        animation: `scaleIn ${duration}ms ease-in-out`,
      }),
    ],

    // 滑入动画
    [
      /^slide-in-(left|right|top|bottom)-(\d+)$/,
      ([, direction, duration]) => ({
        animation: `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)} ${duration}ms ease-in-out`,
      }),
    ],

    // Badge 位置
    [
      /^badge-(after|before)$/,
      ([, position], { rawSelector }) => {
        const selector = e(rawSelector)
        const valueMap = {
          offsetKV: "",
        }
        if (position === "after") {
          valueMap.offsetKV = "left: -6px"
        } else {
          valueMap.offsetKV = "right: 6px"
        }
        return `
      ${selector} {
        position: relative;
      }
      ${selector}::${position} {
        content: "";
        position: absolute;
        top: 0;
        ${valueMap.offsetKV};
        width: 4px;
        height: 16px;
        border-radius: 4px;
        line-height: 100%;
        background-color: #0052d9;
      }
    `
      },
    ],
    // Badge的属性
    [
      /^badge-(content|width|height|radius|color|bg-color)-(.+)$/,
      ([, type, value], { rawSelector }) => {
        const selector = e(rawSelector)
        const position = ""
        // left:-${parseFloat(width) + 4}px;
        //     width: ${width}px;
        return `
        ${selector}::${position} {
          ${type}: ${value};
        }
      `
      },
    ],
  ],
  /**
   * 自定义快捷方式
   * 如果无法生效，参考 https://github.com/unocss/unocss/issues/2428
   */
  shortcuts: {
    "uno-wh-full": "w-full h-full",
    "uno-flex-center": "flex justify-center items-center",
    "uno-flex-x-center": "flex justify-center",
    "uno-flex-y-center": "flex items-center",
    "uno-scale": "transition-transform duration-200 hover:scale-105",
    "uno-shadow": "transition-shadow duration-200 hover:shadow-lg",
    "uno-badge-before":
      "before:content-empty before:bg-#0052d9 before:rounded-1 before:w-1 before:h-full before:block before:absolute before:top-0 before:left--2 relative ml-2",
    "uno-badge-after":
      "after:content-empty after:bg-#0052d9 after:rounded-1 after:w-1 after:h-full after:block after:absolute after:top-0 after:right--2 relative mr-2",
  },
  // 在 preflights 中定义关键帧
  preflights: [
    {
      getCSS: () => `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInTop {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInBottom {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,
    },
  ],
})
