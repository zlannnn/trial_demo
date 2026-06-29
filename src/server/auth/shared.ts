export const ADMIN_USER_ID = "admin-system";
export const ADMIN_CREDENTIALS = { username: "admin", password: "admin" };

export const authPages = {
  signIn: "/login",
} as const;

export function getAuthSecretFromEnv() {
  return (
    process.env.AUTH_SECRET ?? "dev-only-auth-secret-do-not-use-in-production"
  );
}

const GOOGLE_PLACEHOLDER_MARKERS = [
  "your-google-client-id",
  "your-google-client-secret",
  "xxx",
  "changeme",
];

function isPlaceholderSecret(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return GOOGLE_PLACEHOLDER_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

export function isGoogleAuthConfigured() {
  const id = process.env.AUTH_GOOGLE_ID?.trim();
  const secret = process.env.AUTH_GOOGLE_SECRET?.trim();
  if (!id || !secret) return false;
  if (isPlaceholderSecret(id) || isPlaceholderSecret(secret)) return false;
  return true;
}
