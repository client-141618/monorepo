import { Menu } from "antd"
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { convertToMenuItems, getRoutePathMap, routeConfigs } from '@/router/module/config'
import "./SideMenu.css"

export default function SideMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [openKeys, setOpenKeys] = useState<string[]>([])

  useEffect(() => {
    const path = location.pathname
    const pathMap = getRoutePathMap(routeConfigs)
    
    // 找到所有匹配的路径，优先匹配最长的路径
    const matchedEntries = Object.entries(pathMap).filter(([, routePath]) => {
      return path === routePath || path.startsWith(routePath + '/')
    })
    
    // 按路径长度降序排序，选择最长的匹配路径
    const matchedKey = matchedEntries
      .sort(([, a], [, b]) => b.length - a.length)[0]?.[0]

    if (matchedKey) {
      setSelectedKeys([matchedKey])
      
      const parentConfig = routeConfigs.find(config => 
        config.children?.some(child => child.key === matchedKey)
      )
      if (parentConfig) {
        setOpenKeys([parentConfig.key])
      }
    }
  }, [location.pathname])

  const handleMenuClick = ({ key }: { key: string }) => {
    const pathMap = getRoutePathMap(routeConfigs)
    const path = pathMap[key]
    
    if (path) {
      navigate(path)
      setSelectedKeys([key])
    }
  }

  const userPermissions = [
    'home',
    'permission:view',
    'permission:dashboard:view',
    'permission:overview:view',
    'user:view',
    'user:list:view',
    'user:inactive:view',
  ]

  const menuItems = convertToMenuItems(routeConfigs, userPermissions)

  return (
    <>
      <div className="h-full flex flex-col select-none">
        <div className="logo">React新闻项目</div>
        <Menu
          style={{ height: "100%", borderRight: 0 }}
          theme="light"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </div>
    </>
  );
}
