import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import CommentAnalysisPage from './pages/CommentAnalysisPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function ProtectedRoute({ session, children }) {
  if (session === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes({ session }) {
  const location = useLocation()
  const hideNavFooter = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-dark-900">
      {!hideNavFooter && <Navbar session={session} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute session={session}><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/comments" element={
          <ProtectedRoute session={session}><CommentAnalysisPage /></ProtectedRoute>
        } />
      </Routes>
      {!hideNavFooter && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a24', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_e, session) => setSession(session))
  }, [])

  return (
    <Router>
      <AppRoutes session={session} />
    </Router>
  )
}
