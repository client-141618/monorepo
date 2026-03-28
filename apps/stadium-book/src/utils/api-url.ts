const normalizeApiBaseUrl = (baseUrl: string) => {
  const value = baseUrl.trim()
  if (!value) return "/"
  if (value !== "/" && value.endsWith("/")) {
    return value.slice(0, -1)
  }
  return value
}

export const getApiBaseUrl = () => {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || "/")
}

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl()
  if (baseUrl === "/") return path
  return `${baseUrl}${path}`
}
