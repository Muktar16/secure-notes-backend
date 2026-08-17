/**
 * Fail at boot, not at the first request. A container that starts happily and
 * then 500s on login is far harder to diagnose than one that refuses to start
 * and says exactly which variable is missing.
 */
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'] as const;

const MIN_SECRET_LENGTH = 16;

export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'See .env.example.',
    );
  }

  const secret = String(env.JWT_SECRET);
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters ` +
        `(got ${secret.length}). Generate one with: openssl rand -hex 32`,
    );
  }

  return env;
}
