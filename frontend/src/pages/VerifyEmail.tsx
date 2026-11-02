import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { authService } from "@/services/authService";
import { AuthShell } from "@/pages/AuthShell";

export default function VerifyEmail({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.verifyEmail(token);
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This verification link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={verified ? "Email verified" : "Verify your email"} subtitle={verified ? "Your account is ready." : "Confirm your email address to finish creating your account."} footer={null}>
      {verified ? (
        <div className="space-y-4 text-sm" role="status">
          <p className="font-medium">Your email is verified. You can now log in to OptiChoice.</p>
          <Button asChild className="w-full"><Link to="/login">Go to log in</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <ErrorState message={error} />}
          {token && <form onSubmit={verify}>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify email
            </Button>
          </form>}
        </div>
      )}
    </AuthShell>
  );
}
