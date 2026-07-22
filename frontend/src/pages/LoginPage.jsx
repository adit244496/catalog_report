import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api';
import headerGraphic from '../assets/header_graphic.png';
import ambujaLogo from '../assets/ambuja_logo.png';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Reset Password State
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await api.post('/auth/login', {
        username,
        password
      });
      
      const { access_token, is_first_login } = res.data;
      
      if (is_first_login) {
        setTempToken(access_token);
        setIsResetting(true);
        setError('');
        return;
      }
      
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      onLogin(access_token, meRes.data.role, meRes.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await api.post('/auth/reset-password', 
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      
      // Reset successful, force them to login again
      setIsResetting(false);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTempToken('');
      setError('Password reset successfully! Please login with your new password.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  return (
    <div className="login-container" style={{ '--bg-graphic': `url(${headerGraphic})` }}>
      <div className="login-overlay"></div>

      <div className="login-card animate-slide-up">
        <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
          <img src={ambujaLogo} alt="Ambuja Neotia" className="login-logo" />
          <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.3em', color: '#0f172a', margin: 0, fontWeight: 700, opacity: 0.8 }}>CATALOGUE PORTAL</h2>
        </div>
        
        {error && <div className="login-error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 600 }}>{error}</div>}
        
        {!isResetting ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>USERNAME</label>
              <input 
                type="text" 
                className="login-input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter your username"
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="login-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  style={{ paddingRight: '48px' }}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="login-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              SIGN IN
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="login-form">
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
              Welcome! Please set a new password to continue.
            </p>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>NEW PASSWORD</label>
              <input 
                type="password" 
                className="login-input" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Enter new password"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>CONFIRM PASSWORD</label>
              <input 
                type="password" 
                className="login-input" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password"
                required 
              />
            </div>
            <button type="submit" className="login-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              RESET PASSWORD
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
