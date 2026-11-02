import { Router } from "express";
import { decisionRoutes } from "./decision.routes.js";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { productLookupRoutes } from "./productLookup.routes.js";

export const apiRoutes = Router();

apiRoutes.use(healthRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(requireAuth);
apiRoutes.use(decisionRoutes);
apiRoutes.use(productLookupRoutes);
