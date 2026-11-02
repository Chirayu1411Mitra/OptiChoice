import { env } from "../config/env.js";

async function sendEmail(email: string, subject: string, text: string, html: string, localLabel: string): Promise<void> {
  if (!env.resendApiKey || !env.resendFrom) {
    if (env.isProduction) throw new Error("Email delivery is not configured.");
    console.info(`Development ${localLabel} email to ${email}: ${text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.resendFrom,
      to: [email],
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) throw new Error(`Password reset email provider returned ${response.status}.`);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${env.appBaseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail(email, "Reset your OptiChoice password", `Use this link to reset your OptiChoice password. It expires in 30 minutes: ${link}`, `<p>We received a request to reset your OptiChoice password.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`, "password reset");
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${env.appBaseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail(email, "Verify your OptiChoice email", `Verify your OptiChoice email address within 24 hours: ${link}`, `<p>Thanks for creating an OptiChoice account.</p><p><a href="${link}">Verify your email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`, "email verification");
}
