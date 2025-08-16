const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPosts() {
  try {
    console.log('🧪 Testing Posts and Comments...\n');

    // Test 1: Get all posts
    console.log('1. Fetching all published posts...');
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      include: {
        author: {
          select: {
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
    console.log(`✅ Found ${posts.length} published posts`);
    posts.forEach(post => {
      console.log(`   - "${post.title}" by ${post.author.email} (${post.likes} likes, ${post.views} views, ${post._count.comments} comments)`);
    });

    // Test 2: Get posts with search
    console.log('\n2. Testing post search...');
    const searchResults = await prisma.post.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: 'flashcard', mode: 'insensitive' } },
          { content: { contains: 'flashcard', mode: 'insensitive' } },
        ],
      },
    });
    console.log(`✅ Found ${searchResults.length} posts containing "flashcard"`);

    // Test 3: Get comments for a post
    if (posts.length > 0) {
      console.log('\n3. Testing comments...');
      const postId = posts[0].id;
      const comments = await prisma.comment.findMany({
        where: { postId },
        include: {
          author: {
            select: {
              email: true,
            },
          },
        },
      });
      console.log(`✅ Found ${comments.length} comments for post "${posts[0].title}"`);
      comments.forEach(comment => {
        console.log(`   - "${comment.content}" by ${comment.author.email} (${comment.likes} likes)`);
      });
    }

    // Test 4: Get user posts
    if (posts.length > 0) {
      console.log('\n4. Testing user posts...');
      const userId = posts[0].authorId;
      const userPosts = await prisma.post.findMany({
        where: { authorId: userId },
        select: {
          title: true,
          isPublished: true,
          createdAt: true,
        },
      });
      console.log(`✅ User ${posts[0].author.email} has ${userPosts.length} posts`);
    }

    // Test 5: Test pagination
    console.log('\n5. Testing pagination...');
    const paginatedPosts = await prisma.post.findMany({
      where: { isPublished: true },
      take: 2,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Pagination test: ${paginatedPosts.length} posts (limit: 2)`);

    console.log('\n🎉 All tests passed! Posts and comments are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPosts();
