export interface WxUser {
  id: number
  userId: number | null
  appid: string
  openid: string
  unionid: string | null
  sessionKey: string | null
  username?: string | null
  avatar?: string | null
  status: 1 | 2 | 3 | 4
  createTime?: string
  updateTime?: string
}

export interface UpdateWxUserStatusPayload {
  id: number
  status: 1 | 2 | 3 | 4
}
