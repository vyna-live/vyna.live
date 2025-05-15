import { ResetPassword } from '@/components/auth/ResetPassword';

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Vyna.live</h1>
          <p className="text-muted-foreground">Set your new password</p>
        </div>
        <ResetPassword />
      </div>
    </div>
  );
}