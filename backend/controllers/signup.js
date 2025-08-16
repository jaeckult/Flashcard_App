// routes/signupRouter.js

const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const signupRouter = express.Router();
const prisma = new PrismaClient();

signupRouter.post('/', async (req, res) => {
  const { email } = req.body;
  console.log("signup request body:", req.body);
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user already exists by email
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: 'Email already registered and verified' });
    }

    let user;
    if (existingUser && !existingUser.isVerified) {
      // User exists but not verified, update email if needed
      user = existingUser;
    } else {
      // Create new user without password (will be set after verification)
      user = await prisma.user.create({
        data: {
          email,
          isVerified: false,
          passwordHash: "123456",
        }
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Creating OTP for user:', user.id, otp);

    // Upsert OTP (update if exists, create if not)
    await prisma.oTP.upsert({
      where: {
        userId: user.id,
      },
      update: {
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        verified: false,
      },
      create: {
        userId: user.id,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
      }
    });

    console.log('created OTP for user:', user.id, otp);

    const msg = {
      to: email,
      from: 'yitbarek.alemu-ug@aau.edu.com', // Change to your verified sender
      subject: 'Email Verification - Burbly Flashcard App',
      text: `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
      html: `<strong>Your verification code is: ${otp}</strong><br><p>This code will expire in 5 minutes.</p>`,
    }
    
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })

    return res.status(200).json({
      id: user.id,
      message: 'Verification email sent. Please verify your email with /verify-otp',
      requiresOtp: true
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Something went wrong during signup' });
  } finally {
    await prisma.$disconnect();
  }
});

// New endpoint to set password after email verification
signupRouter.post('/set-password', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email, password, and confirm password are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find verified user
    const user = await prisma.user.findFirst({
      where: {
        email,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found or not verified' });
    }

    // Check if user already has a password (from Google OAuth)
    if (user.passwordHash) {
      return res.status(400).json({ error: 'Password already set for this account' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user with password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return res.status(200).json({
      message: 'Password set successfully. You can now login with email and password.',
      userId: user.id
    });

  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({ error: 'Something went wrong while setting password' });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = signupRouter;
