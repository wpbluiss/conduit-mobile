import * as SecureStore from "expo-secure-store";
import { API_URL } from "./api";

const TOKEN_KEY = "conduit_auth_token";
const TOKEN_EXPIRY_KEY = "conduit_auth_token_expiry";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignupResponse {
  userId: string;
  email: string;
  token: string;
  expiresIn: number;
}

// ── Password validation ───────────────────────────────────────────────────────

export interface PasswordStrength {
  hasLength: boolean;
  hasLetter: boolean;
  hasDigit: boolean;
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return { hasLength, hasLetter, hasDigit, isValid: hasLength && hasLetter && hasDigit };
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function conduitSignup(req: SignupRequest): Promise<SignupResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 409) throw Object.assign(new Error("Email already in use"), { status });
    if (status === 400) throw Object.assign(new Error("Password must be 8+ chars with a letter and a digit"), { status });
    if (status === 422) throw Object.assign(new Error("Invalid email address"), { status });
    let msg = "Could not create account";
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<SignupResponse>;
}

// ── SecureStore helpers ───────────────────────────────────────────────────────

export async function storeConduitToken(token: string, expiresIn: number): Promise<void> {
  const expiresAt = String(Date.now() + expiresIn * 1000);
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiresAt),
  ]);
}

export async function getConduitToken(): Promise<string | null> {
  const [token, expiry] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(TOKEN_EXPIRY_KEY),
  ]);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry, 10)) return null;
  return token;
}

export async function clearConduitToken(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
  ]);
}
