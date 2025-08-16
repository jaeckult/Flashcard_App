# Burbly Flashcard App - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `env-template.txt` to `.env` and fill in your configuration:
```bash
cp env-template.txt .env
```

Required environment variables:
- `DATABASE_URL`: SQLite database path (default: "file:./dev.db")
- `SECRET`: JWT secret key
- `SENDGRID_API_KEY`: For email OTP functionality
- `GOOGLE_CLIENT_ID`: For Google OAuth (optional)
- `TWILIO_*`: For SMS OTP (optional)

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with initial data
node seed.js
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/signup/set-password` - Set password after verification
- `POST /api/login` - User login
- `POST /api/verify-otp` - Verify OTP
- `POST /api/auth/google` - Google OAuth
- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/reset` - Reset password
- `POST /api/logout` - User logout

### User Management
- `GET /api/me` - Get current user
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all published posts (with pagination, search, filtering)
- `GET /api/posts/:id` - Get a single post by ID
- `POST /api/posts` - Create a new post (authenticated users only)
- `PATCH /api/posts/:id` - Update a post (author or admin only)
- `DELETE /api/posts/:id` - Delete a post (author or admin only)
- `POST /api/posts/:id/like` - Like a post (authenticated users only)
- `GET /api/posts/user/me` - Get current user's posts
- `GET /api/posts/user/:userId` - Get posts by user ID (public)

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `GET /api/comments/:commentId/replies` - Get replies for a comment
- `POST /api/comments` - Create a new comment (authenticated users only)
- `PATCH /api/comments/:id` - Update a comment (author only)
- `DELETE /api/comments/:id` - Delete a comment (author only)
- `POST /api/comments/:id/like` - Like a comment (authenticated users only)
- `GET /api/comments/user/me` - Get current user's comments

## Features

- **Email/Password Authentication**: Complete signup flow with OTP verification
- **Google OAuth**: Social login integration
- **Password Reset**: Secure password reset via email
- **JWT Authentication**: Stateless authentication with middleware
- **Role-based Access Control**: User roles and permissions
- **Email Integration**: SendGrid for OTP and notifications
- **Content Management**: Full CRUD operations for posts and comments
- **Social Features**: Like posts/comments, nested comments, user interactions
- **Search & Filtering**: Post search, tag filtering, pagination
- **Database**: Prisma ORM with SQLite

## Project Structure

```
backend/
├── controllers/          # Route handlers
├── utils/               # Middleware and utilities
├── prisma/              # Database schema and migrations
├── app.js               # Express app configuration
├── seed.js              # Database seeding
└── package.json         # Dependencies
```
