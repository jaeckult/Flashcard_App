// controllers/me.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/me
async function getCurrentUser(req, res) {
  try {
    // token extracted earlier by middleware getTokenFrom (in req.token)
    const token = req.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        profilePicture: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // respond
    res.json({ user });
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = getCurrentUser;
