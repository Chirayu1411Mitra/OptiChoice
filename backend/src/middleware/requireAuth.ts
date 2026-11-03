import type { RequestHandler } from "express";
import { authenticateSession } from "../services/auth.service.js";

export const requireAuth: RequestHandler = async (request, response, next) => {
  const [scheme, token, extra] = (request.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token || extra) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } });
    return;
  }

  try {
    const user = await authenticateSession(token);
    if (!user) {
      response.status(401).json({ error: { code: "SESSION_EXPIRED", message: "Your session has expired. Please sign in again." } });
      return;
    }
    request.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
