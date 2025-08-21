import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatPopup.css';

function ChatPopup({ documentId, username }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join-chat', { documentId, username });
    socket.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    
    // Handle typing indicators
    socket.on('user-typing', ({ username: typingUser, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(typingUser) ? prev : [...prev, typingUser];
        } else {
          return prev.filter(user => user !== typingUser);
        }
      });
    });
    
    return () => socket.disconnect();
  }, [documentId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = () => {
    if (input.trim()) {
      const msg = { user: username, text: input, time: new Date().toLocaleTimeString() };
      socketRef.current.emit('chat-message', { documentId, ...msg });
      setMessages((prev) => [...prev, msg]);
      setInput('');
      
      // Stop typing indicator when sending message
      socketRef.current.emit('typing-stop', { documentId, username });
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Emit typing start
    if (e.target.value.trim() && socketRef.current) {
      socketRef.current.emit('typing-start', { documentId, username });
      
      // Clear previous timeout
      clearTimeout(typingTimeoutRef.current);
      
      // Set timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing-stop', { documentId, username });
      }, 3000);
    } else if (!e.target.value.trim() && socketRef.current) {
      socketRef.current.emit('typing-stop', { documentId, username });
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)}>
        💬
      </button>
      <div className={`chat-popup ${open ? 'open' : ''}`}>
        <div className="chat-header">
          <span>Chat</span>
          <button className="chat-close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message${m.user === username ? ' self' : ''}`}>
              <span className="chat-user">{m.user}</span>: <span className="chat-text">{m.text}</span>
              <span className="chat-time">{m.time}</span>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="chat-typing-indicator">
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
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button className="chat-send" onClick={handleSend}>Send</button>
        </div>
      </div>
    </>
  );
}

export default ChatPopup; 