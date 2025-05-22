'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { PairingControls } from '@/components/PairingControls';
import { ChatInterface } from '@/components/ChatInterface';
import * as chatService from '@/services/chatService';
import type { User as UserType, Message as MessageType, Chat as ChatType } from '@/types/blabberbox';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, onSnapshot, Unsubscribe, collection, query, where, orderBy, limit, getDocs, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react'; // Added import for Loader2

type ChatState = 'idle' | 'waiting' | 'chatting' | 'error_no_partner' | 'error_firebase' | 'connecting';
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const PARTNER_TIMEOUT_THRESHOLD = HEARTBEAT_INTERVAL * 2.5; // ~37.5 seconds
const USERS_COLLECTION = 'users'; // Added constant for collection name

export default function HomePage() {
  const { userId } = useUser();
  const { toast } = useToast();
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [partner, setPartner] = useState<UserType | null>(null);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);

  const userListenerRef = useRef<Unsubscribe | null>(null);
  const messagesListenerRef = useRef<Unsubscribe | null>(null);
  const partnerListenerRef = useRef<Unsubscribe | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitingQueryListenerRef = useRef<Unsubscribe | null>(null);


  const cleanupListeners = useCallback(() => {
    userListenerRef.current?.();
    messagesListenerRef.current?.();
    partnerListenerRef.current?.();
    waitingQueryListenerRef.current?.();
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
  }, []);

  const resetToIdle = useCallback(() => {
    cleanupListeners();
    setChatState('idle');
    setCurrentChatId(null);
    setMessages([]);
    setPartner(null);
    setPartnerDisconnected(false);
    localStorage.removeItem('blabberbox_current_chat_id');
    if (userId) {
      chatService.updateUserStatus(userId, 'idle', null);
    }
  }, [userId, cleanupListeners]);


  // Effect for User Document Listener & Initial State Sync
  useEffect(() => {
    if (!userId) return;

    // Initial status update
    chatService.updateUserStatus(userId, 'idle');
    
    // Restore chat session from localStorage
    const storedChatId = localStorage.getItem('blabberbox_current_chat_id');
    if (storedChatId) {
      // Validate this chat session
      const chatRef = doc(db, 'chats', storedChatId);
      getDoc(chatRef).then(chatSnap => {
        if (chatSnap.exists()) {
          const chatData = chatSnap.data() as ChatType;
          if (chatData.userIds.includes(userId) && chatData.status === 'active') {
            const partnerId = chatData.userIds.find(uid => uid !== userId);
            if (partnerId) {
              setCurrentChatId(storedChatId);
              setChatState('chatting');
              // Fetch partner details if needed
              chatService.getUser(partnerId).then(setPartner);
            } else {
              resetToIdle(); // Invalid chat state
            }
          } else {
            resetToIdle(); // Chat not active or user not part of it
          }
        } else {
          resetToIdle(); // Chat doesn't exist
        }
      });
    }


    // Listen to own user document for changes (e.g., matched by another user)
    userListenerRef.current = chatService.onUserDocChange(userId, (user) => {
      if (user?.status === 'chatting' && user.currentChatId && user.currentChatId !== currentChatId) {
        setChatState('connecting');
        setCurrentChatId(user.currentChatId);
        localStorage.setItem('blabberbox_current_chat_id', user.currentChatId);
        // Partner details will be fetched when chat becomes active
      } else if (user?.status === 'idle' && currentChatId) {
        // If user status is idle but we thought we were in a chat, means something reset.
        // This could be a disconnect scenario handled elsewhere too.
        // resetToIdle(); // This might be too aggressive. Let specific handlers manage state.
      }
    });
    
    return () => {
      cleanupListeners();
      if (userId && chatState === 'chatting' && currentChatId) {
         chatService.leaveChat(userId, currentChatId);
      } else if (userId) {
         chatService.updateUserStatus(userId, 'idle', null); // Mark as idle on unmount/leaving page
      }
    };
  }, [userId, resetToIdle, currentChatId, chatState]); // Added chatState and currentChatId

  // Effect for Heartbeat
  useEffect(() => {
    if (userId && (chatState === 'chatting' || chatState === 'waiting')) {
      chatService.sendHeartbeat(userId); // Initial heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        chatService.sendHeartbeat(userId);
      }, HEARTBEAT_INTERVAL);
    } else {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    }
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [userId, chatState]);

  // Effect for Messages and Partner Listener when chatting
  useEffect(() => {
    if (chatState === 'chatting' && currentChatId && userId) {
      setChatState('chatting'); // Ensure state is chatting
      setPartnerDisconnected(false); // Reset disconnect flag

      messagesListenerRef.current = chatService.onMessagesUpdate(currentChatId, setMessages);
      
      // Get initial partner ID from chat document
      const chatRef = doc(db, 'chats', currentChatId);
      getDoc(chatRef).then(chatSnap => {
        if (chatSnap.exists()) {
          const chatData = chatSnap.data() as ChatType;
          const partnerId = chatData.userIds.find(uid => uid !== userId);
          if (partnerId) {
            chatService.getUser(partnerId).then(p => {
              if(p) setPartner(p);
            });
            // Listen to partner's user document for status and lastSeen
            partnerListenerRef.current = chatService.onUserDocChange(partnerId, (partnerUser) => {
              if (partnerUser) {
                setPartner(partnerUser);
                const lastSeenMs = partnerUser.lastSeen?.toMillis() || 0;
                const nowMs = Date.now();
                if (partnerUser.status !== 'chatting' || partnerUser.currentChatId !== currentChatId || (nowMs - lastSeenMs > PARTNER_TIMEOUT_THRESHOLD)) {
                  if (!partnerDisconnected) { // Only trigger once
                    setPartnerDisconnected(true);
                    toast({ title: 'Partner Disconnected', description: `${partnerUser.name || 'Your partner'} has left the chat or disconnected.`, variant: 'destructive' });
                    // Don't reset to idle immediately, let user see the message in ChatInterface
                  }
                }
              } else { // Partner document deleted or doesn't exist
                if (!partnerDisconnected) {
                  setPartnerDisconnected(true);
                  toast({ title: 'Partner Left', description: 'Your partner has left the chat.', variant: 'destructive' });
                }
              }
            });
          }
        }
      });
    } else {
      messagesListenerRef.current?.();
      partnerListenerRef.current?.();
    }
    return () => {
      messagesListenerRef.current?.();
      partnerListenerRef.current?.();
    };
  }, [chatState, currentChatId, userId, toast, partnerDisconnected]);


  const handleFindChat = useCallback(async () => {
    if (!userId) return;

    setChatState('waiting');
    await chatService.updateUserStatus(userId, 'waiting');

    // Listen for other waiting users
    if (waitingQueryListenerRef.current) waitingQueryListenerRef.current(); // Clean up previous listener

    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where('status', '==', 'waiting'),
      where('id', '!=', userId),
      orderBy('id'), // Necessary for inequality filter
      orderBy('lastSeen', 'asc'), // Oldest waiting user
      limit(1)
    );
    
    // This is a one-time fetch to try and match immediately
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const partnerDoc = querySnapshot.docs[0];
        const partnerId = partnerDoc.id;
        
        // Attempt to create chat (transactionally)
        const newChatId = await chatService.createChatWithPartner(userId, partnerId);
        if (newChatId) {
          setCurrentChatId(newChatId);
          localStorage.setItem('blabberbox_current_chat_id', newChatId);
          setChatState('connecting'); // Will transition to 'chatting' via user listener
          toast({ title: 'Partner Found!', description: 'Connecting to chat...' });
        } else {
          // Transaction failed, someone else got there first or user status changed
          setChatState('waiting'); // Remain waiting
        }
      } else {
        // No one waiting currently, remain in 'waiting' state.
        // The user listener on self will pick up if someone else matches them.
        // We could add a timeout here or a listener for new waiting users.
        // For now, user stays 'waiting' until matched or they cancel/leave.
      }
    } catch (error) {
      console.error("Error finding partner: ", error);
      toast({ title: 'Pairing Error', description: 'Could not find a partner. Please try again.', variant: 'destructive' });
      setChatState('error_firebase');
      await chatService.updateUserStatus(userId, 'idle');
    }

  }, [userId, toast]);

  const handleSendMessage = (text: string) => {
    if (currentChatId && userId && !partnerDisconnected) {
      chatService.sendMessage(currentChatId, userId, text);
    }
  };

  const handleLeaveChat = useCallback(() => {
    if (userId && currentChatId) {
      chatService.leaveChat(userId, currentChatId);
      // The partner's listener should pick up this user's status change.
    }
    resetToIdle();
    toast({ title: 'Chat Ended', description: 'You have left the chat.' });
  }, [userId, currentChatId, resetToIdle, toast]);


  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (chatState === 'chatting' && currentChatId) {
    return (
      <main className="h-screen_or_svh flex flex-col py-4 px-2 sm:px-4 md:px-6">
        <style jsx global>{`
          body, html, #__next {
            height: 100%;
            overflow: hidden; /* Prevent body scroll when chat is full height */
          }
          .h-screen_or_svh {
             height: 100vh; /* Fallback for older browsers */
             height: 100svh; /* Smallest viewport height */
          }
        `}</style>
        <ChatInterface
          messages={messages}
          currentUserId={userId}
          onSendMessage={handleSendMessage}
          onLeaveChat={handleLeaveChat}
          partnerName={partner?.name || 'Partner'}
          partnerDisconnected={partnerDisconnected}
        />
      </main>
    );
  }

  return (
    <main>
      <PairingControls status={chatState} onFindChat={handleFindChat} />
    </main>
  );
}
