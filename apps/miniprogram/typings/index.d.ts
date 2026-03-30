/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    accessToken?: string,
    refreshToken?: string,
    subscribeMessageTemplateIds?: {
      teamSuccess?: string
      teamCanceled?: string
      reservationSuccess?: string
      reservationCanceled?: string
    },
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

declare namespace WechatMiniprogram {
  interface GetFuzzyLocationOption {
    type?: "wgs84" | "gcj02"
    altitude?: boolean
    complete?: GetFuzzyLocationCompleteCallback
    fail?: GetFuzzyLocationFailCallback
    success?: GetFuzzyLocationSuccessCallback
  }

  type GetFuzzyLocationSuccessCallback = (result: GetLocationSuccessCallbackResult) => void
  type GetFuzzyLocationFailCallback = (res: GeneralCallbackResult) => void
  type GetFuzzyLocationCompleteCallback = (
    res: GetLocationSuccessCallbackResult | GeneralCallbackResult,
  ) => void

  interface Wx {
    getFuzzyLocation: (option: GetFuzzyLocationOption) => void
  }
}
