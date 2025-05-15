import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface RegisterConfirmationProps {
  email: string;
  onClose: () => void;
}

export default function RegisterConfirmation({ email, onClose }: RegisterConfirmationProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-xl w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
        <CardTitle className="text-xl">Registration Successful</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-zinc-300">
        <p className="mb-4">
          Thank you for registering with Vyna.live! We've sent a verification email to:
        </p>
        <p className="font-medium text-amber-400 mb-4">{email}</p>
        <p className="text-sm text-zinc-400 mb-2">
          Please check your inbox and click on the verification link to activate your account.
        </p>
        <p className="text-sm text-zinc-400">
          If you don't see the email, please check your spam folder.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button 
          onClick={onClose}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          Continue to Login
        </Button>
      </CardFooter>
    </Card>
  );
}