import { UserOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { RouteConfig } from '../type'

// 菜单配置
export const userListConfig: RouteConfig = {
  key: 'user-list',
  title: '用户管理',
  icon: <UserOutlined />,
  path: '/user-list',
  permission: 'user:view',
  children: [
    {
      key: 'user-list-list',
      title: '用户列表',
      path: '/user-list/list',
      permission: 'user:list:view',
      icon: <UnorderedListOutlined />
    },
    {
      key: 'user-list-inactive',
      title: '非活跃用户',
      path: '/user-list/inactive',
      permission: 'user:inactive:view',
    }
  ],
}

