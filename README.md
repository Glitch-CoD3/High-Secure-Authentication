🔐 High-Security Email OTP Authentication System

A robust authentication system built with modern security practices, featuring OTP-based email verification, refresh token rotation, and secure session management.

🚀 Features
✅ Email OTP verification before login
🔒 Hashed password storage (bcrypt)
🔑 OTP stored in hashed format
♻️ Refresh token rotation for enhanced security
🧠 Session-based authentication system
🚫 Login restricted without OTP verification
🗑️ OTP auto-deletion after successful verification
🔐 Refresh tokens stored in hashed format

🛡️ Security Highlights
Passwords are hashed using strong cryptographic hashing (bcrypt)
OTPs are never stored in plain text
Refresh tokens are securely hashed before storing in the database
Token rotation prevents token reuse attacks
Sessions are revoked on logout


🏗️ Tech Stack
Backend: Node.js, Express.js
Database: MongoDB (Mongoose ODM)
Authentication: JWT (Access & Refresh Tokens)
Security: bcrypt (Password & OTP hashing)
Email Service: Nodemailer (OTP delivery)


📦 Dependencies
{
  "bcrypt": "^6.0.0",
  "cookie-parser": "^1.4.7",
  "dotenv": "^17.4.1",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.4.1",
  "nodemailer": "^8.0.5",
  "nodemon": "^3.1.14"
}


Backend/
│── node_modules/
│── src/
│   ├── config/
│   │   └── db.config.js          # Database connection setup
│   │
│   ├── controllers/
│   │   └── auth.controller.js   # Authentication logic (login, register, OTP)
│   │
│   ├── models/
│   │   ├── user.models.js       # User schema
│   │   ├── OTP.models.js        # OTP schema (hashed OTP)
│   │   ├── session.models.js    # Session management (hashed refresh token)
│   │   └── tokenBlacklist.models.js # Blacklisted tokens
│   │
│   ├── routes/
│   │   └── auth.routes.js       # Authentication routes
│   │
│   ├── services/
│   │   └── email.js             # OTP email sending service
│   │
│   ├── utils/
│   │   └── utils.js             # Helper functions
│   │
│   ├── app.js                   # Express app configuration
│   └── constant.js              # Constants used across project
│
│── .env                         # Environment variables
│── .gitignore
│── package.json
│── package-lock.json
│── server.js                    # Entry point






📡 API Endpoints
🔐 Authentication Routes

POST /api/auth/register
Register a new user and send OTP to email

POST /api/auth/verify-email
Verify user email using OTP

POST /api/auth/login
Login user (only after OTP verification)

GET /api/auth/refresh
Generate new access token using refresh token

POST /api/auth/logout
Logout from current device

POST /api/auth/logout-all
Logout from all devices
