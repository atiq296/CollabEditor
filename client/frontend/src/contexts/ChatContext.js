import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get username from token
  const getUsername = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || 'User';
    } catch {
      return null;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      setMessages([]);
      setIsConnected(false);
      setUsername('');
      return;
    }

    const currentUsername = getUsername();
    if (!currentUsername) return;

    setUsername(currentUsername);

    // Connect to socket
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-global-chat', { username: currentUsername });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('global-chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Handle global typing indicators
    socket.on('global-user-typing', ({ username: typingUser, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(typingUser) ? prev : [...prev, typingUser];
        } else {
          return prev.filter(user => user !== typingUser);
        }
      });
    });

    // Load chat history
    fetch('http://localhost:5000/api/chat/history', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setMessages(data);
      }
    })
    .catch(err => {
      console.error('Failed to load chat history:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (text) => {
    if (!text.trim() || !isConnected || !username) return;

    const message = {
      user: username,
      text: text.trim(),
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('global-chat-message', message);
    
    // Stop typing indicator when sending message
    socketRef.current.emit('global-typing-stop', { username });
    clearTimeout(typingTimeoutRef.current);
    
    // Optimistically add to local state
    setMessages(prev => [...prev, message]);
  };

  const handleTypingStart = () => {
    if (!isConnected || !username) return;
    
    socketRef.current.emit('global-typing-start', { username });
    
    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('global-typing-stop', { username });
    }, 3000);
  };

  const handleTypingStop = () => {
    if (!isConnected || !username) return;
    
    socketRef.current.emit('global-typing-stop', { username });
    clearTimeout(typingTimeoutRef.current);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value = {
    messages,
    sendMessage,
    isConnected,
    username,
    isAuthenticated: isAuthenticated(),
    clearMessages,
    typingUsers,
    handleTypingStart,
    handleTypingStop
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 