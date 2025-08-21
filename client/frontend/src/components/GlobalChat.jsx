import React, { useState, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import './GlobalChat.css';

function GlobalChat() {
  const { messages, sendMessage, isConnected, username, isAuthenticated, typingUsers, handleTypingStart, handleTypingStop } = useChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Always call hooks at the top level
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Only conditionally render, not call hooks
  if (!isAuthenticated) {
    return null;
  }

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
      handleTypingStop();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button 
        className={`global-chat-fab ${!isConnected ? 'disconnected' : ''}`} 
        onClick={() => setOpen(prev => !prev)}
        title={!isConnected ? 'Connecting...' : 'Global Chat'}
      >
        {!isConnected ? '⏳' : '💬'}
      </button>
      
      <div className={`global-chat-popup ${open ? 'open' : ''}`}>
        <div className="global-chat-header">
          <span>Global Chat</span>
          <div className="global-chat-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
          <button className="global-chat-close" onClick={() => setOpen(false)}>×</button>
        </div>
        
        <div className="global-chat-messages">
          {messages.length === 0 ? (
            <div className="global-chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`global-chat-message ${msg.user === username ? 'self' : ''}`}>
                <div className="global-chat-message-header">
                  <span className="global-chat-user">{msg.user}</span>
                  <span className="global-chat-time">{msg.time}</span>
                </div>
                <div className="global-chat-text">{msg.text}</div>
              </div>
            ))
          )}
          {typingUsers && typingUsers.length > 0 && (
            <div className="global-chat-typing-indicator">
              <span className="typing-text">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...` 
                  : `${typingUsers.join(', ')} are typing...`}
              </span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="global-chat-input-row">
          <input
            className="global-chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <button 
            className="global-chat-send" 
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default GlobalChat; 