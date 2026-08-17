import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { BCRYPT_ROUNDS } from './modules/auth/auth.service';

/**
 * Seeds a dataset big enough that every list in the UI actually paginates:
 * 24 users, 70 notes, 30 posts, 14 distinct interests.
 *
 * The two demo accounts are given a deliberately generous share of the notes
 * and posts, so a reviewer signing in as either one immediately sees multiple
 * pages rather than a handful of rows.
 */

const DEMO_PASSWORD = 'password123';
const ADMIN_PASSWORD = 'admin123';

const INTERESTS = [
  'chess', 'reading', 'travel', 'cooking', 'gaming', 'painting', 'photography',
  'technology', 'leadership', 'hiking', 'music', 'cycling', 'gardening', 'writing',
];

const PEOPLE: { name: string; email: string; role?: string; interests: string[] }[] = [
  { name: 'Admin User', email: 'admin@test.com', role: 'admin', interests: ['leadership', 'technology', 'chess'] },
  { name: 'Alice Johnson', email: 'alice@test.com', interests: ['reading', 'chess', 'painting'] },
  { name: 'Bob Smith', email: 'bob@test.com', interests: ['gaming', 'cooking', 'reading'] },
  { name: 'Charlie Brown', email: 'charlie@test.com', interests: ['chess', 'travel', 'photography'] },
  { name: 'Diana Prince', email: 'diana@test.com', interests: ['reading', 'travel', 'technology'] },
  { name: 'Ethan Hunt', email: 'ethan@test.com', interests: ['travel', 'cooking', 'cycling'] },
  { name: 'Fiona Gallagher', email: 'fiona@test.com', interests: ['painting', 'gaming', 'chess'] },
  { name: 'George Miller', email: 'george@test.com', interests: ['technology', 'photography'] },
  { name: 'Hannah Lee', email: 'hannah@test.com', interests: ['music', 'reading', 'writing'] },
  { name: 'Ibrahim Khan', email: 'ibrahim@test.com', interests: ['hiking', 'photography', 'travel'] },
  { name: 'Julia Novak', email: 'julia@test.com', interests: ['gardening', 'cooking'] },
  { name: 'Kabir Rahman', email: 'kabir@test.com', interests: ['technology', 'chess', 'music'] },
  { name: 'Lena Petrova', email: 'lena@test.com', interests: ['painting', 'writing', 'travel'] },
  { name: 'Marcus Cole', email: 'marcus@test.com', interests: ['cycling', 'gaming'] },
  { name: 'Nadia Haque', email: 'nadia@test.com', interests: ['reading', 'leadership', 'writing'] },
  { name: 'Oliver Brandt', email: 'oliver@test.com', interests: ['hiking', 'photography'] },
  { name: 'Priya Sharma', email: 'priya@test.com', interests: ['technology', 'music', 'reading'] },
  { name: 'Quentin Adams', email: 'quentin@test.com', interests: ['chess', 'gardening'] },
  { name: 'Rania Farouk', email: 'rania@test.com', interests: ['cooking', 'travel', 'painting'] },
  { name: 'Samuel Osei', email: 'samuel@test.com', interests: ['leadership', 'cycling'] },
  { name: 'Tanvir Alam', email: 'tanvir@test.com', interests: ['technology', 'gaming', 'chess'] },
  { name: 'Ursula Klein', email: 'ursula@test.com', interests: ['gardening', 'writing'] },
  { name: 'Victor Reyes', email: 'victor@test.com', interests: ['music', 'hiking'] },
  { name: 'Wendy Zhao', email: 'wendy@test.com', interests: ['reading', 'cooking', 'photography'] },
];

