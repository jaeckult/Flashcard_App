const { OAuth2Client } = require('google-auth-library');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
async function googleAuth(req, res) {
  console.log("Google auth endpoint hit");
  
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'No ID token provided' });

  try {
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findUnique({ 
      where: { email },
      include: { accounts: true }
    });
    
    if (!user) {
      console.log("Creating new user with Google OAuth");
      user = await prisma.user.create({
        data: {
          email,
          isVerified: true, // Google users are automatically verified
          profilePicture: picture,
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: sub,
            }
          }
        },
        include: { accounts: true }
      });
    } else {
      // User exists, check if Google account is linked
      const existingGoogleAccount = user.accounts.find(
        account => account.provider === 'google' && account.providerAccountId === sub
      );
      
      if (!existingGoogleAccount) {
        // Link Google account to existing user
        await prisma.account.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: sub
          }
        });
      }
      
      // Ensure user is verified (in case they were created via email signup but not verified)
      if (!user.isVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true }
        });
        user.isVerified = true;
      }
    }

    // Issue JWT
    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email 
    }, process.env.SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = googleAuth; 