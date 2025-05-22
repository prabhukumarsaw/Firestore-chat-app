import type { Message } from '@/types/blabberbox';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const bubbleAlignment = isCurrentUser ? 'items-end' : 'items-start';
  const bubbleStyles = isCurrentUser
    ? 'bg-primary text-primary-foreground'
    : 'bg-card text-card-foreground';
  const timeAlignment = isCurrentUser ? 'text-right' : 'text-left';

  return (
    <div className={cn('flex flex-col mb-3', bubbleAlignment)}>
      <div
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow',
          bubbleStyles
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
      </div>
      <span className={cn("text-xs text-muted-foreground mt-1 px-1", timeAlignment)}>
        {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
      </span>
    </div>
  );
}
