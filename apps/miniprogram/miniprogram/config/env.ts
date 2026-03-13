const BASE_URL_OVERRIDE_KEY = "__BASE_URL_OVERRIDE__"

const DEVTOOLS_BASE_URL = "http://localhost:8989"
const DEVICE_BASE_URL = "http://10.11.75.79:8989"

function isDevtools() {
  try {
    const systemInfo = wx.getSystemInfoSync()
    return systemInfo.platform === "devtools"
  } catch (_error) {
    return false
  }
}

export function getBaseUrl() {
  const overrideUrl = (wx.getStorageSync(BASE_URL_OVERRIDE_KEY) as string) || ""
  if (overrideUrl) {
    return overrideUrl
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
