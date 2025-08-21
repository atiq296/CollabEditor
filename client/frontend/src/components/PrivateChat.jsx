import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box,
  IconButton,
  Divider
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import './PrivateChat.css';

function PrivateChat({ open, onClose, targetUser, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!open || !targetUser || !currentUser) return;

    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    
    // Join private chat room
    socket.emit('join-private-chat', { fromUser: currentUser, toUser: targetUser });
    
    // Listen for private messages
    socket.on('private-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    // Handle typing indicators
    socket.on('private-user-typing', ({ username: typingUser, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(typingUser) ? prev : [...prev, typingUser];
        } else {
          return prev.filter(user => user !== typingUser);
        }
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, [open, targetUser, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && socketRef.current) {
      const message = {
        fromUser: currentUser,
        toUser: targetUser,
        text: input.trim(),
        time: new Date().toLocaleTimeString()
      };
      
      socketRef.current.emit('private-message', message);
      setMessages(prev => [...prev, message]);
      setInput('');
      
      // Stop typing indicator
      socketRef.current.emit('private-typing-stop', { fromUser: currentUser, toUser: targetUser });
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    if (e.target.value.trim() && socketRef.current) {
      socketRef.current.emit('private-typing-start', { fromUser: currentUser, toUser: targetUser });
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('private-typing-stop', { fromUser: currentUser, toUser: targetUser });
      }, 3000);
    } else if (!e.target.value.trim() && socketRef.current) {
      socketRef.current.emit('private-typing-stop', { fromUser: currentUser, toUser: targetUser });
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { height: '70vh', maxHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {targetUser?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h6">
              Chat with {targetUser}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                Start your conversation with {targetUser}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map((msg, i) => (
                <ListItem 
                  key={i} 
                  sx={{ 
                    flexDirection: msg.fromUser === currentUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 1
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: msg.fromUser === currentUser ? 'primary.main' : 'secondary.main' }}>
                      {msg.fromUser.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <Box 
                    sx={{ 
                      maxWidth: '70%',
                      bgcolor: msg.fromUser === currentUser ? 'primary.light' : 'grey.100',
                      color: msg.fromUser === currentUser ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      p: 1.5
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {msg.text}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {msg.time}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
          
          {typingUsers.length > 0 && (
            <Box sx={{ p: 2, pt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {typingUsers[0]} is typing...
              </Typography>
              <Box className="typing-dots" sx={{ display: 'inline-flex', ml: 1, gap: 0.3 }}>
                <Box className="typing-dot" />
                <Box className="typing-dot" />
                <Box className="typing-dot" />
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${targetUser}...`}
            variant="outlined"
          />
          <Button 
            variant="contained" 
            onClick={handleSend}
            disabled={!input.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <Send fontSize="small" />
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default PrivateChat;