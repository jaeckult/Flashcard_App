const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Starting database seed...');
        
        // Delete dependent records first (in correct order due to foreign key constraints)
        console.log('Deleting verification tokens...');
        await prisma.verificationToken.deleteMany();
        
        console.log('Deleting OTPs...');
        await prisma.oTP.deleteMany();
        
        console.log('Deleting comments...');
        await prisma.comment.deleteMany();
        
        console.log('Deleting posts...');
        await prisma.post.deleteMany();
        
        console.log('Deleting sessions...');
        await prisma.session.deleteMany();
        
        console.log('Deleting accounts...');
        await prisma.account.deleteMany();

        // Now delete users
        console.log('Deleting users...');
        await prisma.user.deleteMany();

        // Create users
        console.log('Creating users...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const user1 = await prisma.user.create({
            data: {
                email: 'user1@example.com',
                passwordHash: hashedPassword,
                isVerified: true,
                role: 'user',
                isActive: true,
            }
        });

        const user2 = await prisma.user.create({
            data: {
                email: 'user2@example.com',
                passwordHash: hashedPassword,
                isVerified: true,
                role: 'user',
                isActive: true,
            }
        });

        const adminUser = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                passwordHash: hashedPassword,
                isVerified: true,
                role: 'admin',
                isActive: true,
            }
        });

        // Create sample posts
        console.log('Creating sample posts...');
        const post1 = await prisma.post.create({
            data: {
                title: 'Welcome to Burbly!',
                content: 'This is our first post. Welcome to the Burbly flashcard app community!',
                authorId: user1.id,
                isPublished: true,
                tags: 'welcome,community,first-post',
                likes: 5,
                views: 25,
            }
        });

        const post2 = await prisma.post.create({
            data: {
                title: 'How to Create Effective Flashcards',
                content: 'Creating effective flashcards is an art. Here are some tips: 1. Keep it simple 2. Use images when possible 3. Review regularly 4. Space out your learning.',
                authorId: user2.id,
                isPublished: true,
                tags: 'tips,flashcards,learning',
                likes: 12,
                views: 89,
            }
        });

        const post3 = await prisma.post.create({
            data: {
                title: 'Study Techniques That Work',
                content: 'Research shows that spaced repetition and active recall are the most effective study techniques. Try incorporating these into your flashcard routine.',
                authorId: adminUser.id,
                isPublished: true,
                tags: 'study-techniques,spaced-repetition,research',
                likes: 8,
                views: 156,
            }
        });

        // Create sample comments
        console.log('Creating sample comments...');
        await prisma.comment.create({
            data: {
                content: 'Great post! Looking forward to more content.',
                authorId: user2.id,
                postId: post1.id,
                likes: 2,
            }
        });

        await prisma.comment.create({
            data: {
                content: 'Thanks for sharing these tips!',
                authorId: user1.id,
                postId: post2.id,
                likes: 1,
            }
        });

        await prisma.comment.create({
            data: {
                content: 'I\'ve been using spaced repetition for months and it really works!',
                authorId: user1.id,
                postId: post3.id,
                likes: 3,
            }
        });

        console.log('Created users:');
        console.log('- user1@example.com (password: password123)');
        console.log('- user2@example.com (password: password123)');
        console.log('- admin@example.com (password: password123)');
        console.log('Created 3 sample posts with comments');
        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error; // Re-throw to see the full error
    } finally {
        await prisma.$disconnect();
    }
}

seed();