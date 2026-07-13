import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check session storage for token on load
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (token, role) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <CataloguePage isAuthenticated={isAuthenticated} onLogout={handleLogout} userRole={userRole} />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminDashboard onLogout={handleLogout} userRole={userRole} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
