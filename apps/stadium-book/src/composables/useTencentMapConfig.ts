import type { TencentMapConfig } from "@/api/tencent-map/type"
import { readonly, shallowRef } from "vue"
import { getTencentMapConfigApi } from "@/api/tencent-map"

const configState = shallowRef<TencentMapConfig | null>(null)
const loadingState = shallowRef(false)
const errorMessageState = shallowRef("")

let pendingRequest: Promise<TencentMapConfig | null> | null = null

export function useTencentMapConfig() {
  const ensureLoaded = async (force = false) => {
    if (configState.value && !force) {
      return configState.value
    }

    if (pendingRequest && !force) {
      return pendingRequest
    }

    loadingState.value = true
    errorMessageState.value = ""

    pendingRequest = getTencentMapConfigApi()
      .then((res) => {
        configState.value = res.data
        return configState.value
      })
      .catch((error: unknown) => {
        configState.value = null
        errorMessageState.value =
          error instanceof Error ? error.message : "地图配置加载失败，请稍后重试"
        throw error
      })
      .finally(() => {
        loadingState.value = false
        pendingRequest = null
      })

    return pendingRequest
  }

  return {
    mapConfig: readonly(configState),
    loading: readonly(loadingState),
    errorMessage: readonly(errorMessageState),
    ensureLoaded,
  }
}
