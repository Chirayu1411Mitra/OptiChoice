import { request } from "./api";
import type { LoginPayload, ProfileUpdate, RegisterPayload, User } from "@/types/user";

const USER_KEY = "optichoice.user";
const TOKEN_KEY = "optichoice.token";

interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

function persistSession(session: AuthResponse): User {
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  localStorage.setItem(TOKEN_KEY, session.token);
  return session.user;
}

function clearLocalSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem("optichoice.draft");
  sessionStorage.removeItem("optichoice.lastResult");
}

export const authService = {
  async requestPasswordReset(email: string): Promise<void> {
    await request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await request<{ reset: boolean }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },
  async login(payload: LoginPayload): Promise<User> {
    const session = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return persistSession(session);
  },
  async loginWithGoogle(credential: string): Promise<User> {
    const session = await request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    return persistSession(session);
  },
  async register(payload: RegisterPayload): Promise<User> {
    const session = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return persistSession(session);
  },
  async resendVerification(email: string): Promise<boolean> {
    const { emailSent } = await request<{ message: string; emailSent: boolean }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return emailSent;
  },
  async verifyEmail(token: string): Promise<void> {
    await request<{ verified: boolean }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  async getCurrentUser(): Promise<User | null> {
    if (!localStorage.getItem(TOKEN_KEY)) {
      clearLocalSession();
      return null;
    }
    try {
      const { user } = await request<{ user: User }>("/auth/me");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      clearLocalSession();
      throw error;
    }
  },
  async updateProfile(profile: ProfileUpdate): Promise<User> {
    const { user } = await request<{ user: User }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await request<{ changed: boolean }>("/auth/password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async deleteAccount(password: string): Promise<void> {
    await request<void>("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    clearLocalSession();
  },
  async logout(): Promise<void> {
    try {
      if (localStorage.getItem(TOKEN_KEY)) {
        await request<void>("/auth/logout", { method: "POST" });
      }
    } catch {
      // Always clear the local session even if the server is unavailable.
    } finally {
      clearLocalSession();
    }
  },
};
