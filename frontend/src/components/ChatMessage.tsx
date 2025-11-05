import { marked } from 'marked';
import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

interface ChatMessageProps {
  type: 'user' | 'assistant' | 'error';
  content: string;
  imageData?: string | null;
}

export const ChatMessage = ({ type, content, imageData }: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  const renderContent = () => {
    if (type === 'assistant') {
      const html = marked(content, { breaks: true });
      return (
        <div
          className="prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return <p className="whitespace-pre-wrap text-sm sm:text-base">{content}</p>;
  };

  return (
    <div
      ref={messageRef}
      className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 animate-fade-in ${
        type === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {type === 'assistant' && (
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-card ${
          type === 'user'
            ? 'bg-primary text-primary-foreground'
            : type === 'error'
            ? 'bg-destructive/10 text-destructive border border-destructive/20'
            : 'bg-card text-card-foreground border border-border'
        }`}
      >
        {imageData && (
          <img
            src={imageData}
            alt="Uploaded medical image"
            className="max-w-[200px] sm:max-w-xs max-h-32 sm:max-h-48 object-contain rounded-lg mb-2 shadow-sm"
          />
        )}
        {renderContent()}
      </div>
    </div>
  );
};
