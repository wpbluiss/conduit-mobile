import * as SecureStore from "expo-secure-store";
import { API_URL } from "./api";

const BACKEND_TOKEN_KEY = "conduit_backend_jwt";

export interface BackendSigninRequest {
  email: string;
  password: string;
}

export interface BackendSigninResponse {
  token: string;
  expiresIn: number;
}

/**
 * Sign in to the conduit-backend and persist the returned JWT in SecureStore.
 * Returns the response on success, null on any failure (non-fatal — Supabase
 * remains the primary auth source).
 */
export async function signinBackend(
  email: string,
  password: string,
): Promise<BackendSigninResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password } satisfies BackendSigninRequest),
    });
    if (res.status === 401) {
      console.warn("[backendAuth] signin 401 — invalid credentials at backend");
      return null;
    }
    if (!res.ok) {
      console.warn("[backendAuth] signin failed:", res.status);
      return null;
    }
    const data = (await res.json()) as BackendSigninResponse;
    await SecureStore.setItemAsync(BACKEND_TOKEN_KEY, data.token);
    return data;
  } catch (e) {
    console.warn("[backendAuth] signinBackend error:", e);
    return null;
  }
}

/** Read the persisted backend JWT from SecureStore, or null if absent. */
export async function getBackendToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(BACKEND_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Remove the backend JWT on sign-out. */
export async function clearBackendToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BACKEND_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Authenticated fetch to the conduit-backend using the stored JWT.
 * Falls back to an unauthenticated request if no token is stored.
 */
export async function backendAuthedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getBackendToken();
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) ?? {}),
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  return fetch(url, { ...init, headers });
}
