import { Route } from 'react-router-dom'
import Home from '@/views/components/Home/Home'

export const HomeRoute = (
  <Route path="home" element={<Home/>} />
)

export default HomeRoute

