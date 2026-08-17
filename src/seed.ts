import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { BCRYPT_ROUNDS } from './modules/auth/auth.service';

const PEOPLE = [
  { name: 'Admin User', email: 'admin@test.com', role: 'admin', pw: 'admin123', interests: ['leadership', 'technology', 'chess'] },
  { name: 'Alice Johnson', email: 'alice@test.com', role: 'user', pw: 'password123', interests: ['reading', 'chess', 'painting'] },
  { name: 'Bob Smith', email: 'bob@test.com', role: 'user', pw: 'password123', interests: ['gaming', 'cooking', 'reading'] },
  { name: 'Charlie Brown', email: 'charlie@test.com', role: 'user', pw: 'password123', interests: ['chess', 'travel', 'photography'] },
  { name: 'Diana Prince', email: 'diana@test.com', role: 'user', pw: 'password123', interests: ['reading', 'travel', 'technology'] },
  { name: 'Ethan Hunt', email: 'ethan@test.com', role: 'user', pw: 'password123', interests: ['travel', 'cooking'] },
  { name: 'Fiona Gallagher', email: 'fiona@test.com', role: 'user', pw: 'password123', interests: ['painting', 'gaming', 'chess'] },
  { name: 'George Miller', email: 'george@test.com', role: 'user', pw: 'password123', interests: ['technology', 'photography'] },
];

const NOTE_SEEDS = [
  ['Meeting Notes', 'Discussed the Q3 roadmap and delivery priorities.'],
  ['Book Summary', 'Finished "Atomic Habits" — small changes compound.'],
  ['Project Ideas', 'A real-time collaboration tool with presence indicators.'],
  ['Recipe Notes', 'Pasta aglio e olio: garlic, chilli, parsley, patience.'],
  ['Travel Plans', 'Kyoto in spring — book the ryokan early.'],
  ['Weekly Review', 'Shipped two features and cleared the bug backlog.'],
  ['Design Thoughts', 'The dashboard needs fewer panels, not more.'],
  ['Learning Goals', 'Master aggregation pipelines and index selectivity.'],
  ['Interview Prep', 'Revise compound index prefix rules.'],
  ['Reading List', 'Designing Data-Intensive Applications, chapters 3 and 5.'],
  ['Gym Log', 'Squats 5x5, deadlift 1x5. Progressive overload works.'],
  ['Budget', 'Move the emergency fund into a higher-yield account.'],
  ['Garden', 'Tomatoes need staking before the next storm.'],
  ['Photography', 'Golden hour is 40 minutes earlier this month.'],
  ['Chess', 'Studied the Catalan. White keeps a long-term bind.'],
  ['Standup', 'Blocked on the staging database migration.'],
  ['Retro', 'Deploys are still too manual. Automate the smoke test.'],
  ['Ideas', 'Offline-first notes with conflict-free merges.'],
  ['Shopping', 'Coffee beans, olive oil, printer paper.'],
  ['Podcast Notes', 'Latency is a feature budget, not an afterthought.'],
  ['Draft Email', 'Follow up with the vendor about the SLA wording.'],
  ['Course Notes', 'Covered index scans avoid the FETCH stage entirely.'],
  ['Trip Packing', 'Passport, adapters, spare batteries.'],
  ['Recipe', 'Overnight oats: 1:1 oats to milk, rest 8 hours.'],
  ['Weekend', 'Finish the bookshelf, then rest properly.'],
];

const POST_SEEDS = [
  ['Introduction to MongoDB Indexing', 'How B-tree indexes work and when a compound index earns its keep.'],
  ['Building REST APIs with NestJS', 'Modules, providers, guards — and why the structure pays off.'],
  ['The Art of Code Review', 'Review the design first, the naming last.'],
  ['Docker for Developers', 'A practical guide to containerising a Node service.'],
  ['GraphQL vs REST in 2026', 'When each one is the right tool, with no tribalism.'],
  ['Covered Queries Explained', 'Why an IXSCAN with no FETCH is the fastest read you can buy.'],
  ['JWT Done Properly', 'Short expiry, server-side revocation, and no secrets in the payload.'],
  ['Pagination at Scale', 'Skip/limit versus keyset pagination, with real numbers.'],
  ['The $lookup Stage', 'Joining collections without giving up index support.'],
  ['Schema Design Patterns', 'Embed what you read together; reference what you write apart.'],
  ['Rate Limiting Basics', 'Protecting credential endpoints from patient attackers.'],
  ['Error Handling in Nest', 'One filter, consistent shapes, no leaked stack traces.'],
  ['Testing Guards', 'Unit tests for authorisation logic are cheap insurance.'],
  ['Mongoose Lean Queries', 'Skip hydration when you only need plain data.'],
  ['Deploying to Render', 'Bind 0.0.0.0, read $PORT, and fail loudly at boot.'],
];

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

  // syncIndexes() creates the indexes declared in the schemas *and drops any
  // index the schemas no longer declare*. That keeps the deployed database
  // honest about the "no unnecessary indexes" requirement — what you see in
  // getIndexes() is exactly what the code asks for.
  await Promise.all([
    userModel.syncIndexes(),
    noteModel.syncIndexes(),
    postModel.syncIndexes(),
  ]);

  const users = await Promise.all(
    PEOPLE.map(async (person) =>
      userModel.create({
        name: person.name,
        email: person.email,
        role: person.role,
        interests: person.interests,
        password: await bcrypt.hash(person.pw, BCRYPT_ROUNDS),
      }),
    ),
  );

  await noteModel.insertMany(
    NOTE_SEEDS.map(([title, content], i) => ({
      userId: users[i % users.length]._id,
      title,
      content,
    })),
  );

  await postModel.insertMany(
    POST_SEEDS.map(([title, content], i) => ({
      userId: users[i % users.length]._id,
      title,
      content,
    })),
  );

  const indexNames = async (model: Model<any>) =>
    Object.keys(await model.collection.indexInformation()).join(', ');

  console.log('Seed complete');
  console.log(`  users: ${await userModel.countDocuments()}  [${await indexNames(userModel)}]`);
  console.log(`  notes: ${await noteModel.countDocuments()}  [${await indexNames(noteModel)}]`);
  console.log(`  posts: ${await postModel.countDocuments()}  [${await indexNames(postModel)}]`);
  console.log('  admin: admin@test.com / admin123');
  console.log('  user:  alice@test.com / password123');

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
