import type { UserInfo } from "@/api/user/types"
import { defineStore } from "pinia"
import { getCurrentUser, updateUserInfo } from "@/api/user"

export const useUserStore = defineStore("user", {
  state: () => ({
    userInfo: {} as UserInfo,
  }),
  actions: {
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo || {}
    },
    async getUserInfo() {
      const res = await getCurrentUser()
      if (res.code === 200 && res.data) {
        this.userInfo = res.data as UserInfo
      }
    },
    async updateUserInfo(userInfo: UserInfo) {
      const res = await updateUserInfo(userInfo)
      if (res.code === 200 && res.data) {
        this.userInfo = res.data as UserInfo
      }
      return res
    },
  },
})
