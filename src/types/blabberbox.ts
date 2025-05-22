import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  status: 'idle' | 'waiting' | 'chatting';
  currentChatId: string | null;
  lastSeen: Timestamp;
  name?: string; // Optional: for display if we want to add names later
}

export interface Chat {
  id: string;
  userIds: string[];
  createdAt: Timestamp;
  status: 'active' | 'ended';
  // Optional: store last message for chat list previews, not strictly needed for 1:1 instant chat
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}
