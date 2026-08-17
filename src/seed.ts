import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get(getModelToken('User')) as Model<any>;
  const noteModel = app.get(getModelToken('Note')) as Model<any>;
  const postModel = app.get(getModelToken('Post')) as Model<any>;

  await postModel.deleteMany({});
  await noteModel.deleteMany({});
  await userModel.deleteMany({});

  const password = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await userModel.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: adminPassword,
    role: 'admin',
    interests: ['leadership', 'technology', 'chess'],
  });

  const alice = await userModel.create({
    name: 'Alice Johnson',
    email: 'alice@test.com',
    password,
    role: 'user',
    interests: ['reading', 'chess', 'painting'],
  });

  const bob = await userModel.create({
    name: 'Bob Smith',
    email: 'bob@test.com',
    password,
    role: 'user',
    interests: ['gaming', 'cooking', 'reading'],
  });

  const charlie = await userModel.create({
    name: 'Charlie Brown',
    email: 'charlie@test.com',
    password,
    role: 'user',
    interests: ['chess', 'travel', 'photography'],
  });

  const users = [admin, alice, bob, charlie];

  const noteTitles = [
    ['Meeting Notes', 'Discussed Q3 roadmap and priorities.'],
    ['Book Summary', 'Finished reading "Atomic Habits" by James Clear.'],
    ['Project Ideas', 'Build a real-time collaboration tool.'],
    ['Recipe Notes', 'Pasta aglio e olio — simple but delicious.'],
    ['Travel Plans', 'Next trip: Kyoto, Japan in spring.'],
    ['Weekly Review', 'Great week. Shipped two features.'],
    ['Design Thoughts', 'Simplify the dashboard layout.'],
    ['Learning Goals', 'Master MongoDB aggregation pipelines.'],
  ];

  for (let i = 0; i < noteTitles.length; i++) {
    const user = users[i % users.length];
    await noteModel.create({
      userId: user._id,
      title: noteTitles[i][0],
      content: noteTitles[i][1],
    });
  }

  const postTitles = [
    ['Introduction to MongoDB Indexing', 'A deep dive into how MongoDB indexes work and why they matter.'],
    ['Building REST APIs with NestJS', 'Why NestJS is my go-to framework for production backends.'],
    ['The Art of Code Review', 'Best practices for giving and receiving code reviews.'],
    ['Docker for Developers', 'A practical guide to containerizing your applications.'],
    ['GraphQL vs REST in 2026', 'When to choose which, and why it still matters.'],
  ];

  for (let i = 0; i < postTitles.length; i++) {
    const user = users[i % users.length];
    await postModel.create({
      userId: user._id,
      title: postTitles[i][0],
      content: postTitles[i][1],
    });
  }

  console.log('Seed complete:');
  console.log(`  Users: ${await userModel.countDocuments()}`);
  console.log(`  Notes: ${await noteModel.countDocuments()}`);
  console.log(`  Posts: ${await postModel.countDocuments()}`);
  console.log('  Admin login: admin@test.com / admin123');
  console.log('  User login:  alice@test.com / password123');

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
