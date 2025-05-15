import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from 'wouter';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" })
});

type FormData = z.infer<typeof formSchema>;

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await forgotPassword(data.email);
      
      setResetEmailSent(true);
      toast({
        title: "Email Sent",
        description: "If an account exists with this email, you'll receive a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while sending the reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resetEmailSent ? (
          <div className="text-center p-4 space-y-4">
            <h3 className="text-xl font-semibold">Email Sent!</h3>
            <p>If an account exists with this email, you will receive a password reset link shortly.</p>
            <p>Check your inbox and spam folder.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your@email.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-center">
          <Link href="/auth">
            <Button variant="link">Return to Login</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}