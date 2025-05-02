import React, { useState } from 'react';

export interface AuthPageProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  error?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
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

    onLogin({ username, password });
  };

  return (
    <div className="vyna-auth-page">
      <div className="vyna-auth-header">
        <h1>Vyna.live Assistant</h1>
        <p className="vyna-auth-subtitle">
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      <div className="vyna-auth-content">
        <form className="vyna-auth-form" onSubmit={handleSubmit}>
          <div className="vyna-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="vyna-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {(error || localError) && (
            <div className="vyna-error-message">
              {error || localError}
            </div>
          )}

          <button 
            type="submit" 
            className="vyna-auth-button"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="vyna-auth-switch">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button 
                className="vyna-text-button"
                onClick={() => setMode('register')}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                className="vyna-text-button"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>

      <style>{`
        .vyna-auth-page {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        .vyna-auth-header {
          padding: 24px 16px;
          background-color: var(--vyna-primary);
          color: white;
          text-align: center;
        }

        .vyna-auth-header h1 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .vyna-auth-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }

        .vyna-auth-content {
          flex: 1;
          padding: 24px 16px;
          overflow-y: auto;
        }

        .vyna-auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .vyna-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vyna-form-group label {
          font-size: 14px;
          font-weight: 500;
        }

        .vyna-form-group input {
          padding: 10px 12px;
          border: 1px solid var(--vyna-border);
          border-radius: 6px;
          font-size: 14px;
        }

        .vyna-auth-button {
          margin-top: 8px;
          padding: 12px 16px;
          background-color: var(--vyna-secondary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .vyna-auth-button:hover {
          background-color: #906c38;
        }

        .vyna-auth-switch {
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
        }

        .vyna-text-button {
          background: none;
          border: none;
          color: var(--vyna-secondary);
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
        }

        .vyna-text-button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
