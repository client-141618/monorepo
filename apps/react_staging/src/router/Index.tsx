import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/views/Login/Login'
import NewsSandBox from '@/views/NewsSandBox/NewsSandBox'
import NotFound from '@/views/components/NotFound/NotFound'
import { HomeRoute, UserListRoute, PermissionRoute } from './module'

export default function Index() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            localStorage.getItem('token')
              ? <NewsSandBox />
              : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          {HomeRoute}
          {UserListRoute}
          {PermissionRoute}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
