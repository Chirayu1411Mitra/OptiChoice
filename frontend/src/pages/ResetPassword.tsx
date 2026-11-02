import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { authService } from "@/services/authService";
import { AuthShell, Field } from "@/pages/AuthShell";

export default function ResetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validation = !token ? "This reset link is missing its token. Request a new one." : password.length < 8 ? "Use at least 8 characters." : password.length > 128 ? "Use 128 characters or fewer." : password !== confirm ? "Passwords don't match." : null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (validation) return;
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't reset your password. Request a new link and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Your reset link works once and expires after 30 minutes." footer={<>Back to <Link to="/login" className="font-medium text-primary hover:underline">log in</Link></>}>
      {done ? (
        <div className="space-y-4 text-sm" role="status">
          <p className="font-medium">Your password has been changed. You can now log in with the new password.</p>
          <Button asChild className="w-full"><Link to="/login">Go to log in</Link></Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <ErrorState message={error} />}
          {!token && <ErrorState message="This reset link is missing its token. Request a new one." />}
          <Field id="new-password" label="New password">
            <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field id="confirm-password" label="Confirm new password" error={confirm && password !== confirm ? "Passwords don't match." : undefined}>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          {password && validation && token && <p className="text-xs text-destructive" role="alert">{validation}</p>}
          <Button type="submit" className="w-full" disabled={!!validation || loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Save new password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
