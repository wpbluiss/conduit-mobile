import * as SecureStore from "expo-secure-store";
import { API_URL } from "./api";

const BACKEND_TOKEN_KEY = "conduit_backend_token";

export interface BackendSigninResponse {
  token: string;
  expiresIn: number;
}

/**
 * Authenticate with the conduit-backend and return its JWT.
 * Throws on network failure or non-2xx response.
 */
export async function backendSignin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401) {
    throw new Error("Invalid email or password");
  }
  if (!res.ok) {
    throw new Error(`Backend signin failed (${res.status})`);
  }

  const body = (await res.json()) as BackendSigninResponse;
  return body.token;
}

export async function storeBackendToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(BACKEND_TOKEN_KEY, token);
}

export async function getBackendToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(BACKEND_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearBackendToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BACKEND_TOKEN_KEY);
  } catch {
    // ignore — key may not exist
  }
}
