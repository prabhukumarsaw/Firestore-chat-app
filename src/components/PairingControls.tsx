'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquarePlus, WifiOff, AlertTriangle } from 'lucide-react';

type PairingStatus = 'idle' | 'waiting' | 'error_no_partner' | 'error_firebase' | 'connecting';

interface PairingControlsProps {
  status: PairingStatus;
  onFindChat: () => void;
  onCancelSearch?: () => void; // Optional: if you implement cancellation
}

export function PairingControls({ status, onFindChat, onCancelSearch }: PairingControlsProps) {
  const isLoading = status === 'waiting' || status === 'connecting';

  const statusMessages: Record<PairingStatus, { icon: React.ReactNode; title: string; description: string; showButton: boolean, buttonText?: string, buttonAction?: () => void, buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }> = {
    idle: {
      icon: <MessageSquarePlus className="h-12 w-12 text-primary mb-4" />,
      title: 'Ready to Chat?',
      description: 'Click the button below to find a random chat partner.',
      showButton: true,
      buttonText: 'Find a Chat Partner',
      buttonAction: onFindChat,
    },
    waiting: {
      icon: <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />,
      title: 'Searching for a Partner...',
      description: 'Please wait while we connect you with someone.',
      showButton: !!onCancelSearch, // Show cancel button if handler is provided
      buttonText: 'Cancel Search',
      buttonAction: onCancelSearch,
      buttonVariant: 'outline',
    },
    connecting: {
      icon: <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />,
      title: 'Partner Found!',
      description: 'Connecting to your chat...',
      showButton: false,
    },
    error_no_partner: {
      icon: <WifiOff className="h-12 w-12 text-destructive mb-4" />,
      title: 'No Partner Available',
      description: 'Sorry, we couldn\'t find anyone to chat with right now. Please try again later.',
      showButton: true,
      buttonText: 'Try Again',
      buttonAction: onFindChat,
      buttonVariant: 'outline',
    },
    error_firebase: {
      icon: <AlertTriangle className="h-12 w-12 text-destructive mb-4" />,
      title: 'Connection Error',
      description: 'There was an issue connecting to the chat service. Please check your internet connection and try again.',
      showButton: true,
      buttonText: 'Retry',
      buttonAction: onFindChat,
      buttonVariant: 'destructive',
    },
  };

  const currentStatus = statusMessages[status];

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          {currentStatus.icon}
          <CardTitle className="text-2xl">{currentStatus.title}</CardTitle>
          <CardDescription>{currentStatus.description}</CardDescription>
        </CardHeader>
        {currentStatus.showButton && currentStatus.buttonText && currentStatus.buttonAction && (
          <CardContent className="flex justify-center">
            <Button
              onClick={currentStatus.buttonAction}
              disabled={isLoading && status !== 'waiting'} // Disable if connecting, or if waiting but no cancel handler
              size="lg"
              variant={currentStatus.buttonVariant || 'default'}
              className={isLoading ? 'animate-pulse' : ''}
            >
              {isLoading && status === 'waiting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStatus.buttonText}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
