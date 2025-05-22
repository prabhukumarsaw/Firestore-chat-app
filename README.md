# Blabberbox - Instant Chat App

This is a Next.JS application called Blabberbox that allows users to instantly connect and chat with new people. It uses Firebase Firestore for real-time chat and user status management.

## Features

- **Instant Chat Pairing**: Users can quickly find and connect with another available user for a chat.
- **Simple Chat Interface**: A clean, chronological display of messages.
- **Real-time Communication**: Powered by Firebase Firestore.
- **Connection Health**: Basic heartbeat mechanism to detect user presence.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Firebase project

### Firebase Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2.  In your Firebase project, go to **Project settings** (the gear icon).
3.  Under the "General" tab, scroll down to "Your apps".
4.  Click on the Web icon (`</>`) to add a web app.
5.  Register your app. You can give it any nickname. Firebase Hosting setup is optional for now.
6.  After registering, Firebase will provide you with a `firebaseConfig` object. You'll need these values.
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```
7.  In your Firebase project, navigate to **Firestore Database** (under Build).
8.  Click "Create database".
9.  Choose **Start in test mode** for development (allows open read/write access - **be sure to secure this with Security Rules before production**).
10. Select a Cloud Firestore location.
11. Click "Enable".

### Environment Variables

Create a `.env.local` file in the root of your project (copy from `.env.example`) and fill in your Firebase project's configuration values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

### Installation and Running

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd blabberbox
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in your `package.json` dev script) with your browser to see the result.

## Project Structure

- `src/app/page.tsx`: Main application page, handles chat state and UI.
- `src/components/`: Contains UI components like `ChatInterface.tsx`, `MessageBubble.tsx`, `PairingControls.tsx`.
- `src/hooks/`: Custom React hooks, e.g., `useUser.ts` for managing user identity.
- `src/lib/firebase.ts`: Firebase initialization.
- `src/services/chatService.ts`: Contains functions for interacting with Firestore (user status, pairing, messages).
- `src/types/blabberbox.ts`: TypeScript type definitions.
- `src/app/globals.css`: Global styles and Tailwind CSS theme customization.

## Firestore Data Model

- **`users/{userId}`**:
  - `id: string` (user's unique ID)
  - `status: 'idle' | 'waiting' | 'chatting'` (current status of the user)
  - `currentChatId: string | null` (ID of the active chat, if any)
  - `lastSeen: Timestamp` (timestamp of the user's last activity/heartbeat)
- **`chats/{chatId}`**:
  - `id: string` (chat session ID)
  - `userIds: string[]` (array of two user IDs participating in the chat)
  - `createdAt: Timestamp` (when the chat was created)
  - `status: 'active' | 'ended'`
  - `lastMessage: object` (optional, for previews: `{ text, senderId, timestamp }`)
- **`chats/{chatId}/messages/{messageId}`**: (Subcollection)
  - `senderId: string`
  - `text: string`
  - `timestamp: Timestamp`

## Future Enhancements

- Secure Firebase Firestore rules for production.
- More robust user identification (e.g., Firebase Anonymous Authentication).
- Displaying partner's typing indicator.
- User profiles or display names.
- Chat history (if desired beyond ephemeral chats).
- Group chats.
- Push notifications for new messages or matches.
```