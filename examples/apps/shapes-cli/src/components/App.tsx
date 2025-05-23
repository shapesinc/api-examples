import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import OpenAI from 'openai';
import { getToken, getAuthUrl, clearToken, authenticate, saveToken } from '../utils/auth.js';
import { loadTools } from '../utils/tools.js';
import { loadPlugins } from '../utils/plugins.js';
import { uploadImage, listImageFiles } from '../utils/image.js';
import { ChatInput } from './ChatInput.js';
import { MessageList } from './MessageList.js';
import { renderError } from '../utils/rendering.js';
import { config, initConfig } from '../config.js';
import open from 'open';

interface Message {
  type: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
}

interface ChatTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface QueuedImage {
  dataUrl: string;
  filename: string;
  size: number;
}

export const App = () => {
  const { stdout } = useStdout();
  const [messages, setMessages] = useState<Message[]>([]);
  const [client, setClient] = useState<OpenAI | null>(null);
  const [tools, setTools] = useState<unknown[]>([]);
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [shapeName, setShapeName] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<string>('');
  const [endpoint, setEndpoint] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'normal' | 'awaiting_auth'>('normal');
  
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize config with auto-discovered endpoints
        const discoveredConfig = await initConfig();
        
        // Check for API key or user authentication
        const token = await getToken();
        if (!discoveredConfig.apiKey && !token) {
          setError('No API key configured and not authenticated. Please set SHAPESINC_API_KEY or use /login to authenticate.');
          return;
        }

        // Create client with API key or user authentication
        const clientConfig: any = {
          apiKey: discoveredConfig.apiKey,
          baseURL: discoveredConfig.apiUrl,
          defaultHeaders: {
            'X-App-ID': discoveredConfig.appId,
          },
        };

        // Add user auth header if available
        if (token) {
          clientConfig.defaultHeaders['X-User-Auth'] = token;
        }

        const shapesClient = new OpenAI(clientConfig);
        setClient(shapesClient);

        // Set shape name, auth status, and endpoint
        setShapeName(discoveredConfig.model);
        if (token) {
          setAuthStatus(`Authenticated (${token.slice(-4)})`);
        } else {
          setAuthStatus('API Key');
        }
        setEndpoint(discoveredConfig.apiUrl);

        // Load tools and plugins
        const [availableTools] = await Promise.all([
          loadTools(),
          loadPlugins(),
        ]);
        setTools(availableTools);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    initialize();
  }, []);

  const handleSendMessage = async (content: string, messageImages?: string[]) => {
    // Handle awaiting auth token
    if (inputMode === 'awaiting_auth') {
      await handleAuthCode(content);
      return;
    }

    // Handle slash commands
    if (content.startsWith('/')) {
      await handleSlashCommand(content.slice(1));
      return;
    }

    if (!client) {
      const systemMessage: Message = { 
        type: 'system', 
        content: 'No API key configured and not authenticated. Please set SHAPESINC_API_KEY or use /login to authenticate.' 
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    // Use current images state if no specific images provided
    const currentImageUrls = images.map(img => img.dataUrl);
    const currentImages = messageImages || currentImageUrls;
    const userMessage: Message = { type: 'user', content, images: currentImages };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear images after sending
    setImages([]);

    try {
      // Prepare message content - text only or multimodal with images
      let messageContent: any;
      if (currentImages.length > 0) {
        messageContent = [
          { type: "text", text: content },
          ...currentImages.map(img => ({
            type: "image_url", 
            image_url: { url: img }
          }))
        ];
      } else {
        messageContent = content;
      }

      // Prepare the request with tools and plugins
      const request = {
        model: config.model,
        messages: [
          ...messages.map(msg => {
            if (msg.type === 'user' && msg.images && msg.images.length > 0) {
              return {
                role: 'user' as const,
                content: [
                  { type: "text", text: msg.content },
                  ...msg.images.map(img => ({
                    type: "image_url",
                    image_url: { url: img }
                  }))
                ]
              };
            } else {
              return {
                role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content,
              };
            }
          }),
          { role: 'user' as const, content: messageContent },
        ],
        tools: tools.map(tool => ({
          type: 'function' as const,
          function: {
            name: (tool as ChatTool).name,
            description: (tool as ChatTool).description,
            parameters: (tool as ChatTool).parameters,
          },
        })),
      };

      const response = await client.chat.completions.create(request);
      const assistantMessage: Message = {
        type: 'assistant',
        content: response.choices[0]?.message?.content || '',
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSlashCommand = async (command: string) => {
    const [cmd] = command.split(' ');
    
    switch (cmd.toLowerCase()) {
      case 'login':
        await handleLogin();
        break;
      case 'logout':
        await handleLogout();
        break;
      case 'exit':
      case 'quit':
        process.exit(0);
        break;
      case 'image': {
        const [, filename] = command.split(' ', 2);
        try {
          const result = await uploadImage(filename);
          setImages(prev => [...prev, { dataUrl: result.dataUrl, filename: result.filename, size: result.size }]);
          
          const sizeKB = Math.round(result.size / 1024);
          const totalImages = images.length + 1;
          const imageMessage: Message = {
            type: 'system',
            content: `Image uploaded: "${result.filename}" (${sizeKB}KB) - ${totalImages} image${totalImages > 1 ? 's' : ''} queued for next message.`
          };
          setMessages(prev => [...prev, imageMessage]);
        } catch (error) {
          const errorMessage: Message = {
            type: 'system',
            content: `Failed to upload image: ${(error as Error).message}`
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;
      }
      case 'images': {
        try {
          const imageFiles = await listImageFiles();
          let content = '';
          
          // Show queued images first
          if (images.length > 0) {
            const queuedList = images.map((img, i) => `  ${i + 1}. ${img.filename} (${Math.round(img.size / 1024)}KB)`).join('\n');
            content += `Queued for next message (${images.length}):\n${queuedList}\n\n`;
          }
          
          // Show available files in directory
          if (imageFiles.length > 0) {
            const availableList = imageFiles.map(file => `  • ${file}`).join('\n');
            content += `Available in current directory:\n${availableList}`;
          } else {
            content += 'No image files found in current directory.';
          }
          
          if (images.length === 0 && imageFiles.length === 0) {
            content = 'No images queued and no image files found in current directory.';
          }
          
          content += '\n\nUse "/image <filename>" to upload a file, or "/image" to upload the first available file.';
          
          const listMessage: Message = {
            type: 'system',
            content
          };
          setMessages(prev => [...prev, listMessage]);
        } catch (error) {
          const errorMessage: Message = {
            type: 'system',
            content: `Failed to list images: ${(error as Error).message}`
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;
      }
      case 'clear': {
        const clearedCount = images.length;
        setImages([]);
        const clearMessage: Message = {
          type: 'system',
          content: clearedCount > 0 ? `Cleared ${clearedCount} queued image${clearedCount > 1 ? 's' : ''}.` : 'No images to clear.'
        };
        setMessages(prev => [...prev, clearMessage]);
        break;
      }
      case 'help': {
        const helpMessage: Message = {
          type: 'system',
          content: 'Available commands:\n/login - Authenticate with Shapes API\n/logout - Clear authentication token\n/images - List available image files\n/image [filename] - Upload an image (specify filename or auto-select first)\n/clear - Clear uploaded images\n/exit - Exit the application\n/help - Show this help message'
        };
        setMessages(prev => [...prev, helpMessage]);
        break;
      }
      default: {
        const unknownMessage: Message = {
          type: 'system',
          content: `Unknown command: /${cmd}. Type /help for available commands.`
        };
        setMessages(prev => [...prev, unknownMessage]);
        break;
      }
    }
  };

  const handleLogin = async () => {
    try {
      const authUrl = await getAuthUrl();
      
      const loginMessage: Message = {
        type: 'system',
        content: `Opening browser for authentication...\nAuth URL: ${authUrl}\n\nAfter authorizing, please enter the code you receive:`
      };
      setMessages(prev => [...prev, loginMessage]);
      
      await open(authUrl);
      
      // Switch to auth code input mode
      setInputMode('awaiting_auth');
      
    } catch (err) {
      const errorMessage: Message = {
        type: 'system',
        content: `Authentication failed: ${(err as Error).message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleAuthCode = async (code: string) => {
    try {
      const token = await authenticate(code);
      await saveToken(token);
      
      // Update auth status
      setAuthStatus(`Authenticated (${token.slice(-4)})`);
      
      // Re-initialize client with new token
      const discoveredConfig = await initConfig();
      const clientConfig: any = {
        apiKey: discoveredConfig.apiKey,
        baseURL: discoveredConfig.apiUrl,
        defaultHeaders: {
          'X-App-ID': discoveredConfig.appId,
          'X-User-Auth': token,
        },
      };
      
      const shapesClient = new OpenAI(clientConfig);
      setClient(shapesClient);
      
      const successMessage: Message = {
        type: 'system',
        content: 'Successfully authenticated!'
      };
      setMessages(prev => [...prev, successMessage]);
      
      // Return to normal input mode
      setInputMode('normal');
      
    } catch (err) {
      const errorMessage: Message = {
        type: 'system',
        content: `Authentication failed: ${(err as Error).message}`
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Return to normal input mode on error
      setInputMode('normal');
    }
  };

  const handleLogout = async () => {
    try {
      const currentToken = await getToken();
      if (!currentToken) {
        const notAuthMessage: Message = {
          type: 'system',
          content: 'Not currently authenticated.'
        };
        setMessages(prev => [...prev, notAuthMessage]);
        return;
      }

      await clearToken();
      setClient(null);
      
      const logoutMessage: Message = {
        type: 'system',
        content: 'Successfully logged out! You can use /login to authenticate again.'
      };
      setMessages(prev => [...prev, logoutMessage]);
      
    } catch (err) {
      const errorMessage: Message = {
        type: 'system',
        content: `Logout failed: ${(err as Error).message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (error) {
    return (
      <Box height={terminalHeight} flexDirection="column" justifyContent="center" alignItems="center">
        <Text>{renderError(error)}</Text>
      </Box>
    );
  }

  // Reserve 3 lines for input (1 for input box + 1 for status + 1 for spacing)
  const messageAreaHeight = Math.max(1, terminalHeight - 3);

  return (
    <Box height={terminalHeight} width={terminalWidth} flexDirection="column">
      {/* Message area - takes up most of the screen */}
      <Box height={messageAreaHeight} flexDirection="column" overflow="hidden">
        <MessageList messages={messages} shapeName={shapeName} />
      </Box>
      
      {/* Fixed input area at bottom */}
      <Box flexShrink={0}>
        <ChatInput 
          onSend={handleSendMessage} 
          images={images}
          shapeName={shapeName}
          authStatus={authStatus}
          endpoint={endpoint}
          terminalWidth={terminalWidth}
          inputMode={inputMode}
          onEscape={() => {
            if (inputMode === 'awaiting_auth') {
              setInputMode('normal');
              const cancelMessage: Message = {
                type: 'system',
                content: 'Authentication cancelled.'
              };
              setMessages(prev => [...prev, cancelMessage]);
            }
          }}
        />
      </Box>
    </Box>
  );
};