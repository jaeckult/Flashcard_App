const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { identifyUser, requireVerification } = require('../utils/middleware');

const prisma = new PrismaClient();

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { isPublished: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(403).json({ error: 'Post is not published' });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          postId,
          parentId: null // Only top-level comments
        },
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
        skip,
        take: parseInt(limit),
      }),
      prisma.comment.count({ 
        where: { 
          postId,
          parentId: null 
        } 
      }),
    ]);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get replies for a comment
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    res.json({
      replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Create a new comment
router.post('/', identifyUser, requireVerification, async (req, res) => {
  try {
    const { content, postId, parentId } = req.body;
    const authorId = req.user.id;

    if (!content || !postId) {
      return res.status(400).json({ error: 'Content and postId are required' });
    }

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { isPublished: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(403).json({ error: 'Cannot comment on unpublished post' });
    }

    // If this is a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      if (parentComment.postId !== postId) {
        return res.status(400).json({ error: 'Parent comment does not belong to this post' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId,
        postId,
        parentId: parentId || null,
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

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update a comment (author only)
router.patch('/:id', identifyUser, requireVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: content.trim() },
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

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment (author only)
router.delete('/:id', identifyUser, requireVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the comment and all its replies
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id },
        ],
      },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like a comment (authenticated users only)
router.post('/:id/like', identifyUser, requireVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, likes: true },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // For simplicity, just increment likes
    // In a real app, you'd want to track individual likes
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    res.json({ likes: updatedComment.likes });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Get user's comments
router.get('/user/me', identifyUser, requireVerification, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: userId },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.comment.count({ where: { authorId: userId } }),
    ]);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: 'Failed to fetch user comments' });
  }
});

module.exports = router;
