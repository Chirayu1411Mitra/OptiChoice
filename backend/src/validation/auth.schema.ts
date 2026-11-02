import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Password must be 128 characters or fewer."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(128, "Password must be 128 characters or fewer."),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  dateOfBirth: z.string().nullable().refine((value) => {
    if (value === null) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= "1900-01-01" && value <= new Date().toISOString().slice(0, 10);
  }, "Enter a valid date of birth that is not in the future."),
  gender: z.enum(["woman", "man", "non_binary", "other", "prefer_not_to_say"]).nullable(),
  phoneNumber: z.string().trim().max(32, "Phone number must be 32 characters or fewer.").nullable(),
  location: z.string().trim().max(120, "Location must be 120 characters or fewer.").nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  newPassword: z.string().min(8, "Use at least 8 characters.").max(128, "Password must be 128 characters or fewer."),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm account deletion.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  newPassword: z.string().min(8, "Use at least 8 characters.").max(128, "Password must be 128 characters or fewer."),
});

export const verifyEmailSchema = z.object({ token: z.string().min(32).max(256) });
export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
