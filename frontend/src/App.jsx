import React, { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
const MeetingPage = lazy(() => import('./pages/MeetingPage'))
const MeetingRoom = lazy(() => import('./pages/MeetingRoom'))
import ProfilePage from './pages/ProfilePage'
import AdminAnnouncements from './pages/AdminAnnouncements'

import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'

import { Loader } from "lucide-react"
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth])

  console.log("AuthUser", onlineUsers)

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme || 'light');
      // also set on body fallback
      document.body.setAttribute('data-theme', theme || 'light');
    }
  }, [theme])

  if (isCheckingAuth && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader className='size-10 animate-spin' />
      </div>
    )
  }
  

  return (
    <div data-theme={theme} className="min-h-screen pt-20">
      <Navbar />
      <Suspense fallback={<div className='p-8 text-center'>Loading...</div>}>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ?<SignupPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ?<LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/meeting/:id" element={<MeetingRoom />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/admin/announcements" element={authUser ? <AdminAnnouncements /> : <Navigate to="/login" />} />
      </Routes>
      </Suspense>

      <Toaster />
    </div>
  )
}

export default App