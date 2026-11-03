/** Thin REST client for the OptiChoice API. */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

export class ApiError extends Error {
  constructor(message: string, readonly code?: string, readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function messageForStatus(status: number): string {
  if (status === 502 || status === 503 || status === 504) {
    return "The OptiChoice API is unavailable. Start the backend in a separate terminal, then try again.";
  }
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "The server couldn't complete this request. Please try again shortly.";
  if (status === 404) return "This service endpoint could not be found. Restart the backend and try again.";
  return `Request failed (${status}). Please check your details and try again.`;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("optichoice.token") : null;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("Can't reach the OptiChoice API. Make sure the backend terminal is running at http://localhost:3001, then try again.");
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const errorObject = body && typeof body === "object" && "error" in body ? body.error : null;
    const code = errorObject && typeof errorObject === "object" && "code" in errorObject && typeof errorObject.code === "string"
      ? errorObject.code
      : undefined;
    const message = errorObject && typeof errorObject === "object" && "message" in errorObject && typeof errorObject.message === "string"
      ? errorObject.message
      : body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : messageForStatus(res.status);
    throw new ApiError(message, code, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

