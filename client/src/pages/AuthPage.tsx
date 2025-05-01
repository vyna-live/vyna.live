import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Mail, Lock, User, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/Logo";
import GradientText from "@/components/GradientText";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3, {
    message: "Username or email must be at least 3 characters",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
  displayName: z.string().optional(),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
    },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(values);
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form */}
      <div className="w-full lg:w-1/2 flex flex-col px-6 lg:px-12 pt-8 pb-12 overflow-y-auto">
        <div className="mb-8">
          <Logo variant="full" size="lg" className="max-w-[180px]" />
        </div>

        <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5D1C34] to-[#A67D44] text-transparent bg-clip-text mb-2">
              {activeTab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[#6B7280]">
              {activeTab === "login"
                ? "Sign in to continue to Vyna.live"
                : "Join the Vyna.live streaming platform"}
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="usernameOrEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username or Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="your-username or you@example.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54]"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="your-username"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          This will be your unique identifier on Vyna.live
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Name"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          This is how you'll appear to others
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          At least 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54]"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Account
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero/Feature showcase */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#5D1C34] to-[#A67D44] items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <div className="mb-8">
            <GradientText 
              text="Vyna.live" 
              className="text-5xl font-bold" 
              gradientFrom="#CDBCAB" 
              gradientTo="#EFE9E1"
              showCursor={false}
            />
            <h2 className="text-3xl font-bold mt-4 mb-6">
              Enhance your streaming experience with AI-powered tools
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Create professional-quality streams with an intelligent AI assistant that helps you craft content,
              respond to viewers, and manage your livestream seamlessly.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">AI-Powered Teleprompter</h3>
                <p className="opacity-80">Get real-time content suggestions and script assistance while streaming</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Interactive Research</h3>
                <p className="opacity-80">Analyze documents, research topics, and answer questions during your stream</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Seamless Streaming</h3>
                <p className="opacity-80">High-quality video and audio with powerful customization options</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
