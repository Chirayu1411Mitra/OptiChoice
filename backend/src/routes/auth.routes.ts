import { Router } from "express";
import { changePasswordController, currentUserController, deleteAccountController, forgotPasswordController, googleLoginController, loginController, logoutController, registerController, resendVerificationController, resetPasswordController, updateProfileController, verifyEmailController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { authRateLimit } from "../middleware/rateLimit.js";

export const authRoutes = Router();

authRoutes.post("/auth/register", authRateLimit, registerController);
authRoutes.post("/auth/login", authRateLimit, loginController);
authRoutes.post("/auth/google", authRateLimit, googleLoginController);
authRoutes.post("/auth/resend-verification", authRateLimit, resendVerificationController);
authRoutes.post("/auth/verify-email", authRateLimit, verifyEmailController);
authRoutes.post("/auth/forgot-password", authRateLimit, forgotPasswordController);
authRoutes.post("/auth/reset-password", authRateLimit, resetPasswordController);
authRoutes.get("/auth/me", requireAuth, currentUserController);
authRoutes.post("/auth/logout", requireAuth, logoutController);
authRoutes.patch("/auth/profile", requireAuth, updateProfileController);
authRoutes.post("/auth/password", requireAuth, changePasswordController);
authRoutes.delete("/auth/account", requireAuth, deleteAccountController);
