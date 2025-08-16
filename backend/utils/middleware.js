const logger = require('./logger')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const getTokenFrom = (request, response, next) => {
  const auth = request.get('authorization');
  logger.info('Authorization header:', auth); // Debug
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    request.token = auth.slice(7);
    logger.info('Extracted token:', request.token); // Debug
  } else {
    logger.info('No valid Bearer token found');
  }
  next();
};

const identifyUser = async (req, res, next) => {
  const token = req.token; 

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  console.log('Token received:', token.substring(0, 20) + '...'); // Log first 20 chars for debugging

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    console.log('Decoded token:', decoded); // Debug log
    
    // Handle both token structures: {id, username} and {userId, email}
    const userId = decoded.id || decoded.userId; 

    if (!userId) {
      console.log('No userId found in token. Available fields:', Object.keys(decoded));
      return res.status(401).json({ error: 'Unauthorized - Invalid token structure' });
    }

    console.log('Looking for user with ID:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid user' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  } finally {
    await prisma.$disconnect();
  }
};

const requireVerification = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Account not verified. Please verify your email to continue.',
        requiresVerification: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking verification status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - No user context' });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};

const errorHandler = (error, request, response, next) => {
  logger.error(error)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if(error.name === 'PasswordErr'){
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    return response.status(400).json({ error: 'Email already taken' });
  } else if (error.name === 'JsonWebTokenError'){
    return response.status(401).json({
      error: 'invalid token'
    })
  }
  next(error)
};

module.exports = {
  requestLogger,
  getTokenFrom,
  unknownEndpoint,
  identifyUser,
  requireVerification,
  requireRole,
  errorHandler,
}