import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);
