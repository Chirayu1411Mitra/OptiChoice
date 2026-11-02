import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell, Field } from "./AuthShell";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue making better decisions."
      footer={<>Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Create one</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <ErrorState message={error} />}
        <Field id="email" label="Email">
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Password" aside={<Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>}>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <p className="-mt-2 text-right text-xs text-muted-foreground">Need to verify your email? <Link to="/verify-email" search={{ token: "" }} className="font-medium text-primary hover:underline">Resend link</Link></p>
        <Button type="submit" className="w-full" disabled={!valid || loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </Button>
      </form>
    </AuthShell>
  );
}
