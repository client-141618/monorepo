type SubscribeTemplateKey =
  | "teamSuccess"
  | "teamCanceled"
  | "reservationSuccess"
  | "reservationCanceled"

export function getSubscribeTemplateIds(keys: SubscribeTemplateKey[]) {
  const app = getApp<IAppOption>()
  const globalData = app.globalData
  const config = globalData ? globalData.subscribeMessageTemplateIds : null
  if (!config || !Array.isArray(keys) || !keys.length) {
    return [] as string[]
  }

  const templateIds: string[] = []
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]
    const value = config[key]
    if (typeof value === "string" && Boolean(value.trim())) {
      templateIds.push(value)
    }
  }
  return templateIds
}
