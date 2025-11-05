import { Activity } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex gap-3 mb-4 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
        <Activity className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="bg-card text-card-foreground rounded-2xl px-4 py-3 shadow-card border border-border">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
};
