import * as bcrypt from 'bcryptjs';
import { AuthService, BCRYPT_ROUNDS } from './auth.service';

const PASSWORD = 'password123';

function fakeUserModel(user: unknown) {
  const select = jest.fn(() => ({ lean: () => Promise.resolve(user) }));
  const findOne = jest.fn(() => ({ select }));
  return { model: { findOne } as never, findOne, select };
}

const jwt = { sign: jest.fn(() => 'signed.jwt.token') } as never;

describe('AuthService.validateUser', () => {
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  });

  it('returns the user without the password hash', async () => {
    const { model } = fakeUserModel({
      _id: 'id',
      email: 'alice@test.com',
      name: 'Alice',
      role: 'user',
      interests: [],
      password: hash,
    });

    const result = await new AuthService(model, jwt).validateUser(
      'alice@test.com',
      PASSWORD,
    );

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('password');
    expect(result?.email).toBe('alice@test.com');
  });

  it('explicitly opts in to the hidden password field', async () => {
    const { model, select } = fakeUserModel({ password: hash, role: 'user' });
    await new AuthService(model, jwt).validateUser('alice@test.com', PASSWORD);
    // The schema hides `password` by default; login is the one place that
    // must ask for it back.
    expect(select).toHaveBeenCalledWith('+password');
  });

  it('rejects a wrong password', async () => {
    const { model } = fakeUserModel({ password: hash, role: 'user' });
    const result = await new AuthService(model, jwt).validateUser(
      'alice@test.com',
      'not-the-password',
    );
    expect(result).toBeNull();
  });

  it('rejects an unknown email', async () => {
    const { model } = fakeUserModel(null);
    const result = await new AuthService(model, jwt).validateUser(
      'ghost@test.com',
      PASSWORD,
    );
    expect(result).toBeNull();
  });

  it('lower-cases the email before looking it up', async () => {
    const { model, findOne } = fakeUserModel(null);
    await new AuthService(model, jwt).validateUser('ALICE@TEST.COM', PASSWORD);
    expect(findOne).toHaveBeenCalledWith({ email: 'alice@test.com' });
  });

  it('spends comparable time on a missing user as on a wrong password', async () => {
    // Guards against email enumeration: a missing user must still pay for a
    // bcrypt comparison rather than returning immediately.
    const time = async (email: string, user: unknown) => {
      const { model } = fakeUserModel(user);
      const started = process.hrtime.bigint();
      await new AuthService(model, jwt).validateUser(email, 'wrong-password');
      return Number(process.hrtime.bigint() - started) / 1e6;
    };

    const missing = await time('ghost@test.com', null);
    const wrongPassword = await time('alice@test.com', {
      password: hash,
      role: 'user',
    });

    expect(missing).toBeGreaterThan(wrongPassword * 0.5);
  });
});
