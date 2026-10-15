import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import Nav from './components/Nav'
import { RedirectIfAuthed, RequireAuth } from './components/guards'
import LandingPage from './pages/Landing'
import SignupPage from './pages/Signup'
import LoginPage from './pages/Login'
import VerifyPage from './pages/Verify'
import ForgotPasswordPage from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPassword'
import DashboardPage from './pages/Dashboard'
import SettingsPage from './pages/Settings'
import TodayPage from './pages/TodayPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#faf6ef] text-[#3e342c]">
          <Nav />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
              <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed>} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path="/today" element={<RequireAuth><TodayPage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="*" element={<p className="py-20 text-center">Page not found.</p>} />
            </Routes>
          </main>
          <footer className="border-t border-[#e7dcc8] py-6 text-center text-xs text-[#8a7a65]">
            Life · your data stays yours
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
