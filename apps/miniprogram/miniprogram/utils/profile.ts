import {
  CACHE_TOKEN_STORAGE_KEY,
  DEFAULT_PROFILE_AVATAR,
  DEFAULT_PROFILE_NAME,
} from "../constants/profile"

export interface WxUserProfile {
  username: string
  avatar: string
}

export interface CacheTokenPatch {
  id?: string | number
  userId?: string | number
  key?: string
  username?: string
  avatar?: string
  status?: number
}

export function createDefaultWxUserProfile(): WxUserProfile {
  return {
    username: DEFAULT_PROFILE_NAME,
    avatar: DEFAULT_PROFILE_AVATAR,
  }
}

export function getWxUserProfileFromStorage(): WxUserProfile {
  const defaultProfile = createDefaultWxUserProfile()
  const cache = getCacheTokenRecord()
  if (!cache) {
    return defaultProfile
  }

  const username =
    getTrimmedString(cache["username"]) ||
    defaultProfile.username
  const avatar = getTrimmedString(cache["avatar"]) || defaultProfile.avatar
  return { username, avatar }
}

export function updateWxUserProfileInCacheToken(profile: WxUserProfile) {
  mergeCacheToken({
    username: profile.username,
    avatar: profile.avatar,
  })
}

export function mergeCacheToken(patch: CacheTokenPatch) {
  const current = getCacheTokenRecord()
  const nextCache = {
    ...(current || {}),
    ...patch,
  }
  wx.setStorageSync(CACHE_TOKEN_STORAGE_KEY, nextCache)
}

function getCacheTokenRecord(): Record<string, unknown> | null {
  const raw = wx.getStorageSync(CACHE_TOKEN_STORAGE_KEY) as unknown
  if (!raw || typeof raw !== "object") {
    return null
  }
  return raw as Record<string, unknown>
}

function getTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
