export interface TencentMapConfig {
  key: string
  secretKey?: string
}

export interface TencentMapReverseGeocodeRequest {
  latitude: number
  longitude: number
}

export interface TencentMapReverseGeocodeResult {
  latitude: number
  longitude: number
  address?: string
  province?: string
  city?: string
  district?: string
  street?: string
  streetNumber?: string
}
