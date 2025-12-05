import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import type { MenuProps } from 'antd'

export interface RouteConfig {
  key: string
  title: string
  icon?: ReactNode
  path: string
  permission?: string
  children?: RouteConfig[]
  route?: RouteObject
}

export type MenuItem = NonNullable<MenuProps['items']>[0]
