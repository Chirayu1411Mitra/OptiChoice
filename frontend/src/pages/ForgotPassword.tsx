import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { authService } from "@/services/authService";
import { AuthShell, Field } from "@/pages/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't process that request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email address on your account and we’ll help you get back in." footer={<>Remembered it? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>}>
      {sent ? (
        <div className="space-y-3 text-sm leading-6" role="status">
          <p className="font-medium">If an account exists for that email, a reset link has been sent.</p>
          <p className="text-muted-foreground">For local development, check the backend terminal for the link.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <ErrorState message={error} />}
          <Field id="email" label="Email">
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" disabled={!/\S+@\S+\.\S+/.test(email) || loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
