import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Analyzer from './pages/Analyzer';
import Report from './pages/Report';
import Recommendations from './pages/Recommendations';
import Builder from './pages/Builder';
import Dashboard from './pages/Dashboard';
import Compare from './pages/Compare';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col bg-ink-950">
          <Navbar />
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/analyzer" element={<ProtectedRoute><Analyzer /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
                <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                <Route path="/report/:id/improve" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
                <Route path="/report/:id/builder" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
