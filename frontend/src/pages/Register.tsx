import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthShell, Field } from "./AuthShell";

type Form = { name: string; email: string; password: string; confirm: string };

function validate(f: Form): Partial<Form> {
  const e: Partial<Form> = {};
  if (!f.name.trim()) e.name = "Please enter your name.";
  if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Enter a valid email address.";
  if (f.password.length < 8) e.password = "Use at least 8 characters.";
  if (f.password.length > 128) e.password = "Use 128 characters or fewer.";
  if (f.confirm !== f.password) e.confirm = "Passwords don't match.";
  return e;
}

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  async function onGoogleCredential(credential: string) {
    setSubmitError(null);
    await loginWithGoogle(credential);
    await navigate({ to: "/dashboard" });
  }

  const bind = (k: keyof Form) => ({
    id: k,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
    "aria-invalid": touched[k] && !!errors[k],
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (hasErrors) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      await navigate({ to: "/dashboard" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Structure your choices. Decide with clarity."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {submitError && <ErrorState message={submitError} />}
        <Field id="name" label="Name" error={touched.name ? errors.name : undefined}>
          <Input autoComplete="name" placeholder="Ada Lovelace" {...bind("name")} />
        </Field>
        <Field id="email" label="Email" error={touched.email ? errors.email : undefined}>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...bind("email")} />
        </Field>
        <Field id="password" label="Password" error={touched.password ? errors.password : undefined}>
          <Input type="password" autoComplete="new-password" {...bind("password")} />
        </Field>
        <Field id="confirm" label="Confirm password" error={touched.confirm ? errors.confirm : undefined}>
          <Input type="password" autoComplete="new-password" {...bind("confirm")} />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </Button>
      </form>
      <>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or sign up with<span className="h-px flex-1 bg-border" /></div>
        <GoogleSignInButton onCredential={onGoogleCredential} onError={setSubmitError} />
      </>
    </AuthShell>
  );
}
