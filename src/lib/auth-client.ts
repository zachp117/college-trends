import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Same-origin: the Vite proxy forwards /api/auth/* to the Hono backend in dev,
  // and in production the frontend will be hosted alongside the API.
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
});

// Better Auth's React client uses a dynamic proxy to materialize hooks like
// useSession on access — destructuring at module scope can capture stale
// references, so we expose stable wrappers.
export function useSession() {
  return authClient.useSession();
}
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
