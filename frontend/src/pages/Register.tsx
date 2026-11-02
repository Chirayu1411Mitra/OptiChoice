import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
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
  const { register } = useAuth();
  const [form, setForm] = useState<Form>({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

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
      setRegisteredEmail(form.email.trim().toLowerCase());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!registeredEmail) return;
    setResendMessage(null);
    try {
      await authService.resendVerification(registeredEmail);
      setResendMessage("If that address belongs to an unverified account, a fresh link has been sent. In local development, check the backend terminal.");
    } catch (error) {
      setResendMessage(error instanceof Error ? error.message : "We couldn't send another link. Please try again.");
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Structure your choices. Decide with clarity."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>}
    >
      {registeredEmail ? (
        <div className="space-y-4 text-sm leading-6" role="status">
          <p className="font-medium">Check your email to verify your account.</p>
          <p className="text-muted-foreground">We sent a verification link to {registeredEmail}. It expires in 24 hours. For local development, check the backend terminal for the link.</p>
          {resendMessage && <p className="text-muted-foreground">{resendMessage}</p>}
          <Button type="button" variant="outline" className="w-full" onClick={resendVerification}>Resend verification link</Button>
        </div>
      ) : <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
      </form>}
    </AuthShell>
  );
}
