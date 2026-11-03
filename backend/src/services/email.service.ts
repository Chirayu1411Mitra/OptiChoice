import { env } from "../config/env.js";
import nodemailer from "nodemailer";

async function sendEmail(email: string, subject: string, text: string, html: string, localLabel: string): Promise<boolean> {
  if (!env.smtpUser || !env.smtpAppPassword) {
    if (env.isProduction) throw new Error("Email delivery is not configured.");
    console.info(`Development ${localLabel} email to ${email}: ${text}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: env.smtpUser, pass: env.smtpAppPassword },
  });
  try {
    await transporter.sendMail({
      from: env.smtpFrom || `OptiChoice <${env.smtpUser}>`,
      to: email,
      subject,
      text,
      html,
    });
  } finally {
    transporter.close();
  }
  return true;
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const link = `${env.appBaseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail(email, "Reset your OptiChoice password", `Use this link to reset your OptiChoice password. It expires in 30 minutes: ${link}`, `<p>We received a request to reset your OptiChoice password.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`, "password reset");
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const link = `${env.appBaseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail(email, "Verify your OptiChoice email", `Verify your OptiChoice email address within 24 hours: ${link}`, `<p>Thanks for creating an OptiChoice account.</p><p><a href="${link}">Verify your email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`, "email verification");
}
