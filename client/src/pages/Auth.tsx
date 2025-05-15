import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  UserPlus, 
  LogIn, 
  Mail, 
  Lock, 
  User, 
  AlertCircle,
  Eye,
  EyeOff,
  Wallet 
} from 'lucide-react';
import Logo from '@/components/Logo';
import RegisterConfirmation from '@/components/auth/RegisterConfirmation';

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
  const [walletLoading, setWalletLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get('referrer') || '/';
  const emailVerified = urlParams.get('emailVerified') === 'true';

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

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setError(null);
      setWalletLoading(true);
      // Temporary placeholder - we'll implement this functionality later
      setError("Web3 wallet connection is not available yet. Please use email/password login.");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle embedded wallet creation
  const handleCreateEmbeddedWallet = async () => {
    try {
      setError(null);
      setWalletLoading(true);
      // Temporary placeholder - we'll implement this functionality later
      setError("Web3 wallet creation is not available yet. Please use email/password login.");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle email connection - simplified version
  const handleConnectEmail = async (email: string) => {
    try {
      setError(null);
      setWalletLoading(true);
      // For now, show a message about using traditional login
      setError("Please use the regular login form with your email and password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect with email');
    } finally {
      setWalletLoading(false);
    }
  };

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Registration form submission
  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await register(data);
      
      // Show verification email sent toast notification
      toast({
        title: "Registration Successful",
        description: "A verification email has been sent to your email address. Please check your inbox to verify your account.",
        variant: "default",
      });
      
      // Show registration success message
      setRegisteredEmail(data.email);
      setRegistrationSuccess(true);
      
      // Switch to login tab for when they dismiss the confirmation
      setActiveTab('login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Show registration success screen instead of the form
  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen bg-black">
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <RegisterConfirmation 
            email={registeredEmail} 
            onClose={() => setRegistrationSuccess(false)} 
          />
        </div>
      </div>
    );
  }

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
            
            {/* Email verification success message */}
            {emailVerified && (
              <Alert variant="default" className="bg-green-900/20 border-green-900/50">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <AlertDescription className="text-green-500">
                  Your email has been verified successfully. You can now log in.
                </AlertDescription>
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
                    disabled={loginForm.formState.isSubmitting || walletLoading}
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
                  
                  <div className="mt-4 text-center">
                    <a 
                      href="/forgot-password" 
                      className="text-sm text-zinc-400 hover:text-[#A67D44] transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/forgot-password');
                      }}
                    >
                      Forgot your password?
                    </a>
                  </div>
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
                    disabled={registerForm.formState.isSubmitting || walletLoading}
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
