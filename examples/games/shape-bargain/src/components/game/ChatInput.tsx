import { useState, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  messagesCount: number; // Add to track when game restarts
}

export default function ChatInput({ isLoading, onSendMessage, messagesCount }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Array of prompt suggestions
  const promptSuggestions = [
    "what are you selling?",
    "what are you?"
  ];

  // Reset suggestions visibility when game is restarted (messagesCount changes to 0)
  // Hide suggestions if there is at least one player message
  useEffect(() => {
    if (messagesCount === 0) {
      setShowSuggestions(true);
    } else if (messagesCount > 0) {
      setShowSuggestions(false);
    }
  }, [messagesCount]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
    setShowSuggestions(false);
  };

  // Hide suggestions if there is at least 1 message in the message area from the user
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim() !== '' && showSuggestions) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative flex-1">
      {/* Prompt suggestions that appear above the input */}
      {message === '' && showSuggestions && (
        <div className="absolute bottom-full mb-2 w-full flex flex-wrap gap-2">
          {promptSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1 bg-secondary hover:bg-secondary-foreground hover:text-secondary text-secondary-foreground rounded-full text-xs font-secondary transition-colors cursor-pointer transition-all duration-50"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 font-secondary transition-all duration-300"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-lg"
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
} 