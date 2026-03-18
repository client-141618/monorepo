import type {
  TencentMapConfig,
  TencentMapReverseGeocodeRequest,
  TencentMapReverseGeocodeResult,
} from "./type"
import { request } from "@/utils/request"

const PREFIX = "/api/tencent-map"

export function getTencentMapConfigApi() {
  return request<TencentMapConfig>({
    url: `${PREFIX}/config`,
    method: "GET",
  })
}

export function reverseGeocodeTencentMapApi(data: TencentMapReverseGeocodeRequest) {
  return request<TencentMapReverseGeocodeResult>({
    url: `${PREFIX}/reverse-geocode`,
    method: "POST",
    data,
  })
}
