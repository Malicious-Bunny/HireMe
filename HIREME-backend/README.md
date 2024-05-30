# HIREME Backend

This is the backend for the HIREME web application, built using Node.js, Express, and MongoDB.

## Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file and add your environment variables.
4. Start the server: `npm start`

## API Endpoints

- **Authentication**
  - `POST /api/auth/register`: Register a new user.
  - `POST /api/auth/login`: Log in a user.

- **Profile**
  - `POST /api/profile`: Create a new profile.
  - `GET /api/profile`: Get the current user's profile.
  - `PUT /api/profile`: Update the current user's profile.
  - `DELETE /api/profile`: Delete the current user's profile.

- **Chat**
  - `POST /api/chat/initiate`: Initiate a new chat session.
  - `POST /api/chat/message`: Send a message in a chat session.
  - `GET /api/chat/:chat_id/messages`: Get messages in a chat session.

- **Notifications**
  - `GET /api/notifications`: Get notifications for the current user.
  - `PUT /api/notifications/:notification_id/read`: Mark a notification as read.
