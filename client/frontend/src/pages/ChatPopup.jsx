import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatPopup.css';

function ChatPopup({ documentId, username }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-chat', { documentId, username });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat-history', (history) => {
      setMessages(history);
    });

    socket.on('typing-start', ({ username: typingUser }) => {
      if (typingUser !== username) {
        setTypingUsers(prev => new Set([...prev, typingUser]));
      }
    });

    socket.on('typing-stop', ({ username: typingUser }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(typingUser);
        return newSet;
      });
    });

    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [documentId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Emit typing start
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-start', { documentId, username });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('typing-stop', { documentId, username });
      }
    }, 1000);
  };

  const handleSend = () => {
    if (input.trim() && socketRef.current && isConnected) {
      const msg = { user: username, text: input, time: new Date().toLocaleTimeString() };
      socketRef.current.emit('chat-message', { documentId, ...msg });
      setMessages((prev) => [...prev, msg]);
      setInput('');
      
      // Stop typing indicator
      socketRef.current.emit('typing-stop', { documentId, username });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getTypingIndicatorText = () => {
    const typingArray = Array.from(typingUsers);
    if (typingArray.length === 0) return null;
    if (typingArray.length === 1) return `${typingArray[0]} is typing...`;
    if (typingArray.length === 2) return `${typingArray[0]} and ${typingArray[1]} are typing...`;
    return `${typingArray[0]} and ${typingArray.length - 1} others are typing...`;
  };

  return (
    <>
      <button 
        className={`chat-fab ${!isConnected ? 'disconnected' : ''}`} 
        onClick={() => setOpen((o) => !o)}
        title={!isConnected ? 'Connecting...' : 'Document Chat'}
      >
        {!isConnected ? '⏳' : '💬'}
      </button>
      <div className={`chat-popup ${open ? 'open' : ''}`}>
        <div className="chat-header">
          <span>Document Chat</span>
          <div className="chat-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
          <button className="chat-close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`chat-message${m.user === username ? ' self' : ''}`}>
                <div className="chat-message-header">
                  <span className="chat-user">{m.user}</span>
                  <span className="chat-time">{m.time}</span>
                </div>
                <div className="chat-text">{m.text}</div>
              </div>
            ))
          )}
          {getTypingIndicatorText() && (
            <div className="typing-indicator">
              <span className="typing-text">{getTypingIndicatorText()}</span>
              <span className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <button 
            className="chat-send" 
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

export default ChatPopup; 