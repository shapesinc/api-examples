'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Highlight } from 'prism-react-renderer';
import { FaCopy, FaEdit, FaThumbtack, FaTrash } from 'react-icons/fa';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const prismTheme = {
  plain: { backgroundColor: '#2f2f3f', color: '#e0e0e0' },
  styles: [
    { types: ['comment'], style: { color: '#6a737d' } },
    { types: ['keyword'], style: { color: '#ff79c6' } },
    { types: ['string'], style: { color: '#f1fa8c' } },
    { types: ['function'], style: { color: '#50fa7b' } },
    { types: ['variable'], style: { color: '#8be9fd' } },
    { types: ['number'], style: { color: '#bd93f9' } },
  ],
};

export default function Message({ message, index, addReaction, editMessage, deleteMessage, togglePin }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [reactionInput, setReactionInput] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContextMenu = e => {
    e.preventDefault();
    setShowMenu(true);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleAddReaction = () => {
    if (reactionInput.trim()) {
      addReaction(index, reactionInput.trim());
      setReactionInput('');
      setShowMenu(false);
    }
  };

  const handleCopyMessage = () => {
    const text = message.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    navigator.clipboard.writeText(text);
    setShowMenu(false);
  };

  const handleEdit = () => {
    const text = message.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    setEditContent(text);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    editMessage(index, editContent);
    setIsEditing(false);
  };

  const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    return isToday ? `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : date.toLocaleString();
  };

  const renderContent = content => {
    if (Array.isArray(content)) {
      return content.map((item, index) => {
        if (item.type === 'text') {
          const imageUrlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif))/gi;
          const parts = item.text.split(imageUrlRegex);
          const renderedParts = parts.map((part, partIndex) => {
            if (part.match(imageUrlRegex)) {
              return <img key={partIndex} src={part} alt={message.role === 'assistant' ? 'Shape Image' : 'User Image'} className="message-image" />;
            }
            return (
              <ReactMarkdown
                key={partIndex}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const content = String(children).trim();
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : 'text';
                    return !inline ? (
                      <div className="code-block">
                        <Highlight theme={prismTheme} code={content} language={language}>
                          {({ className, style, tokens, getLineProps, getTokenProps }) => (
                            <pre className={className} style={style}>
                              {tokens.map((line, i) => (
                                <div {...getLineProps({ line, key: i })}>
                                  {line.map((token, key) => (
                                    <span {...getTokenProps({ token, key })} />
                                  ))}
                                </div>
                              ))}
                            </pre>
                          )}
                        </Highlight>
                        <CopyToClipboard text={content} onCopy={handleCopy}>
                          <button className="copy-button" title={copied ? 'Copied!' : 'Copy Code'}>
                            <FaCopy /> {copied ? 'Copied' : 'Copy'}
                          </button>
                        </CopyToClipboard>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {part}
              </ReactMarkdown>
            );
          });
          return <div key={index}>{renderedParts}</div>;
        } else if (item.type === 'image_url') {
          return <img key={index} src={item.image_url.url} alt={message.role === 'assistant' ? 'Shape Image' : 'User Image'} className="message-image" />;
        } else if (item.type === 'audio_url') {
          return (
            <audio
              key={index}
              src={item.audio_url.url}
              controls
              className="message-audio"
              title={message.role === 'assistant' ? 'Shape Audio' : 'User Audio'}
            />
          );
        }
        return null;
      });
    }
    if (typeof content === 'string' && content.match(/(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif))/i)) {
      return <img src={content} alt="Shape Generated Image" className="message-image" />;
    }
    return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>;
  };

  return (
    <div className={`message ${message.role} ${message.pinned ? 'pinned' : ''}`} onContextMenu={handleContextMenu}>
      <div className="message-header">
        <span className="message-role">{message.role === 'user' ? 'You' : 'Shape'}</span>
        <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
        {message.pinned && <FaThumbtack className="pinned-icon" />}
      </div>
      {isEditing && message.role === 'user' ? (
        <div className="edit-message">
          <input
            type="text"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSaveEdit()}
          />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        renderContent(message.content)
      )}
      {message.reactions && (
        <div className="reaction-display">
          {Object.entries(message.reactions).map(([emoji, count]) => (
            <span key={emoji} className="reaction">
              {emoji} {count}
            </span>
          ))}
        </div>
      )}
      {showMenu && (
        <div className="message-menu" style={{ top: menuPosition.y, left: menuPosition.x }} ref={menuRef}>
          <div className="menu-item">
            <input
              type="text"
              value={reactionInput}
              onChange={e => setReactionInput(e.target.value)}
              placeholder="Add emoji (e.g., 😎)"
              onKeyPress={e => e.key === 'Enter' && handleAddReaction()}
            />
            <button onClick={handleAddReaction}>Add Reaction</button>
          </div>
          <button className="menu-item" onClick={handleCopyMessage}>
            <FaCopy /> Copy
          </button>
          {message.role === 'user' && (
            <>
              <button className="menu-item" onClick={handleEdit}>
                <FaEdit /> Edit
              </button>
              <button className="menu-item" onClick={() => deleteMessage(index)}>
                <FaTrash /> Delete
              </button>
            </>
          )}
          <button className="menu-item" onClick={() => togglePin(index)}>
            <FaThumbtack /> {message.pinned ? 'Unpin' : 'Pin'}
          </button>
        </div>
      )}
    </div>
  );
        }
