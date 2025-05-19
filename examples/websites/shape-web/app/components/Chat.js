'use client';

import { useState, useEffect, useRef } from 'react';
import Message from './Message';
import Settings from './Settings';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FaPaperPlane, FaImage, FaMicrophone, FaTimes, FaFileAudio, FaBars, FaSave, FaTrash, FaExclamation, FaSearch } from 'react-icons/fa';
import { del } from '@vercel/blob';

const DEFAULT_SHAPES = (process.env.NEXT_PUBLIC_SHAPES_USERNAMES?.split(',') || []).slice(0, 10);
const COMMANDS = [
  { name: '!reset', description: 'Reset Shape’s long-term memory' },
  { name: '!sleep', description: 'Generate long-term memory on demand' },
  { name: '!dashboard', description: 'Access configuration dashboard' },
  { name: '!info', description: 'Get Shape information' },
  { name: '!web', description: 'Search the web' },
  { name: '!help', description: 'Get help with commands' },
  { name: '!imagine', description: 'Generate an image' },
  { name: '!wack', description: 'Reset short-term memory' },
];

export default function Chat() {
  const [shapes, setShapes] = useState(DEFAULT_SHAPES);
  const [selectedShape, setSelectedShape] = useState(shapes[0] || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePathname, setImagePathname] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPathname, setAudioPathname] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showAudioInput, setShowAudioInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedConversations, setSavedConversations] = useState({});
  const [activeTab, setActiveTab] = useState('conversations');
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [autoSave, setAutoSave] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMessages, setSearchMessages] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const chatRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Debounce function for search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  useEffect(() => {
    const storedConversations = localStorage.getItem('shapesChatConversations');
    if (storedConversations) setSavedConversations(JSON.parse(storedConversations));
    const storedShapes = localStorage.getItem('userShapes');
    if (storedShapes) {
      const userShapes = JSON.parse(storedShapes);
      setShapes([...new Set([...DEFAULT_SHAPES, ...userShapes])]);
    }
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.body.className = storedTheme;
    const storedAutoSave = localStorage.getItem('autoSave');
    if (storedAutoSave) setAutoSave(JSON.parse(storedAutoSave));
    const storedCommandHistory = localStorage.getItem('commandHistory');
    if (storedCommandHistory) setCommandHistory(JSON.parse(storedCommandHistory));
  }, []);

  useEffect(() => {
    if (shapes.length === 0) {
      setError('No shapes found. Check NEXT_PUBLIC_SHAPES_USERNAMES in .env.local or add Shapes in Settings.');
    }
  }, [shapes]);

  // Handle scrolling
  useEffect(() => {
    if (chatRef.current && isAtBottom) {
      setTimeout(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 0);
    }
  }, [messages, isAtBottom]);

  // Detect user scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (chatRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
      }
    };
    const chatElement = chatRef.current;
    if (chatElement) {
      chatElement.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatElement) {
        chatElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const validateImageUrl = (url) => {
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|gif)$/i);
    } catch {
      return false;
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return { url: data.url, pathname: data.pathname };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}. Check Vercel Blob configuration.`);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (pathname) => {
    if (!pathname) return;
    try {
      await del(pathname);
    } catch (error) {
      setError(`Failed to delete file: ${error.message}`);
    }
  };

  const generateConversationName = async () => {
    if (!selectedShape || messages.length === 0) return `Conversation-${new Date().toISOString()}`;
    try {
      const prompt = [
        ...messages.slice(-5),
        { role: 'user', content: [{ type: 'text', text: 'Summarize this conversation in a short name (max 30 characters).' }] },
      ];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: prompt, model: selectedShape, userId: `user-${Date.now()}`, channelId: `web-${selectedShape}` }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.choices || data.choices.length === 0) throw new Error('No name generated');
      return data.choices[0].message.content.trim().slice(0, 30) || `Conversation-${new Date().toISOString()}`;
    } catch (error) {
      return `Conversation-${new Date().toISOString()}`;
    }
  };

  const saveConversation = async () => {
    if (messages.length === 0) {
      setError('No messages to save.');
      return;
    }
    try {
      const name = await generateConversationName();
      const conversation = { name, shape: selectedShape, messages, timestamp: new Date().toISOString() };
      const updatedConversations = { ...savedConversations, [name]: conversation };
      localStorage.setItem('shapesChatConversations', JSON.stringify(updatedConversations));
      setSavedConversations(updatedConversations);
      setError('');
      if (!autoSave) alert(`Conversation saved as "${name}"`);
    } catch (error) {
      setError(`Failed to save conversation: ${error.message}`);
    }
  };

  const deleteConversation = (name) => {
    const updatedConversations = { ...savedConversations };
    delete updatedConversations[name];
    localStorage.setItem('shapesChatConversations', JSON.stringify(updatedConversations));
    setSavedConversations(updatedConversations);
  };

  const loadConversation = (name) => {
    const conversation = savedConversations[name];
    if (conversation) {
      setSelectedShape(conversation.shape);
      setMessages(conversation.messages);
      setIsMenuOpen(false);
      setError('');
      setIsAtBottom(true);
    }
  };

  const exportConversation = (format) => {
    if (messages.length === 0) {
      setError('No messages to export.');
      return;
    }
    let content;
    let extension;
    if (format === 'json') {
      content = JSON.stringify({ shape: selectedShape, messages, timestamp: new Date().toISOString() }, null, 2);
      extension = 'json';
    } else {
      content = messages
        .map(msg => {
          const role = msg.role === 'user' ? 'User' : 'Shape';
          const text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
          const reactions = msg.reactions ? Object.entries(msg.reactions).map(([emoji, count]) => `${emoji} (${count})`).join(', ') : '';
          const pinned = msg.pinned ? '[Pinned]' : '';
          const timestamp = new Date(msg.timestamp || Date.now()).toLocaleString();
          return `**${role}** ${pinned}${reactions ? ` [${reactions}]` : ''} (${timestamp}):\n${text}\n`;
        })
        .join('\n');
      extension = 'md';
    }
    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${selectedShape}-${new Date().toISOString()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
    setIsAtBottom(true);
  };

  const addReaction = (index, emoji) => {
    setMessages(prev => {
      const updated = [...prev];
      const message = updated[index];
      if (!message.reactions) message.reactions = {};
      message.reactions[emoji] = (message.reactions[emoji] || 0) + 1;
      return updated;
    });
  };

  const editMessage = (index, newContent) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[index].role === 'user') {
        updated[index].content = [{ type: 'text', text: newContent }];
      }
      return updated;
    });
  };

  const deleteMessage = (index) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[index].role === 'user') updated.splice(index, 1);
      return updated;
    });
  };

  const togglePin = (index) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[index].pinned = !updated[index].pinned;
      return updated;
    });
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'image') {
      if (!file.type.match(/image\/(jpg|jpeg|png|gif)/i)) {
        setError('Please upload a jpg, jpeg, png, or gif image.');
        return;
      }
      setImageFile(file);
      setShowImageInput(true);
      try {
        const { url, pathname } = await uploadFile(file);
        setImageUrl(url);
        setImagePathname(pathname);
        setError('');
      } catch (error) {
        setError(error.message);
        setImageFile(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    } else if (type === 'audio') {
      if (!file.type.match(/audio\/(mp3|wav|ogg)/i)) {
        setError('Please upload an mp3, wav, or ogg audio file.');
        return;
      }
      setAudioFile(file);
      setShowAudioInput(true);
      try {
        const { url, pathname } = await uploadFile(file);
        setAudioUrl(url);
        setAudioPathname(pathname);
        setError('');
      } catch (error) {
        setError(error.message);
        setAudioFile(null);
        if (audioInputRef.current) audioInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (value.startsWith('!') || value.startsWith('/')) {
      const filtered = COMMANDS.filter(cmd => cmd.name.toLowerCase().startsWith(value.replace('/', '!').toLowerCase()));
      setFilteredCommands(filtered);
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const selectCommand = (command) => {
    const normalizedCommand = command.replace('/', '!');
    setInput(normalizedCommand);
    setShowCommands(false);
    handleSend();
    setCommandHistory(prev => {
      const updated = [normalizedCommand, ...prev.filter(c => c !== normalizedCommand)].slice(0, 10);
      localStorage.setItem('commandHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleCommands = () => {
    setShowCommands(!showCommands);
    setFilteredCommands(COMMANDS);
  };

  const handleSend = async () => {
    if (!input && !imageUrl && !audioUrl) {
      setError('Please enter a message, upload an image/audio, or record audio.');
      return;
    }
    if (imageUrl && !imageFile && !validateImageUrl(imageUrl)) {
      setError('Invalid image URL. Use a valid URL ending in .jpg, .png, or .gif.');
      return;
    }
    if (!selectedShape) {
      setError('Please select a shape from the dropdown.');
      return;
    }
    if (isUploading) {
      setError('Please wait for the upload to complete.');
      return;
    }

    setError('');
    setShowImageInput(false);
    setShowAudioInput(false);
    setShowCommands(false);
    const userContent = [];
    if (input) {
      const normalizedInput = input.replace('/', '!');
      userContent.push({ type: 'text', text: normalizedInput });
    }
    if (imageUrl) userContent.push({ type: 'image_url', image_url: { url: imageUrl } });
    if (audioUrl) userContent.push({ type: 'audio_url', audio_url: { url: audioUrl } });

    const userMessage = { role: 'user', content: userContent, timestamp: new Date().toISOString() };
    setMessages([...messages, userMessage]);
    const currentImagePathname = imagePathname;
    const currentAudioPathname = audioPathname;
    setInput('');
    setImageUrl('');
    setImageFile(null);
    setImagePathname(null);
    setAudioUrl('');
    setAudioFile(null);
    setAudioPathname(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    setIsAtBottom(true);

    try {
      const userId = `user-${Date.now()}`;
      const channelId = `web-${selectedShape}`;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMessage], model: selectedShape, userId, channelId }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from the API. Please check the image/audio URL or try again.');
      }
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: [{ type: 'text', text: data.choices[0].message.content }], timestamp: new Date().toISOString() },
      ]);

      if (currentImagePathname) await deleteFile(currentImagePathname);
      if (currentAudioPathname) await deleteFile(currentAudioPathname);
      if (autoSave) await saveConversation();
    } catch (error) {
      setError(`Failed to process message: ${error.message}. Ensure the image/audio URL is valid.`);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: [{ type: 'text', text: `Error: ${error.message}` }], timestamp: new Date().toISOString() },
      ]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/mp3' });
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        const file = new File([blob], 'recording.mp3', { type: 'audio/mp3' });
        setAudioFile(file);
        setShowAudioInput(true);
        try {
          const { url, pathname } = await uploadFile(file);
          setAudioUrl(url);
          setAudioPathname(pathname);
          setError('');
        } catch (error) {
          setError(error.message);
          setAudioFile(null);
          setShowAudioInput(false);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (error) {
      setError('Failed to start recording. Check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearMedia = type => {
    if (type === 'image') {
      setImageUrl('');
      setImageFile(null);
      setImagePathname(null);
      setShowImageInput(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } else if (type === 'audio') {
      setAudioUrl('');
      setAudioFile(null);
      setAudioPathname(null);
      setShowAudioInput(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
    setError('');
  };

  // Improved search logic
  const filteredConversations = Object.keys(savedConversations).filter(name => {
    if (!searchQuery) return true;
    const conversation = savedConversations[name];
    const queryRegex = new RegExp(searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    if (searchMessages) {
      return conversation.messages.some(msg =>
        msg.content.some(c => {
          if (c.type === 'text') return queryRegex.test(c.text);
          if (c.type === 'image_url') return queryRegex.test(c.image_url.url);
          if (c.type === 'audio_url') return queryRegex.test(c.audio_url.url);
          return false;
        })
      );
    }
    return queryRegex.test(name);
  });

  const handleSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  const pinnedMessages = messages.filter(msg => msg.pinned);

  return (
    <div className="chat-container">
      <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <FaBars />
      </button>
      <div className={`menu-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-tabs">
          <button className={activeTab === 'conversations' ? 'active' : ''} onClick={() => setActiveTab('conversations')}>
            Conversations
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            Settings
          </button>
        </div>
        {activeTab === 'conversations' ? (
          <>
            <h2>Saved Conversations</h2>
            <div className="search-bar">
              <input
                type="text"
                onChange={e => handleSearchChange(e.target.value)}
                placeholder={searchMessages ? 'Search messages...' : 'Search conversations...'}
              />
              <button
                onClick={() => setSearchMessages(!searchMessages)}
                title={searchMessages ? 'Search Conversations' : 'Search Messages'}
              >
                <FaSearch />
              </button>
            </div>
            <button onClick={saveConversation} className="save-conversation">
              <FaSave /> Save Conversation
            </button>
            <button onClick={() => exportConversation('json')} className="export-conversation">
              Export JSON
            </button>
            <button onClick={() => exportConversation('markdown')} className="export-conversation">
              Export Markdown
            </button>
            <button onClick={clearChat} className="clear-chat">
              Clear Chat
            </button>
            {pinnedMessages.length > 0 && (
              <>
                <h3>Pinned Messages</h3>
                <ul>
                  {pinnedMessages.map((msg, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        const msgElement = chatRef.current.children[index];
                        if (msgElement) {
                          msgElement.scrollIntoView({ behavior: 'smooth' });
                          setIsAtBottom(false);
                        }
                      }}
                    >
                      {msg.content.filter(c => c.type === 'text').map(c => c.text).join(' ').slice(0, 30)}...
                    </li>
                  ))}
                </ul>
              </>
            )}
            {filteredConversations.length > 0 ? (
              <ul>
                {filteredConversations.map(name => (
                  <li key={name}>
                    <span onClick={() => loadConversation(name)}>
                      {name} ({new Date(savedConversations[name].timestamp).toLocaleString()})
                    </span>
                    <button onClick={() => deleteConversation(name)} className="delete-conversation" title="Delete Conversation">
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="error-message">No results found.</div>
            )}
          </>
        ) : (
          <Settings shapes={shapes} setShapes={setShapes} theme={theme} setTheme={setTheme} autoSave={autoSave} setAutoSave={setAutoSave} />
        )}
      </div>
      <div className="chat-content">
        <div className="chat-header">
          <h1>Shapes Chat</h1>
          <select value={selectedShape} onChange={e => setSelectedShape(e.target.value)} disabled={shapes.length === 0}>
            {shapes.length === 0 ? (
              <option value="">No shapes available</option>
            ) : (
              <>
                <option value="" disabled>
                  Select a shape
                </option>
                {shapes.map(shape => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div className="chat-messages" ref={chatRef}>
          {messages.map((msg, index) => (
            <Message
              key={index}
              message={msg}
              index={index}
              addReaction={addReaction}
              editMessage={editMessage}
              deleteMessage={deleteMessage}
              togglePin={togglePin}
            />
          ))}
          {error && <div className="error-message">{error}</div>}
          {isUploading && <div className="upload-message">Uploading file...</div>}
        </div>
        <div className="chat-input">
          {(showImageInput || imageFile) && (
            <div className="image-input-wrapper">
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Paste image URL or select file below"
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                disabled={imageFile || isUploading}
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={e => handleFileChange(e, 'image')}
                ref={imageInputRef}
                disabled={isUploading}
              />
              <button onClick={() => clearMedia('image')} className="clear-media">
                <FaTimes />
              </button>
            </div>
          )}
          {(showAudioInput || audioFile || audioUrl) && (
            <div className="audio-input-wrapper">
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/ogg"
                onChange={e => handleFileChange(e, 'audio')}
                ref={audioInputRef}
                disabled={isUploading}
              />
              {audioUrl && <audio src={audioUrl} controls />}
              <button onClick={() => clearMedia('audio')} className="clear-media">
                <FaTimes />
              </button>
            </div>
          )}
          <div className="input-bar">
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message or command (e.g., !imagine or /imagine)..."
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                disabled={isUploading}
              />
              {showCommands && (
                <ul className="command-suggestions">
                  {commandHistory.length > 0 && (
                    <>
                      <li className="command-header">Recent Commands</li>
                      {commandHistory.map(cmd => (
                        <li
                          key={`history-${cmd}`}
                          onClick={() => selectCommand(cmd)}
                          role="option"
                          tabIndex={0}
                          onKeyPress={e => e.key === 'Enter' && selectCommand(cmd)}
                        >
                          <span className="command-name">{cmd}</span>
                        </li>
                      ))}
                    </>
                  )}
                  <li className="command-header">All Commands</li>
                  {filteredCommands.map(cmd => (
                    <li
                      key={cmd.name}
                      onClick={() => selectCommand(cmd.name)}
                      role="option"
                      tabIndex={0}
                      onKeyPress={e => e.key === 'Enter' && selectCommand(cmd.name)}
                    >
                      <span className="command-name">{cmd.name}</span>
                      <span className="command-desc">{cmd.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="input-icons">
              <button onClick={() => setShowImageInput(!showImageInput)} title="Send Image" disabled={imageFile || isUploading}>
                <FaImage />
              </button>
              <button
                onClick={() => setShowAudioInput(!showAudioInput)}
                title="Upload Audio"
                disabled={audioFile || isRecording || isUploading}
              >
                <FaFileAudio />
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? 'recording' : ''}
                title={isRecording ? 'Stop Recording' : 'Record Audio'}
                disabled={audioFile || isUploading}
              >
                <FaMicrophone />
              </button>
              <button onClick={toggleCommands} title="Show Commands" disabled={isUploading} className={showCommands ? 'active' : ''}>
                <FaExclamation />
              </button>
              <button onClick={handleSend} title="Send Message" disabled={isUploading}>
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