const NOTES: [string, string][] = [
  ['Meeting notes', 'Discussed the Q3 roadmap and agreed delivery priorities.'],
  ['Book summary', 'Finished "Atomic Habits" — small changes compound quietly.'],
  ['Project ideas', 'A real-time collaboration tool with presence indicators.'],
  ['Recipe', 'Pasta aglio e olio: garlic, chilli, parsley, patience.'],
  ['Travel plans', 'Kyoto in spring. Book the ryokan early, it fills up.'],
  ['Weekly review', 'Shipped two features and cleared the bug backlog.'],
  ['Design thoughts', 'The dashboard needs fewer panels, not more.'],
  ['Learning goals', 'Master aggregation pipelines and index selectivity.'],
  ['Interview prep', 'Revise compound index prefix rules and covered queries.'],
  ['Reading list', 'Designing Data-Intensive Applications, chapters 3 and 5.'],
  ['Gym log', 'Squats 5x5, deadlift 1x5. Progressive overload works.'],
  ['Budget', 'Move the emergency fund into a higher-yield account.'],
  ['Garden', 'Tomatoes need staking before the next storm arrives.'],
  ['Photography', 'Golden hour is forty minutes earlier this month.'],
  ['Chess study', 'The Catalan gives White a long-term positional bind.'],
  ['Standup', 'Blocked on the staging database migration.'],
  ['Retro', 'Deploys are still too manual. Automate the smoke test.'],
  ['Idea', 'Offline-first notes with conflict-free merges.'],
  ['Shopping', 'Coffee beans, olive oil, printer paper.'],
  ['Podcast notes', 'Latency is a budget you spend, not an afterthought.'],
  ['Draft email', 'Follow up with the vendor about the SLA wording.'],
  ['Course notes', 'Covered index scans skip the FETCH stage entirely.'],
  ['Packing list', 'Passport, adapters, spare batteries, one good book.'],
  ['Overnight oats', 'One to one, oats to milk. Rest eight hours.'],
  ['Weekend', 'Finish the bookshelf, then rest properly.'],
  ['Onboarding', 'Write the runbook while the setup is still fresh.'],
  ['Bug notes', 'Race condition only appears under concurrent writes.'],
  ['Talk outline', 'Open with the failure, then walk back to the cause.'],
  ['Language practice', 'Twenty new words a week is sustainable. Fifty is not.'],
  ['House', 'Service the boiler before winter, not during it.'],
];

const POSTS: [string, string][] = [
  ['Introduction to MongoDB indexing', 'How B-tree indexes work, and when a compound index earns its keep.'],
  ['Building REST APIs with NestJS', 'Modules, providers and guards — why the structure pays off later.'],
  ['The art of code review', 'Review the design first and the naming last.'],
  ['Docker for developers', 'A practical guide to containerising a Node service.'],
  ['GraphQL vs REST in 2026', 'When each is the right tool, without the tribalism.'],
  ['Covered queries explained', 'An index scan with no FETCH is the cheapest read you can buy.'],
  ['JWT done properly', 'Short expiry, server-side revocation, no secrets in the payload.'],
  ['Pagination at scale', 'Skip/limit versus keyset pagination, with real numbers.'],
  ['The $lookup stage', 'Joining collections without giving up index support.'],
  ['Schema design patterns', 'Embed what you read together; reference what you write apart.'],
  ['Rate limiting basics', 'Protecting credential endpoints from patient attackers.'],
  ['Error handling in Nest', 'One filter, consistent shapes, no leaked stack traces.'],
  ['Testing guards', 'Unit tests for authorisation logic are cheap insurance.'],
  ['Mongoose lean queries', 'Skip hydration when you only need plain data.'],
  ['Deploying to Render', 'Bind 0.0.0.0, read $PORT, and fail loudly at boot.'],
  ['Why multikey indexes cannot cover', 'MongoDB cannot rebuild an array from index entries.'],
  ['Reading an explain plan', 'Start at keysExamined versus nReturned, then work outwards.'],
  ['Password hashing in practice', 'Cost factors, timing safety, and what bcrypt does not solve.'],
  ['The case for boring code', 'Clever code is a loan against your future attention.'],
  ['Migrations without downtime', 'Expand, backfill, contract — in that order.'],
  ['Observability on a budget', 'Structured logs get you most of the way there.'],
  ['CORS, demystified', 'It is the browser protecting the user, not the server protecting itself.'],
  ['Choosing a sort key', 'ObjectIds are already ordered by creation time. Use that.'],
  ['Soft deletes reconsidered', 'They are a filter you must never forget to apply.'],
  ['On code comments', 'Explain the why. The what is already on the screen.'],
  ['Health checks that mean something', 'A 200 that ignores the database is a lie.'],
  ['Validation at the boundary', 'Reject unknown fields, and typos stop becoming features.'],
  ['The cost of an index', 'Every write pays for every index, forever.'],
  ['Small pull requests', 'Reviewable size beats complete scope, nearly always.'],
  ['Retro: our first deploy', 'Everything that broke, and what we changed because of it.'],
];

