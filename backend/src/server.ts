import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { initDatabase, pool } from "./database/database.js";

async function startServer(): Promise<void> {
  try {
    if (env.databaseUrl) {
      await initDatabase();
      console.log("PostgreSQL database initialized successfully.");
    } else {
      console.warn("WARNING: DATABASE_URL is not set. Please set DATABASE_URL in backend/.env to connect to Neon PostgreSQL.");
    }
  } catch (error) {
    console.error("Failed to initialize database connection:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`OptiChoice API listening on http://localhost:${env.port}`);
  });

  function shutDown(): void {
    server.close(async (error) => {
      if (error) {
        console.error("API shutdown failed:", error);
        process.exitCode = 1;
      }
      try {
        await pool.end();
      } catch {
        // ignore error on pool shutdown
      }
    });
  }

  process.on("SIGINT", shutDown);
  process.on("SIGTERM", shutDown);
}

void startServer();
