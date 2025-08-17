const express = require('express');
const cors = require('cors');
const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:65028'; 
const SENDGRID_ORIGIN = process.env.SENDGRID_ORIGIN || 'https://api.sendgrid.com';
app.use(express.json());

// CORS config: whitelist your front‑end and allow cookies/credentials
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,                // <-- allows Access-Control-Allow-Credentials: true
  optionsSuccessStatus: 200,
}));

// Optional: if you want to manually set headers (cors() will do this for you)
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });

const { getTokenFrom } = require('./utils/middleware');
const userRouter       = require('./controllers/users');
const loginRouter      = require('./controllers/login');
const signupRouter     = require('./controllers/signup');
const verifyOtpRouter  = require('./controllers/verifyOtp');
const googleAuth       = require('./controllers/googleAuth');
const passwordResetRouter = require('./controllers/passwordReset');
const healthcheckRouter = require('./controllers/healthcheck');
const postsRouter      = require('./controllers/posts');
const commentsRouter   = require('./controllers/comments');


app.use(getTokenFrom);

app.use('/api/users', userRouter);
app.use('/api/login', loginRouter);
app.use('/api/signup', signupRouter);
app.use('/api/logout', require('./controllers/logout'));
app.use('/api/verify-otp', verifyOtpRouter);
app.use('/api/me', require('./controllers/me'));
app.post('/api/auth/google', googleAuth);
app.use('/api/password-reset', passwordResetRouter);
app.use('/api/health', healthcheckRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);



app.get('/', (req, res) => {
  res.send('<h1>Welcome to the API</h1>');
});

app.listen(3000, () => {
  console.log(`API listening at http://localhost:3000`);
});
