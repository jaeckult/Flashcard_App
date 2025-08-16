const jwt = require('jsonwebtoken');
const loginRouter = require('express').Router();
const bcrypt = require('bcrypt');
const {PrismaClient} = require('@prisma/client');
const { identifyUser } = require('../utils/middleware');
const prisma = new PrismaClient();

loginRouter.post('/', async(req, res)=>{
    console.log('login request body:', req.body);
    
    const {email, password} = req.body;

    if(!(email && password)){
        return res.status(401).json({
            error: "Email and password are required"
        });
    }
    
    try{
        const user = await prisma.user.findUnique({
            where: { email },
        });
        
        if (!user) {
            return res.status(400).json({
                error: 'Email or password incorrect'
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(400).json({
                error: 'Please verify your email before logging in'
            });
        }

        // Check if user has a password (might be Google OAuth user)
        if (!user.passwordHash) {
            return res.status(400).json({
                error: 'This account was created with Google. Please use Google login instead.'
            });
        }

        const correctPass = await bcrypt.compare(password, user.passwordHash);
    
        if(!correctPass){
            return res.status(400).json({
                error: 'Email or password incorrect'
            });
        }

        const userToken = {
            userId: user.id,
            email: user.email
        };
        
        console.log('userToken:', userToken);
        const token = jwt.sign(userToken, process.env.SECRET, { expiresIn: '1h' });
        
        res.status(200).send({
            token,
            user: {
                id: user.id,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role
            }
        });
    
    } catch (error){
        console.error('error during login', error);
        res.status(500).json({error: 'internal server error during login'});
    } finally{
        await prisma.$disconnect();
    }
});

module.exports = loginRouter;