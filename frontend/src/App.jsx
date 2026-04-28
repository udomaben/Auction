import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { AuthProvider, useAuth } from './contexts/AuthContext'  // ← Fixed: added useAuth
import { SocketProvider } from './contexts/SocketContext'

// Layout
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Pages
import Home from './pages/Home'
import AuctionDetail from './pages/AuctionDetail'
import AuctionLive from './pages/AuctionLive'
import Login from './pages/Login'
import Register from './pages/Register'

// Dashboard Pages
import AuctioneerDashboard from './pages/AuctioneerDashboard/Dashboard'
import CreateAuction from './pages/AuctioneerDashboard/CreateAuction'
import ManageLots from './pages/AuctioneerDashboard/ManageLots'
import BuyerDashboard from './pages/BuyerDashboard/Dashboard'
import MyBids from './pages/BuyerDashboard/MyBids'
import WonAuctions from './pages/BuyerDashboard/WonAuctions'
import Watchlist from './pages/BuyerDashboard/Watchlist'
import AdminDashboard from './pages/AdminDashboard/Dashboard'
import UsersManagement from './pages/AdminDashboard/UsersManagement'
import Analytics from './pages/AdminDashboard/Analytics'
import Profile from './pages/Profile'  // ← Add this if you have Profile page

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth()  // Now this works because useAuth is imported
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Helmet>
            <title>Auction Platform | Bid on Special Objects</title>
            <meta name="description" content="Online auction marketplace featuring unique objects selected by experts. Bid on art, jewelry, watches, collectibles and more." />
          </Helmet>
          
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auction/:id" element={<AuctionDetail />} />
                <Route path="/auction/:id/live" element={<AuctionLive />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Auctioneer Routes */}
                <Route path="/auctioneer/dashboard" element={
                  <ProtectedRoute allowedRoles={['auctioneer', 'admin']}>
                    <AuctioneerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/auctioneer/create-auction" element={
                  <ProtectedRoute allowedRoles={['auctioneer', 'admin']}>
                    <CreateAuction />
                  </ProtectedRoute>
                } />
                <Route path="/auctioneer/manage-lots/:auctionId" element={
                  <ProtectedRoute allowedRoles={['auctioneer', 'admin']}>
                    <ManageLots />
                  </ProtectedRoute>
                } />
                
                {/* Buyer Routes */}
                <Route path="/buyer/dashboard" element={
                  <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                    <BuyerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/bids" element={
                  <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                    <MyBids />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/won" element={
                  <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                    <WonAuctions />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/watchlist" element={
                  <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                    <Watchlist />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UsersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                
                {/* Profile Route */}
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['buyer', 'auctioneer', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App