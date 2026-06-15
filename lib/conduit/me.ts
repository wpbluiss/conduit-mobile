import { authedFetch } from "./api";
import type { CurrentUser } from "./types";

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class ServerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ServerError";
  }
}

/**
 * Fetch the current user from GET /api/v1/me.
 *
 * Throws AuthError on 401/403 (caller should redirect to sign-in).
 * Throws ServerError on 5xx (caller should show an error message).
 * Throws on network failure (no connection, etc.).
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await authedFetch("/api/v1/me");

  if (res.status === 401) {
    throw new AuthError(401, "Missing or malformed token");
  }
  if (res.status === 403) {
    throw new AuthError(403, "Session expired — please sign in again");
  }
  if (res.status >= 500) {
    throw new ServerError(res.status, `Server error (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`Unexpected response: ${res.status}`);
  }

  const body = (await res.json()) as CurrentUser;
  return body;
}
