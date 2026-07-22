import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import { useState, useEffect } from 'react';
import api from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    // Check session storage for token on load
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const name = sessionStorage.getItem('username');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
      if (name) {
        setUserName(name);
      } else {
        // Session started before the username was stored - fetch it once
        api.get('/auth/me')
          .then(res => {
            sessionStorage.setItem('username', res.data.username);
            setUserName(res.data.username);
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleLogin = (token, role, username) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('role', role);
    if (username) sessionStorage.setItem('username', username);
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(username || null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
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
              <CataloguePage isAuthenticated={isAuthenticated} onLogout={handleLogout} userRole={userRole} userName={userName} />
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
