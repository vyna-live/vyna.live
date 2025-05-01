import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGoogle } from 'react-icons/fa';

export default function Auth() {
  const [, navigate] = useLocation();
  const { isAuthenticated, login, register, loginWithGoogle, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Get the referrer from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get('referrer') || '/';
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    usernameOrEmail: '',
    password: '',
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  
  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle registration form changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(loginForm);
      navigate(referrer);
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };
  
  // Handle registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: 'Registration Failed',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        displayName: registerForm.displayName || undefined,
      });
      navigate(referrer);
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    }
  };
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // No navigation needed as the page will redirect
    } catch (error) {
      toast({
        title: 'Google Login Failed',
        description: 'An error occurred while logging in with Google',
        variant: 'destructive',
      });
    }
  };
  
  // Redirect if already authenticated
  if (isAuthenticated && !isLoading) {
    navigate(referrer);
    return null;
  }
  
  return (
    <div className="min-h-screen bg-[#000000] flex">
      {/* Left panel (Auth form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo variant="light" size="md" />
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign in to your account</CardTitle>
                  <CardDescription>
                    Enter your username or email and password to continue
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="usernameOrEmail">Username or Email</Label>
                      <Input
                        id="usernameOrEmail"
                        name="usernameOrEmail"
                        type="text"
                        placeholder="Enter your username or email"
                        value={loginForm.usernameOrEmail}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-xs text-[#D8C6AF] hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <FaGoogle className="text-red-500" />
                      Sign in with Google
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#D8C6AF] text-black hover:bg-[#C6B399]" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your information to create a new account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegisterSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name (optional)</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        type="text"
                        placeholder="Enter your display name"
                        value={registerForm.displayName}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <FaGoogle className="text-red-500" />
                      Sign up with Google
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#D8C6AF] text-black hover:bg-[#C6B399]" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right panel (Hero) */}
      <div className="hidden lg:block lg:w-1/2 bg-[#121212] p-8 flex flex-col justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-4xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-[#5D1C34] via-[#A67D44] to-[#CDBCAB] text-transparent bg-clip-text">
            Stream with confidence
          </h1>
          <div className="mb-6">
            <img 
              src="/images/view.jpg" 
              alt="Streaming illustration" 
              className="rounded-md w-full max-w-md mx-auto object-cover h-64"
            />
          </div>
          <p className="text-zinc-400 mb-8">
            Join our community of content creators and make your voice heard. With our AI-powered tools, you can create professional live streams with ease.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-md bg-zinc-900">
              <h3 className="text-white font-medium mb-2">Real-time Collaboration</h3>
              <p className="text-zinc-400 text-sm">Connect with your audience in real-time and get instant feedback.</p>
            </div>
            <div className="p-4 rounded-md bg-zinc-900">
              <h3 className="text-white font-medium mb-2">AI-Powered Tools</h3>
              <p className="text-zinc-400 text-sm">Enhance your streams with smart tools and automatic content suggestions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
