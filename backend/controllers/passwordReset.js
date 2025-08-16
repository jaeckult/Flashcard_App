const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const passwordResetRouter = express.Router();
const prisma = new PrismaClient();

// Request password reset
passwordResetRouter.post('/request', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: 'Please verify your email before resetting password' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'This account was created with Google. Please use Google login instead.' });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token
    await prisma.verificationToken.upsert({
      where: {
        identifier: email
      },
      update: {
        token: resetToken,
        expires: expiresAt
      },
      create: {
        identifier: email,
        token: resetToken,
        expires: expiresAt
      }
    });

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    
    const msg = {
      to: email,
      from: 'yitbarek.alemu-ug@aau.edu.com',
      subject: 'Password Reset - Burbly Flashcard App',
      text: `Click the following link to reset your password: ${resetLink}. This link will expire in 15 minutes.`,
      html: `<p>Click the following link to reset your password:</p><a href="${resetLink}">Reset Password</a><p>This link will expire in 15 minutes.</p>`
    };

    await sgMail.send(msg);

    return res.status(200).json({
      message: 'Password reset email sent. Please check your email.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: 'Something went wrong while requesting password reset' });
  } finally {
    await prisma.$disconnect();
  }
});

// Reset password with token
passwordResetRouter.post('/reset', async (req, res) => {
  const { email, token, password, confirmPassword } = req.body;

  if (!email || !token || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email, token, password, and confirm password are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token
      }
    });

    if (!verificationToken) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (new Date(verificationToken.expires) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // Delete verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id }
    });

    return res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Something went wrong while resetting password' });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = passwordResetRouter;
