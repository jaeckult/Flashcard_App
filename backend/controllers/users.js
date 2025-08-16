const express = require('express');
const userRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { identifyUser } = require('../utils/middleware');

userRouter.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                profilePicture: true,
                role: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve users' });
    }
});

userRouter.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                profilePicture: true,
                role: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Could not retrieve user' });
    }
});

userRouter.patch('/:id', identifyUser, async (req, res) => {
    console.log(req.body);
    const { email, password, profilePicture, role } = req.body;

    const updateData = {};

    if (email) {
        updateData.email = email;
    }

    if (profilePicture) {
        updateData.profilePicture = profilePicture;
    }

    if (role) {
        updateData.role = role;
    }

    if (password) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updateData.passwordHash = hashedPassword;
        } catch (err) {
            return res.status(500).json({ error: 'Error hashing password' });
        }
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                profilePicture: true,
                role: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Could not update user' });
    }
});

module.exports = userRouter;