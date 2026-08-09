import { lazy, Suspense, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { analyticsApi } from './utils/api'
import './App.css'

const BrightColorfulDemo = lazy(() => import('./components/demos/BrightColorfulDemo'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'))
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// GitHub Pages 子路径部署时，路由需要匹配 base（如 /my-blog）
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
    <div className="text-center">
      <div className="mx-auto mb-6 rounded-full animate-spin" style={{ width: 40, height: 40, border: '2px solid var(--c-border)', borderTopColor: 'var(--c-accent)' }} />
      <p style={{ color: 'var(--c-text-muted)', fontWeight: 500, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Loading</p>
    </div>
  </div>
)

/** 页面访问统计上报（路由变化时调用 /api/analytics/track） */
const PageTracker: React.FC = () => {
  const location = useLocation()
  useEffect(() => {
    analyticsApi.track(location.pathname, document.referrer || '').catch(() => {})
  }, [location.pathname])
  return null
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter basename={routerBasename}>
              <PageTracker />
              <a href="#main-content" className="skip-link">Skip to content</a>
              <div className="grain" aria-hidden="true" />
              <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/" element={<BrightColorfulDemo />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/articles" element={<ArticlesPage />} />
                    <Route path="/article/:id" element={<ArticleDetailPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App
