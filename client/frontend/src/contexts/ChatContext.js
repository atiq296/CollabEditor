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
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [typingUsers, setTypingUsers] = useState(new Set());
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get username from token
  const getUsernameFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || 'User';
    } catch {
      return null;
    }
  };

  // Auth state
  const isAuthenticated = !!authToken;

  // Watch for token changes (login/logout) and update auth state
  useEffect(() => {
    const handleStorage = () => {
      setAuthToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      setAuthToken((prev) => (prev !== token ? token : prev));
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      setIsConnected(false);
      setUsername('');
      setTypingUsers(new Set());
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const currentUsername = getUsernameFromToken(authToken);
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
      // Remove typing indicator when message is sent
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(msg.user);
        return newSet;
      });
    });

    // Handle typing indicators
    socket.on('user-typing', ({ username, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(username);
        } else {
          newSet.delete(username);
        }
        return newSet;
      });
    });

    // Load chat history
    fetch('http://localhost:5000/api/chat/history', {
      headers: {
        'Authorization': `Bearer ${authToken}`
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
  }, [authToken]);

  const sendMessage = (text) => {
    if (!text.trim() || !isConnected || !username) return;

    const message = {
      user: username,
      text: text.trim(),
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('global-chat-message', message);
    
    // Optimistically add to local state
    setMessages(prev => [...prev, message]);
  };

  const handleTyping = () => {
    if (!isConnected || !username) return;

    // Emit typing start
    socketRef.current.emit('typing-start', { username });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing-stop', { username });
    }, 2000); // Stop typing indicator after 2 seconds of inactivity
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value = {
    messages,
    sendMessage,
    isConnected,
    username,
    isAuthenticated,
    clearMessages,
    typingUsers,
    handleTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 