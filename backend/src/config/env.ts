const port = Number(process.env.PORT ?? 3001);
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
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:8081",
  databasePath: process.env.DATABASE_PATH ?? "./data/optichoice.sqlite",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:8081",
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM,
  serpApiKey: process.env.SERPAPI_API_KEY,
  productSearchCountry: process.env.PRODUCT_SEARCH_COUNTRY ?? "in",
  productSearchLanguage: process.env.PRODUCT_SEARCH_LANGUAGE ?? "en",
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
  geminiModel,
  geminiFallbackModel,
  isProduction: process.env.NODE_ENV === "production",
};
