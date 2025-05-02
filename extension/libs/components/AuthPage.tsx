import React, { useState } from 'react';
import { login, register } from '../utils/api';
import { setUserAuth } from '../utils/storage';
import Logo from './ui/Logo';

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isLogin) {
        // Handle login
        const response = await login(username, password);
        if (response.success && response.data) {
          await setUserAuth(response.data);
          onAuthSuccess(response.data.user);
        } else {
          setError(response.error || 'Login failed. Please check your credentials.');
        }
      } else {
        // Handle registration
        const response = await register(username, email, password);
        if (response.success && response.data) {
          await setUserAuth(response.data);
          onAuthSuccess(response.data.user);
        } else {
          setError(response.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 flex flex-col items-center">
      <div className="mb-4">
        <Logo size="large" />
      </div>
      
      <h1 className="text-primary font-medium text-xl mb-4">
        {isLogin ? 'Sign in to Vyna' : 'Create your Vyna account'}
      </h1>
      
      {error && (
        <div className="w-full bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            className="w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        {!isLogin && (
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button
          type="submit"
          className="btn btn-primary w-full mb-4"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : (
            <span>{isLogin ? 'Sign in' : 'Create account'}</span>
          )}
        </button>
        
        <div className="text-center text-sm">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="text-primary font-medium"
                onClick={() => setIsLogin(false)}
              >
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary font-medium"
                onClick={() => setIsLogin(true)}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
      
      <div className="text-xs text-gray-500 mt-6 text-center">
        By signing in, you agree to the Vyna Terms of Service and Privacy Policy.
      </div>
    </div>
  );
};

export default AuthPage;
