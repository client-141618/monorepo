import type { WxUserProfile } from "../../utils/profile"
import { uploadFileApi } from "../../api/file/index"
import { updateWxProfileApi } from "../../api/wx-user/index"
import {
  DEFAULT_PROFILE_AVATAR,
  DEFAULT_PROFILE_NAME,
} from "../../constants/profile"
import {
  getWxUserProfileFromStorage,
  updateWxUserProfileInCacheToken,
} from "../../utils/profile"

Page({
  data: {
    userProfile: getWxUserProfileFromStorage() as WxUserProfile,
    showEditor: false,
    submitting: false,
    avatarChanged: false,
    draftAvatar: DEFAULT_PROFILE_AVATAR,
    draftUsername: DEFAULT_PROFILE_NAME,
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: "个人资料",
    })
    this.setData({
      userProfile: getWxUserProfileFromStorage(),
    })
  },

  onBack() {
    if (getCurrentPages().length <= 1) {
      wx.reLaunch({
        url: "/pages/mine/index",
      })
    }
  },

  onTapEditProfile() {
    const profile = this.data.userProfile
    this.setData({
      showEditor: true,
      avatarChanged: false,
      draftAvatar: profile.avatar || DEFAULT_PROFILE_AVATAR,
      draftUsername: profile.username || DEFAULT_PROFILE_NAME,
    })
  },

  onCloseEditor() {
    this.setData({ showEditor: false })
  },

  onChooseAvatar(event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const avatarUrl = event.detail.avatarUrl || ""
    if (!avatarUrl) {
      return
    }
    this.setData({
      avatarChanged: true,
      draftAvatar: avatarUrl,
    })
  },

  onNicknameInput(event: WechatMiniprogram.Input) {
    const value = event.detail.value || ""
    this.setData({
      draftUsername: value,
    })
  },

  async onSubmitProfile() {
    const username = (this.data.draftUsername || "").trim() || DEFAULT_PROFILE_NAME
    const rawAvatar = (this.data.draftAvatar || "").trim() || DEFAULT_PROFILE_AVATAR

    this.setData({ submitting: true })
    try {
      const avatar = await this.ensurePersistedAvatar(rawAvatar, this.data.avatarChanged)
      const profile: WxUserProfile = { username, avatar }

      await updateWxProfileApi({
        username: profile.username,
        avatar: profile.avatar,
      })
      updateWxUserProfileInCacheToken(profile)
      this.setData({
        userProfile: getWxUserProfileFromStorage(),
        showEditor: false,
      })
      wx.showToast({
        title: "保存成功",
        icon: "success",
      })
    } catch (error) {
      console.error("sync wx profile failed:", error)
      wx.showToast({
        title: "同步失败，可稍后重试",
        icon: "none",
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async ensurePersistedAvatar(avatar: string, avatarChanged: boolean) {
    if (!avatar) {
      return DEFAULT_PROFILE_AVATAR
    }
    if (!avatarChanged) {
      return avatar
    }
    if (avatar.indexOf("http://") === 0 || avatar.indexOf("https://") === 0) {
      const localPath = await this.downloadAvatarFile(avatar)
      return uploadFileApi(localPath)
    }
    return uploadFileApi(avatar)
  },

  downloadAvatarFile(url: string) {
    return new Promise<string>((resolve, reject) => {
      wx.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode !== 200 || !res.tempFilePath) {
            reject(new Error("头像下载失败"))
            return
          }
          resolve(res.tempFilePath)
        },
        fail: (error) => reject(error),
      })
    })
  },
})
