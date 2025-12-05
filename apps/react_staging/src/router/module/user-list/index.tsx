import { Route } from 'react-router-dom'
import UserList from '@/views/components/UserList/UserList'

export const UserListRoute = (
  <Route path="user-list">
    <Route path="list" element={<UserList/>} />
    <Route path="inactive" element={<div>用户列表 - 非活跃用户（示例子页面）</div>} />
  </Route>
)

export default UserListRoute

