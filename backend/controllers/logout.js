const logoutRouter = require('express').Router();

logoutRouter.post('/', (req, res) => {
  // Clear the cookie named 'token' (or your actual cookie name)
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = logoutRouter;