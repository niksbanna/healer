import { useState, useEffect, useRef } from 'react';
import { Activity, Send, ImageIcon, Trash2, X, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ExamplePrompts } from '@/components/ExamplePrompts';
import { useToast } from '@/hooks/use-toast';
import { useSpeechToText } from '@/hooks/use-speech-to-text';

interface Message {
  type: 'user' | 'assistant' | 'error';
  content: string;
  imageData?: string | null;
}

const STORAGE_KEY = 'healer_chat_history';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Speech-to-text hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechToText({
    onResult: (finalTranscript) => {
      // When we get final results, append them to the input
      setInput((prev) => {
        const newText = prev ? `${prev} ${finalTranscript}` : finalTranscript;
        return newText.trim();
      });
    },
    onError: (error) => {
      toast({
        title: 'Speech recognition error',
        description: error,
        variant: 'destructive'
      });
    },
    continuous: true,
    language: 'en-US',
  });

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.filter((msg: Message) => msg.type !== 'error'));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.filter(msg => msg.type !== 'error');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image/(png|jpeg|jpg)')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PNG or JPEG image.',
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        // Reset the input value after the file is read to allow selecting the same file again
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'Chat cleared',
      description: 'All messages have been removed.'
    });
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      type: 'user',
      content: input.trim(),
      imageData: selectedImage
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Placeholder API call - replace with actual MedGemma API endpoint
      const formData = new FormData();
      formData.append('question', userMessage.content);
      if (userMessage.imageData) {
        // Convert base64 data URL to binary Blob
        const base64Response = await fetch(userMessage.imageData);
        const blob = await base64Response.blob();
        formData.append('image_file', blob, 'image.jpg');
      }

      const response = await fetch(`${import.meta.env.VITE_MEDGEMMA_API_URL}/predict`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: data.prediction || 'I apologize, but I could not process your request at this time.'
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Unable to connect to the medical AI service. Please check your connection and try again.'
      }]);
      
      toast({
        title: 'Connection error',
        description: 'Could not reach the AI service.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePromptClick = (prompt: string, triggerUpload?: boolean) => {
    setInput(prompt);
    if (triggerUpload) {
      fileInputRef.current?.click();
    }
    textareaRef.current?.focus();
  };

  const toggleSpeechRecognition = () => {
    if (!isSupported) {
      toast({
        title: 'Not supported',
        description: 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.',
        variant: 'destructive'
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-doctor-bg to-medical-light">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex flex-col h-screen max-w-5xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-6 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-medical">
              <img src="/healer-logo.png" alt='healer-logo' />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Healer</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Powered by MedGemma</p>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChatHistory}
              className="gap-1 sm:gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 px-2 sm:px-3"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Clear Chat</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </header>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 sm:space-y-8 py-6 sm:py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-medical animate-pulse-glow">
                <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-primary-foreground" />
              </div>

              <div className="text-center space-y-2 sm:space-y-3 max-w-2xl px-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome to Healer</h2>
                <p className="text-muted-foreground text-sm sm:text-lg">
                  Your AI medical assistant powered by MedGemma. Ask questions about symptoms,
                  medical conditions, or upload images for analysis.
                </p>
              </div>

              <div className="w-full max-w-3xl px-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center">Try these examples:</p>
                <ExamplePrompts onPromptClick={handlePromptClick} />
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  type={msg.type}
                  content={msg.content}
                  imageData={msg.imageData}
                />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
        </div>

        {/* Input Footer */}
        <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 sm:p-6">
          {selectedImage && (
            <div className="mb-3 sm:mb-4 relative inline-block">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-[200px] sm:max-w-xs h-24 sm:h-32 object-cover rounded-lg border-2 border-primary shadow-medical"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 hover:bg-primary/10 hover:border-primary/30"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSpeechRecognition}
              className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white animate-pulse'
                  : 'hover:bg-primary/10 hover:border-primary/30'
              }`}
              disabled={isLoading}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              )}
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms or ask a medical question..."
              className="min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none focus:ring-primary text-sm sm:text-base"
              disabled={isLoading}
            />

            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="flex-shrink-0 h-[50px] sm:h-[60px] px-3 sm:px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-medical"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <p className="hidden sm:block">Press <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> to send, <kbd className="px-2 py-1 bg-muted rounded">Shift + Enter</kbd> for new line</p>
            <p className="sm:hidden text-xs">Press Enter to send</p>
            <p className="text-left sm:text-right">⚠️ For informational purposes only. Consult a doctor for medical advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
