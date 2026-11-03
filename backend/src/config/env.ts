const port = Number(process.env.PORT ?? 3001);
const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:8081")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (frontendOrigins.length === 0) {
  throw new Error("FRONTEND_ORIGIN must contain at least one allowed origin.");
}

const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
const geminiFallbackModel = process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.5-flash-lite";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port between 1 and 65535.");
}

if (!/^[a-zA-Z0-9._-]{1,80}$/.test(geminiModel) || !/^[a-zA-Z0-9._-]{1,80}$/.test(geminiFallbackModel)) {
  throw new Error("Gemini model names must contain only letters, numbers, dots, underscores, or hyphens.");
}

export const env = {
  port,
  frontendOrigins,
  databasePath: process.env.DATABASE_PATH ?? "./data/optichoice.sqlite",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:8081",
  smtpUser: process.env.SMTP_USER?.trim() || undefined,
  smtpAppPassword: process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "") || undefined,
  smtpFrom: process.env.SMTP_FROM?.trim() || undefined,
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || undefined,
  trustProxy: process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY?.toLowerCase() === "true",
  serpApiKey: process.env.SERPAPI_API_KEY,
  productSearchCountry: process.env.PRODUCT_SEARCH_COUNTRY ?? "in",
  productSearchLanguage: process.env.PRODUCT_SEARCH_LANGUAGE ?? "en",
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
  geminiModel,
  geminiFallbackModel,
  isProduction: process.env.NODE_ENV === "production",
};
