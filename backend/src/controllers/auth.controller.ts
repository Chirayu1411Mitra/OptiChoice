import { randomBytes, randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import {
  changeUserPassword,
  completePasswordReset,
  createEmailVerificationToken,
  createPasswordResetToken,
  createUserAndClaimLegacyData,
  deleteUserAndOwnedData,
  findOrCreateGoogleUser,
  findUnverifiedUserByEmail,
  findUserByEmail,
  findUserById,
  findUserIdForPasswordReset,
  updateUserProfile,
  verifyUserEmail,
} from "../repositories/user.repository.js";
import { hashPassword, issueSession, revokeSession, tokenDigest, verifyPassword } from "../services/auth.service.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service.js";
import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from "../validation/auth.schema.js";

const googleClient = new OAuth2Client();

function invalidBody(response: Response, message: string): void {
  response.status(400).json({ error: { code: "INVALID_REQUEST", message } });
}

export async function registerController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Check your details and try again.");
    return;
  }

  if (await findUserByEmail(parsed.data.email)) {
    response.status(409).json({ error: { code: "EMAIL_IN_USE", message: "An account with this email already exists." } });
    return;
  }

  const createdAt = new Date().toISOString();
  let user: Awaited<ReturnType<typeof createUserAndClaimLegacyData>>;
  try {
    user = await createUserAndClaimLegacyData({
      id: randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      emailVerifiedAt: createdAt,
      dateOfBirth: null,
      gender: null,
      phoneNumber: null,
      location: null,
      createdAt,
    });
  } catch (error) {
    if (await findUserByEmail(parsed.data.email)) {
      response.status(409).json({ error: { code: "EMAIL_IN_USE", message: "An account with this email already exists." } });
      return;
    }
    next(error);
    return;
  }

  try {
    const session = await issueSession(user.id);
    response.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, dateOfBirth: user.dateOfBirth, gender: user.gender, phoneNumber: user.phoneNumber, location: user.location },
      ...session,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, "Enter a valid email and password.");
    return;
  }

  try {
    const user = await findUserByEmail(parsed.data.email);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      response.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
      return;
    }
    const session = await issueSession(user.id);
    response.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, dateOfBirth: user.dateOfBirth, gender: user.gender, phoneNumber: user.phoneNumber, location: user.location },
      ...session,
    });
  } catch (error) {
    next(error);
  }
}

export async function googleLoginController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = googleLoginSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, "Sign in with Google and try again.");
    return;
  }
  if (!env.googleClientId) {
    response.status(503).json({ error: { code: "GOOGLE_AUTH_NOT_CONFIGURED", message: "Google sign-in isn't configured yet. Set GOOGLE_CLIENT_ID on the backend and VITE_GOOGLE_CLIENT_ID on the frontend." } });
    return;
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: parsed.data.credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    response.status(401).json({ error: { code: "INVALID_GOOGLE_CREDENTIAL", message: "Google sign-in could not be verified. Please try again." } });
    return;
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    response.status(401).json({ error: { code: "INVALID_GOOGLE_CREDENTIAL", message: "Google couldn't verify this account. Try again or use email and password." } });
    return;
  }

  try {
    const now = new Date().toISOString();
    const user = await findOrCreateGoogleUser({
      id: randomUUID(),
      googleSub: payload.sub,
      name: payload.name?.trim() || payload.email.split("@")[0] || "Google user",
      email: payload.email.trim().toLowerCase(),
      passwordHash: `google$${randomBytes(48).toString("base64url")}`,
      createdAt: now,
    });
    const session = await issueSession(user.id);
    response.status(200).json({ user, ...session });
  } catch (error) {
    next(error);
  }
}

async function issueVerification(user: { id: string; email: string }): Promise<boolean> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await createEmailVerificationToken(user.id, tokenDigest(token), now.toISOString(), new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());
  return sendVerificationEmail(user.email, token);
}

