/**
 * Build an actionable message for responses the Supabase gateway returns before
 * an edge function's own `{ ok, ... }` envelope is produced. These are the cases
 * that otherwise collapse into an opaque "invalid response": an undeployed
 * function (404), a rejected/expired JWT (401/403), or a platform crash (5xx).
 *
 * Pure and dependency-free so it can be unit tested without the React Native /
 * Supabase client import chain.
 */
export function describeBackendFailure(
  functionName: string,
  status: number,
  rawBody: string,
): string {
  const snippet = rawBody.trim().slice(0, 200);
  if (status === 401 || status === 403) {
    return `Your session was rejected by the SLICE backend (${status}). Please sign out and sign in again.`;
  }
  if (status === 404) {
    return `The SLICE backend function "${functionName}" was not found (404). It may not be deployed.`;
  }
  if (status >= 500) {
    return `The SLICE backend had a server error (${status})${snippet ? `: ${snippet}` : "."}`;
  }
  return `The SLICE backend returned an unexpected response (${status})${snippet ? `: ${snippet}` : "."}`;
}
