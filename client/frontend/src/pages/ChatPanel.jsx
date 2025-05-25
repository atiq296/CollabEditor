import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './ChatPanel.css';

export default function ChatPanel({ documentId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState({});
  const socketRef = useRef();
  const typingTimeout = useRef();

  useEffect(() => {
    // 1. Grab the exact token key you stored on login/signup
    const token = localStorage.getItem('token');
    if (!token) return console.error('No auth token found');

    // 2. Connect & authenticate Socket.IO
    const socket = io(
      process.env.REACT_APP_API_URL || 'http://localhost:5000',
      { auth: { token } }
    );
    socketRef.current = socket;

    // 3. Join the document’s room
    socket.emit('join-document', documentId);

    // 4. Load chat history with Authorization header
    axios.get(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/${documentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => setMessages(res.data))
    .catch(err => console.error('Chat history load error:', err));

    // 5. Listen for new messages and typing events
    socket.on('receive-message', msg        => setMessages(ms => [...ms, msg]));
    socket.on('user-typing',   ({userId, isTyping}) =>
      setTyping(t => ({ ...t, [userId]: isTyping }))
    );

    return () => {
      clearTimeout(typingTimeout.current);
      socket.disconnect();
    };
  }, [documentId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit('send-message', {
      documentId,
      content: input,
      recipients: []
    });
    setInput('');
  };

  const handleType = e => {
    setInput(e.target.value);
    socketRef.current.emit('typing', { documentId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current.emit('typing', { documentId, isTyping: false });
    }, 700);
  };

  return (
    <div className="chat-panel">
      <div className="messages">
        {messages.map(m => (
          <div key={m._id} className={m.sender._id === user._id ? 'mine' : 'theirs'}>
            <span className="sender">{m.sender.username}</span>
            <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
            <div className="content">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="typing-indicator">
        {Object.entries(typing)
          .filter(([, t]) => t)
          .map(([uid]) => <em key={uid}>{uid} is typing…</em>)}
      </div>
      <div className="input-row">
        <input
          value={input}
          onChange={handleType}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