/**
 * Weighted distribution: the two accounts printed in the README get enough
 * content to page through, and the rest is spread across everyone else.
 */
function distribute(count: number, userCount: number, demoShare: [number, number]) {
  const owners: number[] = [];
  const [adminShare, aliceShare] = demoShare;
  for (let i = 0; i < adminShare; i++) owners.push(0); // admin
  for (let i = 0; i < aliceShare; i++) owners.push(1); // alice
  for (let i = owners.length; i < count; i++) {
    owners.push(2 + (i % (userCount - 2)));
  }
  return owners;
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<any>>(getModelToken('User'));
  const noteModel = app.get<Model<any>>(getModelToken('Note'));
  const postModel = app.get<Model<any>>(getModelToken('Post'));

  await Promise.all([
    postModel.deleteMany({}),
    noteModel.deleteMany({}),
    userModel.deleteMany({}),
  ]);

  // syncIndexes() creates the indexes the schemas declare *and drops any the
  // schemas no longer declare*, so the deployed database matches the code
  // exactly — leftovers from an earlier iteration cannot inflate the count.
  await Promise.all([
    userModel.syncIndexes(),
    noteModel.syncIndexes(),
    postModel.syncIndexes(),
  ]);

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS),
    bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS),
  ]);

  const users = await userModel.insertMany(
    PEOPLE.map((person) => ({
      name: person.name,
      email: person.email,
      role: person.role ?? 'user',
      interests: person.interests,
      password: person.role === 'admin' ? adminHash : userHash,
    })),
  );

  const noteOwners = distribute(70, users.length, [12, 16]);
  await noteModel.insertMany(
    noteOwners.map((ownerIndex, i) => ({
      userId: users[ownerIndex]._id,
      title: NOTES[i % NOTES.length][0],
      content: NOTES[i % NOTES.length][1],
    })),
  );

  const postOwners = distribute(30, users.length, [4, 6]);
  await postModel.insertMany(
    postOwners.map((ownerIndex, i) => ({
      userId: users[ownerIndex]._id,
      title: POSTS[i % POSTS.length][0],
      content: POSTS[i % POSTS.length][1],
    })),
  );

  const indexNames = async (model: Model<any>) =>
    Object.keys(await model.collection.indexInformation()).join(', ');
  const ownedBy = (model: Model<any>, i: number) =>
    model.countDocuments({ userId: users[i]._id });

  console.log('Seed complete');
  console.log(`  users: ${await userModel.countDocuments()}  [${await indexNames(userModel)}]`);
  console.log(`  notes: ${await noteModel.countDocuments()}  [${await indexNames(noteModel)}]`);
  console.log(`  posts: ${await postModel.countDocuments()}  [${await indexNames(postModel)}]`);
  console.log(`  interests: ${new Set(PEOPLE.flatMap((p) => p.interests)).size} distinct`);
  console.log(`  admin@test.com / ${ADMIN_PASSWORD}  — ${await ownedBy(noteModel, 0)} notes, ${await ownedBy(postModel, 0)} posts`);
  console.log(`  alice@test.com / ${DEMO_PASSWORD}  — ${await ownedBy(noteModel, 1)} notes, ${await ownedBy(postModel, 1)} posts`);

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
