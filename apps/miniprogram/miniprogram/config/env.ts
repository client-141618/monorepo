const BASE_URL_OVERRIDE_KEY = "__BASE_URL_OVERRIDE__"

const DEVTOOLS_BASE_URL = "http://localhost:8989"
const DEVICE_BASE_URL = "https://api.client141618.xyz"
const TRIAL_BASE_URL = "https://api.client141618.xyz"

type MiniProgramEnvVersion = "develop" | "trial" | "release"

function isDevtools() {
  try {
    const systemInfo = wx.getSystemInfoSync()
    return systemInfo.platform === "devtools"
  } catch (_error) {
    return false
  }
}

function getMiniProgramEnvVersion(): MiniProgramEnvVersion | "" {
  try {
    const accountInfo = wx.getAccountInfoSync()
    const envVersion = accountInfo && accountInfo.miniProgram
      ? accountInfo.miniProgram.envVersion
      : ""
    if (envVersion === "develop" || envVersion === "trial" || envVersion === "release") {
      return envVersion
    }
    return ""
  } catch (_error) {
    return ""
  }
}

export function getBaseUrl() {
  const overrideUrl = (wx.getStorageSync(BASE_URL_OVERRIDE_KEY) as string) || ""
  if (overrideUrl) {
    return overrideUrl
  }
  const envVersion = getMiniProgramEnvVersion()
  if (envVersion === "trial") {
    return TRIAL_BASE_URL
  }
  return isDevtools() ? DEVTOOLS_BASE_URL : DEVICE_BASE_URL
}

export function setBaseUrlOverride(url: string) {
  if (!url) {
    wx.removeStorageSync(BASE_URL_OVERRIDE_KEY)
    return
  }
  wx.setStorageSync(BASE_URL_OVERRIDE_KEY, url)
}
