import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatPopup.css';

function ChatPopup({ documentId, username }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join-chat', { documentId, username });
    socket.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
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
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
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