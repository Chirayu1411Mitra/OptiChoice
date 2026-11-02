import type { AuthUser } from "../repositories/user.repository.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
