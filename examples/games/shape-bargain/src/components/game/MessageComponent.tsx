import { memo, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MessageComponentProps {
  msg: { role: 'user' | 'merchant'; content: string };
  isTyping: boolean;
  displayedResponse: string;
  index: number;
  messagesLength: number;
  onCharacterStreamed?: () => void;
}

const MessageComponent = memo(function MessageComponent({ 
  msg, 
  isTyping, 
  displayedResponse, 
  index, 
  messagesLength,
  onCharacterStreamed 
}: MessageComponentProps) {
  const isLastMessage = index === messagesLength - 1;
  const isUser = msg.role === 'user';
  // Determine what content to display
  const displayContent = useMemo(() => {
    // For user messages or non-last messages, show the full content
    if (isUser || !isLastMessage) {
      return msg.content;
    }
    
    // For the last merchant message that's currently being typed
    if (isTyping) {
      return displayedResponse;
    }
    
    // Otherwise show full content
    return msg.content;
  }, [isUser, isLastMessage, isTyping, displayedResponse, msg.content]);

  // Notify parent when content changes (for scrolling)
  useEffect(() => {
    // Only trigger scroll if it's the last message and typing completed
    if (isLastMessage && onCharacterStreamed && isTyping) {
      // Throttle scroll notifications to avoid excessive scrolling
      const timeoutId = setTimeout(() => {
        onCharacterStreamed();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLastMessage, displayContent, onCharacterStreamed, isTyping]);

  // Memoize the markdown component to prevent unnecessary re-renders
  const MarkdownContent = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        // Hide code blocks completely
        pre: () => null,
        
        // Only render inline code, not block code
        code: ({ node, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          // If it has a language class, it's a block code - hide it
          if (match) {
            return null;
          }
          
          // Only render inline code elements
          const isInlineCode = !match && (
            !props.node?.position?.start?.column ||
            props.node?.position?.start?.column > 1
          );
          
          if (isInlineCode) {
            return (
              <code
                className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded"
                {...props}
              >
                {children}
              </code>
            );
          }
          
          // Otherwise hide block code
          return null;
        },
      }}
    >
      {displayContent}
    </ReactMarkdown>
  ), [displayContent]);

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`${
          isUser
            ? 'bg-primary text-primary-foreground rounded-bl-xl'
            : 'bg-gray-100 rounded-xl'
        } max-w-[80%] rounded-tl-xl rounded-tr-xl px-4 py-2 font-secondary relative mb-4`}
      >
        <div className="break-normal">
          {MarkdownContent}
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

export default MessageComponent; 