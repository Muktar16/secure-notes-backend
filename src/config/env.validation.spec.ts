import { validateEnv } from './env.validation';

const GOOD_SECRET = 'a'.repeat(32);

describe('validateEnv', () => {
  it('accepts a complete environment', () => {
    expect(() =>
      validateEnv({ MONGODB_URI: 'mongodb://localhost/x', JWT_SECRET: GOOD_SECRET }),
    ).not.toThrow();
  });

  it('names every missing variable at once', () => {
    expect(() => validateEnv({})).toThrow(/MONGODB_URI, JWT_SECRET/);
  });

  it('rejects an empty value as missing', () => {
    expect(() =>
      validateEnv({ MONGODB_URI: '', JWT_SECRET: GOOD_SECRET }),
    ).toThrow(/MONGODB_URI/);
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnv({ MONGODB_URI: 'mongodb://localhost/x', JWT_SECRET: 'short' }),
    ).toThrow(/at least 16 characters/);
  });
});
