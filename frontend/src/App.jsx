import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Result from './pages/Result'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import About from './pages/About'
import Login from './pages/Login'
import Layout from './components/Layout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login isRegister={false} />} />
        <Route path="/register" element={<Login isRegister={true} />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="result" element={<Result />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="learn" element={<Learn />} />
          <Route path="about" element={<About />} />
        </Route>
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
