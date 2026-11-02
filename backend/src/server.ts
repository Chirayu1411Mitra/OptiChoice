import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(`OptiChoice API listening on http://localhost:${env.port}`);
});

function shutDown(): void {
  server.close((error) => {
    if (error) {
      console.error("API shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
