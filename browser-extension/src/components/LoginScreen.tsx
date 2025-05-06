import React, { useState } from 'react';

// Validation helpers
const validateUsername = (username: string) => {
  // Username should be at least 3 characters long and contain only alphanumeric characters
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

const validateEmail = (email: string) => {
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string) => {
  // Password should be at least 8 characters long
  return password.length >= 8;
};

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup?: (userData: { username: string; email: string; password: string; displayName?: string }) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  error?: string;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  onSignup,
  onGoogleLogin, 
  error, 
  isLoading 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation errors
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validate form on input change
  const validateField = (field: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch(field) {
      case 'username':
        if (isSignUp && !validateUsername(value)) {
          errors.username = 'Username must be at least 3 characters and contain only letters, numbers, and underscores';
        }
        break;
      case 'email':
        if (!validateEmail(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!validatePassword(value)) {
          errors.password = 'Password must be at least 8 characters long';
        }
        break;
      case 'confirmPassword':
        if (value !== password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      ...errors
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: {[key: string]: string} = {};
    
    if (isSignUp) {
      // Validate all fields for signup
      if (!validateUsername(username)) {
        errors.username = 'Username must be at least 3 characters and contain only letters, numbers, and underscores';
      }
      
      if (!validateEmail(email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!validatePassword(password)) {
        errors.password = 'Password must be at least 8 characters long';
      }
      
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      // If there are validation errors, show them and don't submit
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      
      // Handle signup using the onSignup prop if provided
      if (onSignup) {
        onSignup({
          username,
          email,
          password,
          displayName
        });
      } else {
        // Fallback if onSignup is not provided
        console.log('Sign up with:', { username, email, displayName, password });
        // After successful signup, switch to login screen and prefill the username
        setIsSignUp(false);
        // Clear form errors
        setFormErrors({});
      }
    } else {
      // For login, we'll validate on the server side
      onLogin(username, password);
    }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    // Reset form fields
    setUsername('');
    setPassword('');
    setEmail('');
    setDisplayName('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white p-4">
      <div className="mb-6 flex justify-center">
        <div className="flex items-center">
          <div className="w-10 h-10 mr-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.766 30C10.639 30 7.29102 26.6 7.29102 22.4C7.29102 18.2 10.639 14.8 14.766 14.8C18.893 14.8 22.241 18.2 22.241 22.4C22.241 26.6 18.893 30 14.766 30Z" fill="#CDBCAB"/>
              <path d="M16.957 26.3999C19.8696 26.3999 22.2406 23.9999 22.2406 20.9999C22.2406 17.9999 19.8696 15.5999 16.957 15.5999C14.0443 15.5999 11.6733 17.9999 11.6733 20.9999C11.6733 23.9999 14.0443 26.3999 16.957 26.3999Z" fill="#1A1A1A"/>
              <path d="M20.0002 9.60001C24.4184 9.60001 28.0002 11.1529 28.0002 13.0667C28.0002 14.9804 24.4184 16.5333 20.0002 16.5333C15.582 16.5333 12.0002 14.9804 12.0002 13.0667C12.0002 11.1529 15.582 9.60001 20.0002 9.60001Z" fill="#CDBCAB"/>
              <path d="M28 14C32.4183 14 36 15.5529 36 17.4667C36 19.3804 32.4183 20.9333 28 20.9333C23.5817 20.9333 20 19.3804 20 17.4667C20 15.5529 23.5817 14 28 14Z" fill="#CDBCAB"/>
            </svg>
          </div>
          <div className="text-3xl font-light text-[#CDBCAB]">
            <span className="font-normal">Vyna</span>
            <span className="text-sm align-top ml-0.5">.live</span>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <h1 className="text-xl font-medium">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="text-white/60 text-sm">{isSignUp ? 'Sign up to get started with Vyna' : 'Sign in to access your Vyna account'}</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-white">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-white/80 mb-1">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-2.5 bg-[#2a2a2a] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#a67d44] focus:border-[#a67d44]"
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1">Username or Email</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (isSignUp) validateField('username', e.target.value);
            }}
            onBlur={() => {
              if (isSignUp) validateField('username', username);
            }}
            className={`w-full p-2.5 bg-[#2a2a2a] border ${formErrors.username ? 'border-red-500' : 'border-[#333333]'} rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#a67d44] focus:border-[#a67d44]`}
            placeholder="Enter your username or email"
            required
          />
          {formErrors.username && (
            <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>
          )}
        </div>
        
        {isSignUp && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateField('email', e.target.value);
              }}
              onBlur={() => validateField('email', email)}
              className={`w-full p-2.5 bg-[#2a2a2a] border ${formErrors.email ? 'border-red-500' : 'border-[#333333]'} rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#a67d44] focus:border-[#a67d44]`}
              required
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
            )}
          </div>
        )}
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-white/80">Password</label>
            {!isSignUp && (
              <a href="#" className="text-[#a67d44] text-xs hover:underline">Forgot password?</a>
            )}
          </div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (isSignUp) {
                validateField('password', e.target.value);
                if (confirmPassword) validateField('confirmPassword', confirmPassword);
              }
            }}
            onBlur={() => {
              if (isSignUp) validateField('password', password);
            }}
            className={`w-full p-2.5 bg-[#2a2a2a] border ${formErrors.password ? 'border-red-500' : 'border-[#333333]'} rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#a67d44] focus:border-[#a67d44]`}
            required
          />
          {formErrors.password && (
            <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
          )}
        </div>
        
        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateField('confirmPassword', e.target.value);
              }}
              onBlur={() => validateField('confirmPassword', confirmPassword)}
              className={`w-full p-2.5 bg-[#2a2a2a] border ${formErrors.confirmPassword ? 'border-red-500' : 'border-[#333333]'} rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#a67d44] focus:border-[#a67d44]`}
              required
            />
            {formErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{formErrors.confirmPassword}</p>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-[#a67d44] text-white rounded-lg font-medium hover:bg-[#8e6a39] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? (
            <><span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span> {isSignUp ? 'Creating account...' : 'Signing in...'}</>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>
      
      {!isSignUp && (
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#333333]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#1a1a1a] px-2 text-sm text-white/60">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={onGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 bg-[#2a2a2a] text-white rounded-lg font-medium border border-[#333333] hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-sm text-white/60">
          {isSignUp ? (
            <>Already have an account? <button onClick={toggleSignUp} className="text-[#a67d44] hover:underline">Sign in</button></>
          ) : (
            <>Don't have an account? <button onClick={toggleSignUp} className="text-[#a67d44] hover:underline">Create one</button></>
          )}
        </p>
      </div>
      
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-white/40">
          By {isSignUp ? 'signing up' : 'signing in'}, you agree to our <a href="https://vynalive.com/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a> and <a href="https://vynalive.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;