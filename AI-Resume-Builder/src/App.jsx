import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from './components/ui/button'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Header from './components/custom/Header'
import { Toaster } from './components/ui/sonner'

function App() {
  const [count, setCount] = useState(0)
  const { user, loading, token } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!token) {
    return <Navigate to={'/auth/sign-in'} />
  }

  return (
    <>
      <Header />
      <Outlet />
      <Toaster />
    </>
  )
}

export default App
