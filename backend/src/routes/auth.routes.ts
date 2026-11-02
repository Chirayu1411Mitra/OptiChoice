import { Router } from "express";
import { changePasswordController, currentUserController, deleteAccountController, forgotPasswordController, loginController, logoutController, registerController, resendVerificationController, resetPasswordController, updateProfileController, verifyEmailController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRoutes = Router();

authRoutes.post("/auth/register", registerController);
authRoutes.post("/auth/login", loginController);
authRoutes.post("/auth/resend-verification", resendVerificationController);
authRoutes.post("/auth/verify-email", verifyEmailController);
authRoutes.post("/auth/forgot-password", forgotPasswordController);
authRoutes.post("/auth/reset-password", resetPasswordController);
authRoutes.get("/auth/me", requireAuth, currentUserController);
authRoutes.post("/auth/logout", requireAuth, logoutController);
authRoutes.patch("/auth/profile", requireAuth, updateProfileController);
authRoutes.post("/auth/password", requireAuth, changePasswordController);
authRoutes.delete("/auth/account", requireAuth, deleteAccountController);
