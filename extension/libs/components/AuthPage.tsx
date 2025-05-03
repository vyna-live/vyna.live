import React, { useState } from 'react';
import { login, register } from '@libs/utils/api';
import { setAuthData, StoredAuthData } from '@libs/utils/storage';
import Logo from './ui/Logo';

interface AuthPageProps {
  onLoginSuccess: (data: StoredAuthData) => void;
  error?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, error = null }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const userData = await login({ username, password });
        const authData: StoredAuthData = {
          token: userData.token,
          userId: userData.id,
          username: userData.username,
          displayName: userData.displayName,
          lastLogin: new Date().toISOString()
        };
        await setAuthData(authData);
        onLoginSuccess(authData);
      } else {
        // Registration
        if (!email) {
          throw new Error('Email is required');
        }
        
        const userData = await register({ username, password, email, displayName });
        
        // Automatically log in after registration
        const loginData = await login({ username, password });
        const authData: StoredAuthData = {
          token: loginData.token,
          userId: loginData.id,
          username: loginData.username,
          displayName: loginData.displayName,
          lastLogin: new Date().toISOString()
        };
        await setAuthData(authData);
        onLoginSuccess(authData);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="logo-container">
          <Logo size="medium" variant="default" />
        </div>
        
        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        
        {displayError && (
          <div className="error-message">{displayError}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-toggle">
          <button 
            type="button" 
            className="btn-link" 
            onClick={toggleAuthMode}
            disabled={isLoading}
          >
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
      
      <div className="auth-info">
        <div className="info-content">
          <h2>Vyna AI Assistant</h2>
          <p>Access your Vyna AI Assistant directly from your browser. Get AI-powered commentary and assistance while you browse the web.</p>
          
          <ul className="feature-list">
            <li>AI Chat with play-by-play and color commentary</li>
            <li>Notepad for saving and organizing your ideas</li>
            <li>Page context awareness for relevant assistance</li>
            <li>Seamless sync with your Vyna account</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
