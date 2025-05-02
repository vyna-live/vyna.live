import React, { useState } from 'react';
import { login, register } from '@libs/utils/api';
import { storeUser, storeToken } from '@libs/utils/storage';
import Logo from '@libs/components/ui/Logo';

export interface AuthPageProps {
  onAuthenticated: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const userData = await login(username, password);
        
        if (userData.token) {
          await storeToken(userData.token);
          await storeUser(userData);
          onAuthenticated();
        } else {
          setError('Login failed. Invalid response from server.');
        }
      } else {
        // Register
        if (!username || !email || !password) {
          setError('Username, email and password are required.');
          setIsLoading(false);
          return;
        }
        
        const userData = await register({
          username,
          email,
          password,
          displayName: displayName || undefined,
        });
        
        if (userData.token) {
          await storeToken(userData.token);
          await storeUser(userData);
          onAuthenticated();
        } else {
          setError('Registration failed. Invalid response from server.');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Authentication failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex flex-col items-center px-5 py-8 min-h-full">
      <div className="mb-6">
        <Logo size={48} />
      </div>
      
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {isLogin ? 'Sign in to Vyna' : 'Create your Vyna account'}
      </h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 w-full max-w-sm text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
            minLength={6}
          />
        </div>
        
        {!isLogin && (
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">
              Display Name (optional)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </form>
      
      <p className="mt-6 text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary font-medium hover:underline"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
