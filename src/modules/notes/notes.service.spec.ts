import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotesService } from './notes.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

const ALICE: AuthUser = {
  userId: '5f9d88b9c2b4a91234567890',
  email: 'alice@test.com',
  name: 'Alice',
  role: 'user',
};
const ADMIN: AuthUser = { ...ALICE, role: 'admin', email: 'admin@test.com' };
const NOTE_ID = '6f9d88b9c2b4a91234567891';

/** Minimal stand-in for a Mongoose model that records the filters it is given. */
function fakeModel(result: unknown = { _id: NOTE_ID }) {
  const calls: Record<string, unknown[]> = {};
  const record = (name: string, filter: unknown) => {
    (calls[name] ??= []).push(filter);
  };
  const chain = {
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    populate: jest.fn(() => chain),
    lean: () => Promise.resolve([]),
  };
  return {
    calls,
    chain,
    create: jest.fn((doc: unknown) => {
      record('create', doc);
      return Promise.resolve(doc);
    }),
    find: jest.fn((filter: unknown) => {
      record('find', filter);
      return chain;
    }),
    countDocuments: jest.fn((filter: unknown) => {
      record('countDocuments', filter);
      return Promise.resolve(0);
    }),
    findOne: jest.fn((filter: unknown) => {
      record('findOne', filter);
      return Promise.resolve(result);
    }),
    findOneAndUpdate: jest.fn((filter: unknown) => {
      record('findOneAndUpdate', filter);
      return Promise.resolve(result);
    }),
    findOneAndDelete: jest.fn((filter: unknown) => {
      record('findOneAndDelete', filter);
      return Promise.resolve(result);
    }),
  };
}

function serviceWith(model: ReturnType<typeof fakeModel>) {
  return new NotesService(model as never);
}

describe('NotesService ownership scoping', () => {
  it('constrains a user list to their own notes', async () => {
    const model = fakeModel();
    await serviceWith(model).findAll(ALICE, 1, 10);

    expect(model.calls.find[0]).toEqual({
      userId: new Types.ObjectId(ALICE.userId),
    });
    // The count must use the same filter, or the page meta would describe a
    // different result set than the page itself.
    expect(model.calls.countDocuments[0]).toEqual(model.calls.find[0]);
  });

  it('lets an admin list every note', async () => {
    const model = fakeModel();
    await serviceWith(model).findAll(ADMIN, 1, 10);
    expect(model.calls.find[0]).toEqual({});
  });

  it('populates the author only for the admin view', async () => {
    const adminModel = fakeModel();
    await serviceWith(adminModel).findAll(ADMIN, 1, 10);
    expect(adminModel.chain.populate).toHaveBeenCalled();

    const userModel = fakeModel();
    await serviceWith(userModel).findAll(ALICE, 1, 10);
    expect(userModel.chain.populate).not.toHaveBeenCalled();
  });

  it.each([
    ['findById', (s: NotesService) => s.findById(NOTE_ID, ALICE), 'findOne'],
    ['update', (s: NotesService) => s.update(NOTE_ID, ALICE, {}), 'findOneAndUpdate'],
    ['remove', (s: NotesService) => s.remove(NOTE_ID, ALICE), 'findOneAndDelete'],
  ])('carries ownership into the %s query', async (_name, call, method) => {
    const model = fakeModel();
    await call(serviceWith(model));

    expect(model.calls[method][0]).toEqual({
      _id: NOTE_ID,
      userId: new Types.ObjectId(ALICE.userId),
    });
  });

  it.each([
    ['findById', (s: NotesService) => s.findById(NOTE_ID, ADMIN)],
    ['update', (s: NotesService) => s.update(NOTE_ID, ADMIN, {})],
    ['remove', (s: NotesService) => s.remove(NOTE_ID, ADMIN)],
  ])('does not constrain %s for an admin', async (_name, call) => {
    const model = fakeModel();
    await call(serviceWith(model));

    Object.values(model.calls)
      .flat()
      .forEach((filter) => expect(filter).toEqual({ _id: NOTE_ID }));
  });

  it.each([
    ['findById', (s: NotesService) => s.findById(NOTE_ID, ALICE)],
    ['update', (s: NotesService) => s.update(NOTE_ID, ALICE, {})],
    ['remove', (s: NotesService) => s.remove(NOTE_ID, ALICE)],
  ])('reports %s of another user\'s note as not found', async (_name, call) => {
    // A note that exists but belongs to someone else matches nothing, and is
    // reported identically to one that does not exist.
    const model = fakeModel(null);
    await expect(call(serviceWith(model))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('always stamps a new note with the caller as owner', async () => {
    const model = fakeModel();
    await serviceWith(model).create(ALICE, { title: 'Mine' });

    expect(model.calls.create[0]).toMatchObject({
      userId: new Types.ObjectId(ALICE.userId),
      title: 'Mine',
      content: '',
    });
  });
});
