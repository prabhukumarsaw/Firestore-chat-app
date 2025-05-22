'use client';

import type { Message as MessageType } from '@/types/blabberbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import { SendHorizontal, UserX, Loader2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface ChatInterfaceProps {
  messages: MessageType[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onLeaveChat: () => void;
  partnerName?: string; // Optional
  partnerDisconnected?: boolean;
}

export function ChatInterface({
  messages,
  currentUserId,
  onSendMessage,
  onLeaveChat,
  partnerName = 'Partner',
  partnerDisconnected = false,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-background shadow-xl rounded-lg overflow-hidden">
      <header className="p-4 border-b bg-card">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-card-foreground">
            Chat with {partnerDisconnected ? <span className="text-destructive-foreground/70">(Disconnected)</span> : partnerName}
          </h2>
          <Button variant="ghost" size="icon" onClick={onLeaveChat} aria-label="Leave chat">
            <UserX className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages.length === 0 && !partnerDisconnected && (
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Waiting for messages or say hi!</p>
          </div>
        )}
        {partnerDisconnected && (
          <div className="flex flex-col items-center justify-center h-full text-destructive">
            <UserX className="h-12 w-12 mb-2" />
            <p className="text-lg">Your partner has left the chat.</p>
            <Button onClick={onLeaveChat} className="mt-4" variant="outline">
              Find new chat
            </Button>
          </div>
        )}
        {!partnerDisconnected && messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.senderId === currentUserId} />
        ))}
      </ScrollArea>

      {!partnerDisconnected && (
        <footer className="p-4 border-t bg-card">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow"
              aria-label="Message input"
            />
            <Button onClick={handleSend} className="bg-accent hover:bg-accent/90 text-accent-foreground" aria-label="Send message">
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
