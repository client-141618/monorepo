import { Route } from 'react-router-dom'
import Home from '@/views/components/Home/Home'

export const PermissionRoute = (
  <Route path="permission">
    <Route path="dashboard" element={<Home/>} />
    <Route path="overview" element={<div>首页 - 概览（示例子页面）</div>} />
  </Route>
)

export default PermissionRoute

