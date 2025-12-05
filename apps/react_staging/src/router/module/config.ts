import { permissionConfig } from './permission/config.tsx'
import { userListConfig } from './user-list/config.tsx'
import { homeConfig } from './home/config.tsx'
import type { RouteConfig } from './type'
import type { MenuProps } from 'antd'

export const routeConfigs: RouteConfig[] = [
  homeConfig,
  userListConfig,
  permissionConfig
]

// 将路由配置转换为菜单项
export const convertToMenuItems = (configs: RouteConfig[], permissions?: string[]): MenuProps['items'] => {
  const checkPermission = (permission?: string) => {
    if (!permission) return true
    if (!permissions) return true
    return permissions.includes(permission)
  }

  return configs
    .filter(config => checkPermission(config.permission))
    .map(config => {
      const filteredChildren = config.children && config.children.length > 0
        ? config.children.filter(child => checkPermission(child.permission))
        : []

      if (filteredChildren.length === 1) {
        const child = filteredChildren[0]
        return {
          key: child.key,
          label: child.title,
          icon: child.icon || config.icon,
        }
      }

      const children = filteredChildren.length > 0
        ? filteredChildren.map(child => ({
            key: child.key,
            label: child.title,
            icon: child.icon,
          }))
        : undefined

      return {
        key: config.key,
        label: config.title,
        icon: config.icon,
        ...(children && children.length > 0 ? { children } : {}),
      }
    })
}

export const getRoutePathMap = (configs: RouteConfig[]): Record<string, string> => {
  const pathMap: Record<string, string> = {}
  
  const traverse = (config: RouteConfig) => {
    pathMap[config.key] = config.path
    if (config.children) {
      config.children.forEach(traverse)
    }
  }
  
  configs.forEach(traverse)
  return pathMap
}

