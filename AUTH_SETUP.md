# Authentication Setup for Web Workout

This project now supports OIDC authentication with user-specific workouts.

## Setup Instructions

### 1. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/authorize` (for development)
   - Note down Client ID and Client Secret

### 2. Server Configuration

1. Copy the environment template:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env` with your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   FLASK_SECRET_KEY=your_secret_key_here
   FLASK_SESSION_TYPE=filesystem
   ```

### 3. Database Migration

Run the migration script to update existing database:
```bash
cd server
python migrate.py
```

### 4. Install Dependencies

Server:
```bash
cd server
uv sync
```

Client:
```bash
cd client
npm install
```

### 5. Run the Application

Server:
```bash
cd server
python app.py
```

Client (in separate terminal):
```bash
cd client
npm run dev
```

## Features

- **OIDC Authentication**: Sign in with Google OAuth
- **User-specific Workouts**: Each user has their own private workout collection
- **Secure API**: All workout endpoints require authentication
- **Session Management**: Secure session handling with Flask-Login

## API Changes

All workout API endpoints now require authentication:
- `GET /api/workouts` - Returns current user's workouts only
- `POST /api/workouts` - Creates workout for current user
- `PUT /api/workouts/:id` - Updates workout only if owned by current user
- `DELETE /api/workouts/:id` - Deletes workout only if owned by current user

New authentication endpoints:
- `GET /login` - Redirects to Google OAuth
- `GET /authorize` - OAuth callback handler
- `GET /logout` - Logs out user
- `GET /api/user` - Returns current user information

## Database Schema

New `user` table:
- `id` (Primary Key)
- `email` (Unique)
- `name`
- `oauth_provider`
- `oauth_id`

Updated `workout` table:
- Added `user_id` foreign key (Required)
- All existing workouts are migrated to a default user