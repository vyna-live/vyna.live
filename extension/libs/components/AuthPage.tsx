import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (user: any, token: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const requestBody = isLogin 
        ? { username, password } 
        : { username, email, password };

      const response = await fetch(`https://vyna.live${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      // Store user data and token
      onLogin(data, data.token || 'token-placeholder');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-black text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/assets/icon-128.png" alt="Vyna.live" className="h-12 w-12 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Vyna.live Assistant</h1>
          <p className="text-zinc-400 text-sm">AI-powered research and notes for streamers</p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-4">
          <div className="flex mb-4">
            <button
              className={`flex-1 py-2 text-center text-sm font-medium ${isLogin ? 'text-white border-b-2 border-primary' : 'text-zinc-400'}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm font-medium ${!isLogin ? 'text-white border-b-2 border-primary' : 'text-zinc-400'}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                required
              />
            </div>

            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary text-black font-medium rounded"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;