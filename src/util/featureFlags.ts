/**
 * Feature flags read at bundle time from Vite env vars.
 *
 * AUTH_ENABLED — controls whether the Sign in / Sign up / signed-in chrome
 * is rendered anywhere in the app. The auth backend (Hono + Better-Auth)
 * still exists in the codebase; this flag just hides the surface area so
 * the public deploy looks like a clean read-only dashboard.
 *
 * Default behavior:
 *   - dev (`vite`):       ON   (so local development of auth still works)
 *   - prod (`vite build`): OFF  (so deployed site has no broken auth)
 *
 * Override either way by setting VITE_AUTH_ENABLED=true|false in .env or
 * the Vercel project's environment variables.
 */
const explicit = import.meta.env.VITE_AUTH_ENABLED;

export const AUTH_ENABLED: boolean =
  explicit === undefined ? Boolean(import.meta.env.DEV) : explicit === 'true';
