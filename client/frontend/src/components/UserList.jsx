import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import { Close, Message } from '@mui/icons-material';
import PrivateChat from './PrivateChat';

function UserList({ open, onClose, activeUsers, currentUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateChatOpen, setPrivateChatOpen] = useState(false);

  const handleStartPrivateChat = (user) => {
    if (user !== currentUser) {
      setSelectedUser(user);
      setPrivateChatOpen(true);
    }
  };

  const handleClosePrivateChat = () => {
    setPrivateChatOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              👥 Active Users ({activeUsers.length})
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {activeUsers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No active users found
              </Typography>
            </Box>
          ) : (
            <List>
              {activeUsers.map((user, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton 
                    onClick={() => handleStartPrivateChat(user)}
                    disabled={user === currentUser}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: user === currentUser ? 'primary.main' : 'secondary.main' }}>
                        {user.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {user}
                          </Typography>
                          {user === currentUser && (
                            <Chip 
                              label="You" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box 
                            sx={{ 
                              width: 8, 
                              height: 8, 
                              bgcolor: 'success.main', 
                              borderRadius: '50%' 
                            }} 
                          />
                          <Typography variant="caption" color="success.main">
                            Online
                          </Typography>
                        </Box>
                      }
                    />
                    {user !== currentUser && (
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartPrivateChat(user);
                        }}
                      >
                        <Message fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Private Chat Dialog */}
      <PrivateChat
        open={privateChatOpen}
        onClose={handleClosePrivateChat}
        targetUser={selectedUser}
        currentUser={currentUser}
      />
    </>
  );
}

export default UserList;