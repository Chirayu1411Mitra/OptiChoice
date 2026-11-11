import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/services/authService";
import type { LoginPayload, ProfileUpdate, RegisterPayload, User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<void>;
  updateProfile: (profile: ProfileUpdate) => Promise<void>;
  changePassword: (p: { currentPassword: string; newPassword: string }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    authService.getCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (p: LoginPayload) => setUser(await authService.login(p)), []);
  const register = useCallback(async (p: RegisterPayload) => { const u = await authService.register(p); setUser(u); return u; }, []);
  const loginWithGoogle = useCallback(async (credential: string) => setUser(await authService.loginWithGoogle(credential)), []);
  const updateProfile = useCallback(async (profile: ProfileUpdate) => setUser(await authService.updateProfile(profile)), []);
  const changePassword = useCallback(
    async (p: { currentPassword: string; newPassword: string }) => authService.changePassword(p),
    [],
  );
  const deleteAccount = useCallback(async (password: string) => {
    await authService.deleteAccount(password);
    setUser(null);
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    void authService.logout();
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, loginWithGoogle, updateProfile, changePassword, deleteAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
