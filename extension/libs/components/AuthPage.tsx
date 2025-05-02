import React, { useState } from 'react';
import '../../../popup/styles/popup.css';

export interface AuthPageProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  error?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username, password });
  };

  return (
    <div className="container">
      <div className="header">
        <h3>Vyna Assistant</h3>
      </div>

      <div className="content p-md">
        <div className="text-center mb-md">
          <h2 className="text-xl mb-xs">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-secondary">
            {isSignUp 
              ? 'Sign up to access Vyna AI Assistant features' 
              : 'Log in to your Vyna account to continue'}
          </p>
        </div>

        {error && (
          <div className="card bg-error p-sm mb-md">
            <p className="text-white">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {isSignUp && (
            <>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="displayName" className="form-label">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={!username || !password || (isSignUp && !email)}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-md">
          <p className="text-secondary text-sm">
            {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
            <button 
              type="button" 
              className="btn-text text-primary ml-xs"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      <div className="footer text-center">
        <p className="text-xs text-secondary">© 2025 Vyna.live</p>
      </div>

      <style>{`
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--vyna-spacing-xs);
        }

        .form-label {
          font-size: var(--vyna-font-sm);
          font-weight: 500;
          color: var(--vyna-text);
        }
        
        .ml-xs {
          margin-left: var(--vyna-spacing-xs);
        }
      `}</style>
    </div>
  );
};

export default AuthPage;