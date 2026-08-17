"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcryptjs"));
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userModel = app.get((0, mongoose_1.getModelToken)('User'));
    const noteModel = app.get((0, mongoose_1.getModelToken)('Note'));
    const postModel = app.get((0, mongoose_1.getModelToken)('Post'));
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
//# sourceMappingURL=seed.js.map