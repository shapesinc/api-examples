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
          return (
            <ReactMarkdown
              key={index}
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
              {item.text}
            </ReactMarkdown>
          );
        } else if (item.type === 'image_url') {
          return <img key={index} src={item.image_url.url} alt="Uploaded" className="message-image" />;
        } else if (item.type === 'audio_url') {
          return <audio key={index} src={item.audio_url.url} controls className="message-audio" />;
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
