import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './PrivateChat.css';

function PrivateChat({ recipient, username, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Load private chat history
      socket.emit('get-private-history', { from: username, to: recipient });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('private-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('private-history', (history) => {
      setMessages(history);
    });

    socket.on('private-typing-start', ({ from }) => {
      if (from === recipient) {
        setIsTyping(true);
      }
    });

    socket.on('private-typing-stop', ({ from }) => {
      if (from === recipient) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [username, recipient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Emit typing start
    if (socketRef.current && isConnected) {
      socketRef.current.emit('private-typing-start', { from: username, to: recipient });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('private-typing-stop', { from: username, to: recipient });
      }
    }, 1000);
  };

  const handleSend = () => {
    if (input.trim() && socketRef.current && isConnected) {
      const msg = { 
        from: username, 
        to: recipient,
        text: input, 
        time: new Date().toLocaleTimeString() 
      };
      socketRef.current.emit('private-message', msg);
      setMessages(prev => [...prev, msg]);
      setInput('');
      
      // Stop typing indicator
      socketRef.current.emit('private-typing-stop', { from: username, to: recipient });
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

  return (
    <div className="private-chat-container">
      <div className="private-chat-header">
        <span>Private Chat with {recipient}</span>
        <div className="private-chat-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
        <button className="private-chat-close" onClick={onClose}>×</button>
      </div>
      
      <div className="private-chat-messages">
        {messages.length === 0 ? (
          <div className="private-chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`private-chat-message ${msg.from === username ? 'self' : ''}`}>
              <div className="private-chat-message-header">
                <span className="private-chat-user">{msg.from}</span>
                <span className="private-chat-time">{msg.time}</span>
              </div>
              <div className="private-chat-text">{msg.text}</div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="typing-indicator">
            <span className="typing-text">{recipient} is typing...</span>
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="private-chat-input-row">
        <input
          className="private-chat-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button 
          className="private-chat-send" 
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default PrivateChat;
