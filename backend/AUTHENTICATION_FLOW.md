# Authentication Flow Documentation

## Overview
This application supports two authentication methods:
1. **Email/Password Authentication** - Traditional signup with email verification
2. **Google OAuth** - Direct authentication via Google

## Email/Password Authentication Flow

### 1. Signup Process
**Endpoint:** `POST /api/signup`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "id": "user_id",
  "message": "Verification email sent. Please verify your email with /verify-otp",
  "requiresOtp": true
}
```

**What happens:**
- Creates a new user with `isVerified: false`
- Generates and sends OTP via email
- User cannot login until email is verified

### 2. Email Verification
**Endpoint:** `POST /api/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email successfully verified! You can now set your password.",
  "userId": "user_id",
  "email": "user@example.com",
  "requiresPassword": true
}
```

**What happens:**
- Verifies the OTP
- Marks user as `isVerified: true`
- User can now set their password

### 3. Set Password
**Endpoint:** `POST /api/signup/set-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword",
  "confirmPassword": "mypassword"
}
```

**Response:**
```json
{
  "message": "Password set successfully. You can now login with email and password.",
  "userId": "user_id"
}
```

**What happens:**
- Sets the user's password (hashed)
- User can now login with email/password

### 4. Login
**Endpoint:** `POST /api/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "profilePicture": "url",
    "role": "user"
  }
}
```

## Google OAuth Authentication Flow

### 1. Google Authentication
**Endpoint:** `POST /api/auth/google`

**Request Body:**
```json
{
  "idToken": "google_id_token"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "profilePicture": "google_picture_url",
    "role": "user",
    "isVerified": true
  }
}
```

**What happens:**
- Verifies Google ID token
- Creates new user or links to existing user
- Automatically marks user as verified
- No password required

## Password Reset Flow

### 1. Request Password Reset
**Endpoint:** `POST /api/password-reset/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent. Please check your email."
}
```

### 2. Reset Password
**Endpoint:** `POST /api/password-reset/reset`

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "reset_token",
  "password": "newpassword",
  "confirmPassword": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. You can now login with your new password."
}
```

## User Management

### Get Current User
**Endpoint:** `GET /api/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "profilePicture": "url",
    "role": "user",
    "isVerified": true,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "accounts": [
      {
        "provider": "google",
        "providerAccountId": "google_id"
      }
    ]
  }
}
```

### Update User
**Endpoint:** `PATCH /api/users/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "password": "newpassword",
  "profilePicture": "new_picture_url",
  "role": "admin"
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
- Missing required fields
- Invalid email format
- Password too short
- Passwords don't match
- Invalid OTP

**401 Unauthorized:**
- Invalid or missing token
- Invalid credentials

**403 Forbidden:**
- Account not verified
- Account deactivated
- Insufficient permissions

**404 Not Found:**
- User not found
- Invalid reset token

**500 Internal Server Error:**
- Database errors
- Email service errors

## Security Features

1. **Email Verification**: All email/password users must verify their email
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **JWT Tokens**: Secure token-based authentication
4. **Account Linking**: Google accounts can be linked to existing email accounts
5. **Role-based Access**: Support for user roles and permissions
6. **Account Status**: Support for active/inactive accounts

## Environment Variables Required

```env
DATABASE_URL="file:./dev.db"
SECRET="your_jwt_secret"
SENDGRID_API_KEY="your_sendgrid_api_key"
GOOGLE_CLIENT_ID="your_google_client_id"
FRONTEND_URL="http://localhost:3001"
```
