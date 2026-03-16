import { mergeCacheToken } from "../../utils/profile"
import { request } from "../request"

export interface UpdateWxProfileParams {
  username?: string
  avatar?: string
}

export interface WxCurrentUserProfile {
  username?: string
  avatar?: string
  createTime?: string
  updateTime?: string
}

export function updateWxProfileApi(data: UpdateWxProfileParams) {
  return request<null>({
    url: "/api/wx-user/profile",
    method: "POST",
    data,
  })
}

export function getCurrentWxUserProfileApi() {
  return request<WxCurrentUserProfile>({
    url: "/api/wx-user/me",
    method: "GET",
  })
}

export function saveCurrentWxUserProfileToCache(profile: WxCurrentUserProfile) {
  const patch: Record<string, unknown> = {}
  if (typeof profile.username === "string") {
    patch.username = profile.username
  }
  if (typeof profile.avatar === "string") {
    patch.avatar = profile.avatar
  }
  mergeCacheToken(patch)
}
