import React, { useState } from 'react';
import { login, register } from '../utils/api';
import '../../../popup/styles/popup.css';

export interface AuthPageProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  error?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Basic validation
    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }

    if (!password.trim()) {
      setLocalError('Password is required');
      return;
    }

    if (mode === 'register' && !email.trim()) {
      setLocalError('Email is required');
      return;
    }

    try {
      setIsLoading(true);
      
      if (mode === 'login') {
        // Call login API
        onLogin({ username, password });
      } else {
        // Call register API with additional fields
        const response = await register({
          username,
          password,
          email,
          displayName: displayName.trim() || username
        });
        
        if (response.success && response.data) {
          // Auto-login after successful registration
          onLogin({ username, password });
        } else {
          setLocalError(response.error || 'Registration failed');
        }
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2>Vyna.live Assistant</h2>
      </div>

      <div className="content p-md">
        <div className="card">
          <h3 className="text-center">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                className="form-input"
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="displayName">Display Name (optional)</label>
                  <input
                    className="form-input"
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className="form-input"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {(error || localError) && (
              <div className="form-error">
                {error || localError}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-secondary w-full mt-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-sm">
                  <span className="animate-spin">⟳</span> 
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="text-center m-md">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button 
                  className="btn-text"
                  onClick={() => setMode('register')}
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  className="btn-text"
                  onClick={() => setMode('login')}
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="footer text-center">
        <p className="text-sm text-secondary">
          © {new Date().getFullYear()} Vyna.live - All rights reserved
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
