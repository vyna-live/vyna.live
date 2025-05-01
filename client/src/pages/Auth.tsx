import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, LogIn, Mail, Lock, User, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';

// Login form schema
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading, login, register, loginWithGoogle } = useAuth();
  const [location, navigate] = useLocation();

  // Get referrer from URL to redirect after login
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get('referrer') || '/';

  // Initialize login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  // Initialize registration form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(referrer);
    }
  }, [isAuthenticated, isLoading, navigate, referrer]);

  // Login form submission
  const handleLoginSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
      navigate(referrer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  // Registration form submission
  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await register(data);
      navigate(referrer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      // The redirect will happen automatically via Google OAuth
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login with Google');
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left side - Authentication form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <Logo variant="light" size="md" className="h-8" />
          </div>
          
          {/* Authentication container */}
          <div className="space-y-6">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Welcome to Vyna.live</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Sign in to start streaming or create a new account.
              </p>
            </div>
            
            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Tabs for login/register */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
              <TabsList className="w-full bg-zinc-800/50">
                <TabsTrigger className="w-1/2" value="login">Login</TabsTrigger>
                <TabsTrigger className="w-1/2" value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login form */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usernameOrEmail" className="text-zinc-300">Username or Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                      <Input
                        id="usernameOrEmail"
                        placeholder="Enter username or email"
                        className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                        {...loginForm.register('usernameOrEmail')}
                      />
                    </div>
                    {loginForm.formState.errors.usernameOrEmail && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.usernameOrEmail.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                        {...loginForm.register('password')}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#A67D44] hover:bg-[#8A6838] text-white"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign in
                      </>
                    )}
                  </Button>
                
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-black px-2 text-zinc-500">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-zinc-800 text-white hover:bg-zinc-900 hover:text-white"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>
              
              {/* Registration form */}
              <TabsContent value="register" className="mt-6">
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-zinc-300">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                      <Input
                        id="username"
                        placeholder="Choose a username"
                        className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                        {...registerForm.register('username')}
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                        {...registerForm.register('email')}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-zinc-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                        {...registerForm.register('password')}
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#A67D44] hover:bg-[#8A6838] text-white"
                    disabled={registerForm.formState.isSubmitting}
                  >
                    {registerForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create account
                      </>
                    )}
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-black px-2 text-zinc-500">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-zinc-800 text-white hover:bg-zinc-900 hover:text-white"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Right side - Hero image/content */}
      <div className="hidden lg:block lg:flex-1 relative bg-gradient-to-br from-[#5D1C34] via-[#A67D44] to-[#CDBCAB]">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 flex flex-col justify-center px-12 text-white">
          <h1 className="text-4xl font-bold mb-4">Research first, go live next!</h1>
          <p className="text-lg mb-6">
            Vyna.live enhances your streaming experience with AI-powered research tools and a built-in teleprompter.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Advanced live streaming with Agora and GetStream
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              AI-powered teleprompter for content creators
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Upload and analyze research documents on the fly
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Enhanced audience interaction with live chat
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
