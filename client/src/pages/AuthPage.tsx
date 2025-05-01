import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, Mail, User, ChevronRight, AtSign, Loader2, CheckCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import GradientText from '@/components/GradientText';

// Extend the user schema for the form
const loginSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
});

const registerSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters',
  }),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
  confirmPassword: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
  role: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const location = useLocation()[0];
  
  // Parse the redirect URL from query params if present
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const redirectUrl = searchParams.get('redirect') || '/';

  // Login form state
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form state
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: null,
      displayName: null,
      password: '',
      confirmPassword: '',
      role: 'user',
      isEmailVerified: false,
    },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation(redirectUrl);
    }
  }, [user, setLocation, redirectUrl]);

  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
      setLocation(redirectUrl);
    } catch (error) {
      console.error('Login error:', error);
      // Errors are handled in the useAuth hook via onError callbacks
    }
  };

  // Handle register form submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    // Remove the confirmPassword field before submitting
    const { confirmPassword, ...registerData } = data;
    
    try {
      await registerMutation.mutateAsync(registerData);
      toast({
        title: 'Registration successful',
        description: 'Your account has been created',
      });
      setLocation(redirectUrl);
    } catch (error) {
      console.error('Registration error:', error);
      // Errors are handled in the useAuth hook via onError callbacks
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFFFF] to-[#F9F5F0]">
      {/* Back button */}
      <div className="absolute top-8 left-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2 text-gray-500 hover:text-gray-800 hover:bg-transparent"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Button>
      </div>
      
      {/* Auth container */}
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <div className="grid w-full overflow-hidden lg:grid-cols-2 rounded-xl shadow-xl bg-white max-w-5xl">
          {/* Form section */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-between">
            <div>
              <div className="mb-8 flex items-center justify-center">
                <Logo size="lg" variant="full" className="w-auto h-10" />
              </div>
              
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                  {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="mt-3 text-gray-500">
                  {activeTab === 'login' 
                    ? 'Sign in to your account to continue'
                    : 'Fill out the form below to get started'}
                </p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login" className="data-[state=active]:font-semibold">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:font-semibold">
                    Register
                  </TabsTrigger>
                </TabsList>
                
                {/* Login form */}
                <TabsContent value="login" className="space-y-6">
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">
                          Username
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <AtSign className="h-5 w-5" />
                          </div>
                          <Input
                            id="login-username"
                            className="pl-10"
                            {...loginForm.register('username')}
                            autoComplete="username"
                          />
                        </div>
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">
                            Password
                          </Label>
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-sm"
                            type="button"
                            onClick={() => toast({
                              title: "Password Reset",
                              description: "Password reset functionality will be implemented soon."
                            })}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Lock className="h-5 w-5" />
                          </div>
                          <Input
                            id="login-password"
                            type="password"
                            className="pl-10"
                            {...loginForm.register('password')}
                            autoComplete="current-password"
                          />
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54] shadow-md hover:shadow-lg transition-all font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        Don't have an account?
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full font-medium" 
                    onClick={() => setActiveTab('register')}
                  >
                    Create an account
                  </Button>
                </TabsContent>
                
                {/* Register form */}
                <TabsContent value="register" className="space-y-6">
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">
                          Username
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <AtSign className="h-5 w-5" />
                          </div>
                          <Input
                            id="register-username"
                            className="pl-10"
                            {...registerForm.register('username')}
                            autoComplete="username"
                          />
                        </div>
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-displayName">
                          Full Name
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <User className="h-5 w-5" />
                          </div>
                          <Input
                            id="register-displayName"
                            className="pl-10"
                            {...registerForm.register('displayName')}
                            autoComplete="name"
                          />
                        </div>
                        {registerForm.formState.errors.displayName && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-email">
                          Email
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Mail className="h-5 w-5" />
                          </div>
                          <Input
                            id="register-email"
                            type="email"
                            className="pl-10"
                            {...registerForm.register('email')}
                            autoComplete="email"
                          />
                        </div>
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-password">
                          Password
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Lock className="h-5 w-5" />
                          </div>
                          <Input
                            id="register-password"
                            type="password"
                            className="pl-10"
                            {...registerForm.register('password')}
                            autoComplete="new-password"
                          />
                        </div>
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-confirmPassword">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Lock className="h-5 w-5" />
                          </div>
                          <Input
                            id="register-confirmPassword"
                            type="password"
                            className="pl-10"
                            {...registerForm.register('confirmPassword')}
                            autoComplete="new-password"
                          />
                        </div>
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54] shadow-md hover:shadow-lg transition-all font-medium"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        Already have an account?
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full font-medium" 
                    onClick={() => setActiveTab('login')}
                  >
                    Sign in instead
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500">
              By continuing, you agree to Vyna.live's Terms of Service and Privacy Policy.
            </div>
          </div>
          
          {/* Hero section */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5D1C34] to-[#A67D44]">
              <div className="absolute inset-0 opacity-10 bg-[url('@assets/vn.png')] bg-cover bg-center"></div>
            </div>
            <div className="relative h-full flex flex-col items-center justify-center text-white p-12">
              <div className="w-40 h-40 mb-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Logo size="lg" variant="color" className="w-auto h-20" />
              </div>
              
              <h2 className="text-3xl font-bold mb-6 text-center">
                Elevate Your Livestreams with AI
              </h2>
              
              <p className="text-xl mb-8 opacity-90 text-center">
                Join Vyna.live and unlock powerful tools for streamers
              </p>
              
              <div className="space-y-4 w-full max-w-md">
                <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-sm">AI-powered teleprompter for engaging content</div>
                </div>
                
                <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-sm">Professional streaming studio with research tools</div>
                </div>
                
                <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-sm">Stream to multiple platforms with ease</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
