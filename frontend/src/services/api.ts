/** Thin REST client for the OptiChoice API. */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("optichoice.token") : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const errorObject = body && typeof body === "object" && "error" in body ? body.error : null;
    const message = errorObject && typeof errorObject === "object" && "message" in errorObject && typeof errorObject.message === "string"
      ? errorObject.message
      : body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