export async function resendVerificationController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = resendVerificationSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Enter a valid email address.");
    return;
  }
  try {
    const user = await findUnverifiedUserByEmail(parsed.data.email);
    const emailSent = user ? await issueVerification(user) : false;
    response.status(202).json({
      emailSent,
      message: "If that address belongs to an unverified account, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Verification email delivery failed.", error instanceof Error ? error.message : "Unknown email delivery error.");
    response.status(503).json({ error: { code: "EMAIL_DELIVERY_FAILED", message: "We couldn't send the verification email. Check SMTP settings and try again." } });
  }
}

export async function verifyEmailController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = verifyEmailSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, "This verification link is invalid or expired. Request a new one.");
    return;
  }
  try {
    const verified = await verifyUserEmail(tokenDigest(parsed.data.token), new Date().toISOString());
    if (!verified) {
      response.status(400).json({ error: { code: "INVALID_VERIFICATION_TOKEN", message: "This verification link is invalid or expired. Request a new one." } });
      return;
    }
    response.status(200).json({ verified: true });
  } catch (error) {
    next(error);
  }
}

export function currentUserController(request: Request, response: Response): void {
  if (!request.authUser) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } });
    return;
  }
  response.status(200).json({ user: request.authUser });
}

export async function logoutController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const token = (request.get("authorization") ?? "").split(" ")[1];
    if (token) await revokeSession(token);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Check your name and try again.");
    return;
  }
  if (!request.authUser) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } });
    return;
  }
  try {
    const user = await updateUserProfile(request.authUser.id, parsed.data);
    if (!user) {
      response.status(404).json({ error: { code: "USER_NOT_FOUND", message: "This account could not be found." } });
      return;
    }
    response.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = changePasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Check your password and try again.");
    return;
  }
  const userId = request.authUser?.id;
  const token = (request.get("authorization") ?? "").split(" ")[1];
  if (!userId || !token) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } });
    return;
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    response.status(400).json({ error: { code: "PASSWORD_UNCHANGED", message: "Choose a new password that differs from your current one." } });
    return;
  }

  try {
    const user = await findUserById(userId);
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      response.status(400).json({ error: { code: "CURRENT_PASSWORD_INCORRECT", message: "Your current password is incorrect." } });
      return;
    }
    const passwordHash = await hashPassword(parsed.data.newPassword);
    await changeUserPassword(userId, passwordHash, tokenDigest(token));
    response.status(200).json({ changed: true });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = deleteAccountSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Enter your password to confirm account deletion.");
    return;
  }
  const userId = request.authUser?.id;
  if (!userId) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } });
    return;
  }
  try {
    const user = await findUserById(userId);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      response.status(400).json({ error: { code: "PASSWORD_INCORRECT", message: "Your password is incorrect. Your account has not been deleted." } });
      return;
    }
    if (!(await deleteUserAndOwnedData(userId))) {
      response.status(404).json({ error: { code: "USER_NOT_FOUND", message: "This account could not be found." } });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Enter a valid email address.");
    return;
  }
  try {
    const user = await findUserByEmail(parsed.data.email);
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const now = new Date();
      await createPasswordResetToken(user.id, tokenDigest(token), now.toISOString(), new Date(now.getTime() + 30 * 60 * 1000).toISOString());
      try {
        await sendPasswordResetEmail(user.email, token);
      } catch (error) {
        console.error("Password reset email could not be sent.", error instanceof Error ? error.message : "Unknown email delivery error.");
      }
    }
    response.status(202).json({ message: "If an account exists for this email, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    invalidBody(response, parsed.error.issues[0]?.message ?? "Check your new password and try again.");
    return;
  }
  try {
    const tokenHash = tokenDigest(parsed.data.token);
    const now = new Date().toISOString();
    const userId = await findUserIdForPasswordReset(tokenHash, now);
    if (!userId) {
      response.status(400).json({ error: { code: "INVALID_RESET_TOKEN", message: "This reset link is invalid or expired. Request a new one." } });
      return;
    }
    const passwordHash = await hashPassword(parsed.data.newPassword);
    if (!(await completePasswordReset(userId, tokenHash, passwordHash, new Date().toISOString()))) {
      response.status(400).json({ error: { code: "INVALID_RESET_TOKEN", message: "This reset link is invalid or expired. Request a new one." } });
      return;
    }
    response.status(200).json({ reset: true });
  } catch (error) {
    next(error);
  }
}
