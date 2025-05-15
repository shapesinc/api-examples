'use client';

import { useState, useEffect, useRef } from 'react';
import Message from './Message';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FaPaperPlane, FaImage, FaMicrophone, FaTimes, FaFileAudio, FaBars, FaSave, FaTrash } from 'react-icons/fa';
import { del } from '@vercel/blob';

const SHAPES = (process.env.NEXT_PUBLIC_SHAPES_USERNAMES?.split(',') || []).slice(0, 10);

export default function Chat() {
  const [selectedShape, setSelectedShape] = useState(SHAPES[0] || '');
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
  const chatRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('shapesChatConversations');
    if (stored) {
      setSavedConversations(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    console.log('Shapes loaded:', SHAPES, 'Selected:', selectedShape);
    if (SHAPES.length === 0) {
      setError('No shapes found. Check NEXT_PUBLIC_SHAPES_USERNAMES in .env.local.');
    }
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

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
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return { url: data.url, pathname: data.pathname };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}. Check Vercel Blob configuration or try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (pathname) => {
    if (!pathname) return;
    try {
      await del(pathname);
      console.log(`Deleted file from Blob: ${pathname}`);
    } catch (error) {
      console.error('Delete Error:', error);
      setError(`Failed to delete file: ${error.message}`);
    }
  };

  const generateConversationName = async () => {
    if (!selectedShape || messages.length === 0) {
      return `Conversation-${new Date().toISOString()}`;
    }
    try {
      const prompt = [
        ...messages.slice(-5),
        { role: 'user', content: [{ type: 'text', text: 'Summarize this conversation in a short name (max 30 characters).' }] },
      ];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: prompt, model: selectedShape }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.choices || data.choices.length === 0) throw new Error('No name generated');
      const name = data.choices[0].message.content.trim().slice(0, 30);
      return name || `Conversation-${new Date().toISOString()}`;
    } catch (error) {
      console.error('Name Generation Error:', error);
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
      const conversation = {
        name,
        shape: selectedShape,
        messages,
        timestamp: new Date().toISOString(),
      };
      const updatedConversations = { ...savedConversations, [name]: conversation };
      localStorage.setItem('shapesChatConversations', JSON.stringify(updatedConversations));
      setSavedConversations(updatedConversations);
      setError('');
      alert(`Conversation saved as "${name}"`);
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
    }
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
    const userContent = [];
    if (input) userContent.push({ type: 'text', text: input });
    if (imageUrl) userContent.push({ type: 'image_url', image_url: { url: imageUrl } });
    if (audioUrl) userContent.push({ type: 'audio_url', audio_url: { url: audioUrl } });

    const userMessage = { role: 'user', content: userContent };
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMessage], model: selectedShape }),
      });
      const data = await response.json();
      console.log('API Response:', data);
      if (data.error) throw new Error(data.error);
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from the API. Please check the image/audio URL or try again.');
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: [{ type: 'text', text: data.choices[0].message.content }] },
      ]);

      if (currentImagePathname) await deleteFile(currentImagePathname);
      if (currentAudioPathname) await deleteFile(currentAudioPathname);
    } catch (error) {
      console.error('Chat Error:', error);
      setError(`Failed to process message: ${error.message}. Ensure the image/audio URL is valid and try again.`);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: [{ type: 'text', text: `Error: ${error.message}` }] },
      ]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/mp3' });
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
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
      console.error('Recording Error:', error);
      setError('Failed to start recording. Check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearMedia = (type) => {
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

  return (
    <div className="chat-container">
      <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <FaBars />
      </button>
      <div className={`menu-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <h2>Saved Conversations</h2>
        <button onClick={saveConversation} className="save-conversation">
          <FaSave /> Save Conversation
        </button>
        <ul>
          {Object.keys(savedConversations).map((name) => (
            <li key={name}>
              <span onClick={() => loadConversation(name)}>
                {name} ({new Date(savedConversations[name].timestamp).toLocaleString()})
              </span>
              <button
                onClick={() => deleteConversation(name)}
                className="delete-conversation"
                title="Delete Conversation"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-content">
        <div className="chat-header">
          <h1>Shapes Chat</h1>
          <select
            value={selectedShape}
            onChange={(e) => setSelectedShape(e.target.value)}
            disabled={SHAPES.length === 0}
          >
            {SHAPES.length === 0 ? (
              <option value="">No shapes available</option>
            ) : (
              <>
                <option value="" disabled>Select a shape</option>
                {SHAPES.map((shape) => (
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
            <Message key={index} message={msg} />
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
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL or select file below"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={imageFile || isUploading}
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={(e) => handleFileChange(e, 'image')}
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
                onChange={(e) => handleFileChange(e, 'audio')}
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (we support discord markdows!)"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isUploading}
            />
            <div className="input-icons">
              <button
                onClick={() => setShowImageInput(!showImageInput)}
                title="Send Image"
                disabled={imageFile || isUploading}
              >
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
