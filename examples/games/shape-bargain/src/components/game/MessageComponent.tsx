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

// Deal notification component
const DealNotification = ({ 
  dealStatus, 
  item 
}: { 
  dealStatus: 'pending' | 'accepted' | 'rejected';
  item?: { name: string; price: number } | null;
}) => {
  const statusText = {
    pending: '⏳',
    accepted: '✅',
    rejected: '❌'
  }[dealStatus];

  const statusColor = {
    pending: 'bg-amber-100 border-amber-500',
    accepted: 'bg-green-100 border-green-500',
    rejected: 'bg-red-100 border-red-500'
  }[dealStatus];

  return (
    <div className={`${statusColor} border-l-4 px-4 py-2 rounded-md my-2 font-medium text-sm`}>
      <div className="flex items-center justify-between">
        <div>{statusText}</div>
        {item && (
          <div className="flex flex-col items-end text-right">
            <span className="font-normal">{item.name}</span>
            <span className="ml-2 font-bold">{item.price} gold</span>
          </div>
        )}
      </div>
    </div>
  );
};

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
  
  // Clean message content to make it more readable
  const cleanContent = useMemo(() => {
    if (isUser) return msg.content; // Don't modify user messages
    
    let content = msg.content;
    
    // Remove UI action JSON blocks
    content = content.replace(/\{(?:"ui_action"|'ui_action')[^}]*\}/g, '');
    
    // Remove deal blocks - more comprehensive to catch all formats
    // Remove deal blocks with triple backticks
    content = content.replace(/```(?:deal)?\s*\{[\s\S]*?\}\s*```/g, '');
    
    // Remove deal blocks without backticks - handle comments and multilines better
    content = content.replace(/deal\s*\n\s*\{[\s\S]*?\}/g, '');
    
    // Remove any other deal blocks that might have different formatting
    content = content.replace(/\{[\s\S]*?"items"[\s\S]*?\}/g, '');
    
    // Remove hidden deal status markers
    content = content.replace(/<!-- DEAL_STATUS: (accepted|rejected|pending) -->/g, '');
    
    // Highlight deal status indicators in a nicer way
    content = content.replace(/\[DEAL ACCEPTED\]/g, '✅ **Deal Accepted!**');
    content = content.replace(/\[NO DEAL\]/g, '❌ **No Deal**');
    
    // Add spacing around item lists for better readability
    content = content.replace(/(\n[*-])/g, '\n\n$1');
    
    // Ensure proper separation between item lists and following text
    content = content.replace(/(\n- [^\n]+(?:\(\d+ gold\))\n)([^-\n])/g, '$1\n$2');
    
    // Remove any remaining JSON-like content that aren't item listings (failsafe)
    // BUT preserve item listings with prices like "- lunar amulet (180)"
    content = content.replace(/(\{[^{}]*\})/g, (match) => {
      // Don't remove if it looks like an item listing
      if (/- [^(]+\(\d+\)/.test(match)) {
        return match;
      }
      return '';
    });
    
    // Clean up double line breaks that might be left after removing blocks
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Format the content with better paragraph breaks
    
    // Break up long sentences at punctuation - helps with readability
    const sentenceBreakers = ['. ', '! ', '? '];
    sentenceBreakers.forEach(breaker => {
      // Only break sentences if they're not already at the start of a line
      // and not already preceded by a line break
      content = content.replace(
        new RegExp(`([^\\n])${breaker.replace(/([.?!])/g, '\\$1')}([A-Z])`, 'g'), 
        `$1${breaker}\n$2`
      );
    });
    
    // Break up long content into paragraphs for better readability
    const maxLineLength = 80;
    const lines = content.split('\n');
    const formattedLines = lines.map(line => {
      // Skip lines that are short enough or already formatted (like lists)
      if (line.length <= maxLineLength || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return line;
      }
      
      // Break line at natural points (like commas, semicolons, etc.)
      // but only if the line is actually long
      if (line.length > maxLineLength) {
        const breakPoints = [', ', '; ', ': '];
        for (const breakPoint of breakPoints) {
          const parts = [];
          let remaining = line;
          let lastIndex = 0;
          
          // Find all occurrences of the break point
          while (remaining.includes(breakPoint)) {
            const index = remaining.indexOf(breakPoint) + breakPoint.length;
            const part = remaining.substring(0, index);
            
            // If adding this part would make the current line too long,
            // add a line break before it (but only if we've already captured something)
            if (lastIndex > 0 && lastIndex + part.length > maxLineLength) {
              parts.push('\n' + part);
              lastIndex = part.length;
            } else {
              parts.push(part);
              lastIndex += part.length;
            }
            
            remaining = remaining.substring(index);
          }
          
          // Add the remaining part
          if (remaining.length > 0) {
            parts.push(remaining);
          }
          
          // Replace the line if we successfully broke it
          if (parts.length > 1) {
            line = parts.join('');
            break;
          }
        }
      }
      
      return line;
    });
    
    return formattedLines.join('\n').trim();
  }, [isUser, msg.content]);
  
  // Determine what content to display
  const displayContent = useMemo(() => {
    // For user messages or non-last messages, show the full content
    if (isUser || !isLastMessage) {
      return cleanContent;
    }
    
    // For the last merchant message that's currently being typed
    if (isTyping) {
      // We need to clean the displayed response as it's being typed
      let typingContent = displayedResponse;
      
      // Remove UI action JSON blocks
      typingContent = typingContent.replace(/\{(?:"ui_action"|'ui_action')[^}]*\}/g, '');
      
      // Remove deal blocks - more comprehensive patterns for typing content
      if (typingContent.includes('```') && typingContent.split('```').length > 1) {
        typingContent = typingContent.replace(/```(?:deal)?\s*\{[\s\S]*?\}\s*```/g, '');
      }
      
      // Remove deal blocks without backticks
      typingContent = typingContent.replace(/deal\s*\n\s*\{[\s\S]*?\}/g, '');
      
      // Try to remove any other deal-like JSON blocks
      if (typingContent.includes('"items"') || typingContent.includes('"status"')) {
        typingContent = typingContent.replace(/\{[\s\S]*?"items"[\s\S]*?\}/g, '');
      }
      
      // Remove hidden deal status markers
      typingContent = typingContent.replace(/<!-- DEAL_STATUS: (accepted|rejected|pending) -->/g, '');
      
      // Highlight deal status indicators
      typingContent = typingContent.replace(/\[DEAL ACCEPTED\]/g, '✅ **Deal Accepted!**');
      typingContent = typingContent.replace(/\[NO DEAL\]/g, '❌ **No Deal**');
      
      // Remove any remaining JSON-like content that aren't item listings (failsafe)
      typingContent = typingContent.replace(/(\{[^{}]*\})/g, (match) => {
        // Don't remove if it looks like an item listing
        if (/- [^(]+\(\d+\)/.test(match)) {
          return match;
        }
        return '';
      });
      
      // Clean up double line breaks
      typingContent = typingContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // We don't apply the full formatting during typing to avoid jumpiness
      // Only apply simpler cleanup for a smoother experience
      
      return typingContent.trim();
    }
    
    // Otherwise show full cleaned content
    return cleanContent;
  }, [isUser, isLastMessage, isTyping, displayedResponse, cleanContent]);

  // Check if message contains a deal result
  const hasDealResult = useMemo(() => {
    return !isUser && (
      displayContent.includes('Deal Accepted') || 
      displayContent.includes('No Deal')
    );
  }, [isUser, displayContent]);

  // Detect deal blocks and determine status
  const dealInfo = useMemo(() => {
    if (isUser) return null;
    
    // Extract deal status from message content
    let status: 'pending' | 'accepted' | 'rejected' | null = null;
    
    // First look for the explicit markers we've added
    const statusMarkerMatch = msg.content.match(/<!-- DEAL_STATUS: (accepted|rejected|pending) -->/);
    if (statusMarkerMatch) {
      status = statusMarkerMatch[1] as 'pending' | 'accepted' | 'rejected';
    }
    // Fallback to other indicators if no explicit marker
    else if (msg.content.includes('[DEAL ACCEPTED]') || msg.content.includes('✅ **Deal Accepted!**')) {
      status = 'accepted';
    } else if (msg.content.includes('[NO DEAL]') || msg.content.includes('❌ **No Deal**')) {
      status = 'rejected';
    } else if (
      msg.content.includes('```deal') || 
      msg.content.includes('"status": "pending"') ||
      (msg.content.includes('"items"') && !status)
    ) {
      status = 'pending';
    }
    
    // If we have deal info, extract item details if possible
    if (status) {
      // Try to extract item name and price from deal blocks for a more detailed notification
      const itemMatch = msg.content.match(/"name":\s*"([^"]+)"[\s\S]*?"price":\s*(\d+)/);
      let itemInfo = null;
      
      if (itemMatch) {
        itemInfo = {
          name: itemMatch[1],
          price: parseInt(itemMatch[2], 10)
        };
      }
      
      return { status, item: itemInfo };
    }
    
    return null;
  }, [isUser, msg.content]);

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
        
        // Add list item styling
        li: ({ children, ...props }: any) => (
          <li className="ml-4 list-disc" {...props}>
            {children}
          </li>
        ),
        
        // Add list container styling
        ul: ({ children, ...props }: any) => (
          <ul className="my-2 space-y-1" {...props}>
            {children}
          </ul>
        ),
        
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
            : hasDealResult 
              ? 'bg-gray-100 border-l-4 border-primary rounded-xl'
              : 'bg-gray-100 rounded-xl'
        } max-w-[80%] rounded-tl-xl rounded-tr-xl px-4 py-2 font-secondary relative mb-4`}
      >
        <div className="break-normal">
          {MarkdownContent}
          
          {/* Show deal notification when a deal is detected */}
          {dealInfo && <DealNotification dealStatus={dealInfo.status} item={dealInfo.item} />}
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

export default MessageComponent; 