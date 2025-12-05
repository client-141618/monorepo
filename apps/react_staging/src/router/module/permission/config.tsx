import { SettingOutlined, LockOutlined } from '@ant-design/icons'
import type { RouteConfig } from '../type'

export const permissionConfig: RouteConfig = {
  key: 'permission',
  title: '权限管理',
  icon: <SettingOutlined />,
  path: '/permission',
  permission: 'permission:view',
  children: [
    {
      key: 'permission-dashboard',
      icon: <LockOutlined />,
      title: '角色列表',
      path: '/permission/dashboard',
      permission: 'permission:dashboard:view',
    },
    {
      key: 'permission-overview',
      title: '权限列表',
      icon: <LockOutlined />,
      path: '/permission/overview',
      permission: 'permission:overview:view',
    }
  ],
}

