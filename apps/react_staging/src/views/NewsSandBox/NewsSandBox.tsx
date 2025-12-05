import SideMenu from './SideMenu/SideMenu'
import TopHeader from './TopHeader/TopHeader'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Button, Layout, theme } from 'antd'

const { Header, Sider, Content } = Layout;

export default function NewsSandBox() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout className="h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <SideMenu/>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px 0 0', background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <TopHeader/>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet/>
        </Content>
      </Layout>
    </Layout>
  )
}
