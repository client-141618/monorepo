import { HomeOutlined } from '@ant-design/icons'
import type { RouteConfig } from '../type'

export const homeConfig: RouteConfig = {
  key: 'home',
  title: '首页',
  icon: <HomeOutlined />,
  path: '/home',
  permission: 'home',
}

