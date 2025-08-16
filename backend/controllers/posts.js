const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { identifyUser, requireVerification, requireRole } = require('../utils/middleware');

const prisma = new PrismaClient();

// Get all published posts (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tag, authorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tag && { tags: { contains: tag } }),
      ...(authorId && { authorId }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profilePicture: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get a single post by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { includeComments = 'false' } = req.query;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profilePicture: true,
          },
        },
        ...(includeComments === 'true' && {
          comments: {
            where: { parentId: null }, // Only top-level comments
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  profilePicture: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        }),
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.isPublished && (!req.user || req.user.id !== post.authorId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create a new post (authenticated users only)
router.post('/', identifyUser, requireVerification, async (req, res) => {
  try {
    const { title, content, tags = '', isPublished = false } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim(),
        isPublished,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update a post (author only)
router.patch('/:id', identifyUser, requireVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPublished } = req.body;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = tags.trim();
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post (author or admin only)
router.delete('/:id', identifyUser, requireVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.post.delete({ where: { id } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/unlike a post (authenticated users only)
router.post('/:id/like', identifyUser, requireVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, likes: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // For simplicity, just increment likes
    // In a real app, you'd want to track individual likes
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    res.json({ likes: updatedPost.likes });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Get user's posts (authenticated users only)
router.get('/user/me', identifyUser, requireVerification, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get posts by user ID (public)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { 
          authorId: userId,
          isPublished: true 
        },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({ 
        where: { 
          authorId: userId,
          isPublished: true 
        } 
      }),
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

module.exports = router;
