'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FaCopy } from 'react-icons/fa';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useState } from 'react';

export default function Message({ message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (content) => {
    if (Array.isArray(content)) {
      return content.map((item, index) => {
        if (item.type === 'text') {
          // Detect image URLs in text (png, jpg, jpeg, gif)
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
                    const isTechContent = className?.includes('language-') || content.includes('\n') || content.match(/^\{.*\}$|^\[.*\]$|^`.*`$/);
                    return !inline && isTechContent ? (
                      <div className="code-block">
                        <pre>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
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
          return <audio key={index} src={item.audio_url.url} controls className="message-audio" title={message.role === 'assistant' ? 'Shape Audio' : 'User Audio'} />;
        }
        return null;
      });
    }
    return null;
  };

  return (
    <div className={`message ${message.role}`}>
      {renderContent(message.content)}
    </div>
  );
}
