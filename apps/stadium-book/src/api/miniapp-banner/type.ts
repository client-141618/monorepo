export interface MiniappBanner {
  id: number
  imageUrl: string
  isDelete: number
  createTime?: string
  updateTime?: string
}

export interface AddMiniappBannerPayload {
  imageUrl: string
}
