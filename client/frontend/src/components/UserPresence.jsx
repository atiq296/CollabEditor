import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './UserPresence.css';

function UserPresence({ documentId, currentUser }) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!documentId || !currentUser) return;

    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-document', { 
        documentId, 
        username: currentUser.name,
        userId: currentUser.id 
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('user-list', (users) => {
      setActiveUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId, currentUser]);

  const getStatusColor = (lastSeen) => {
    const now = Date.now();
    const timeDiff = now - lastSeen;
    
    if (timeDiff < 30000) return '#4ade80'; // Green - active in last 30 seconds
    if (timeDiff < 300000) return '#fbbf24'; // Yellow - active in last 5 minutes
    return '#f87171'; // Red - inactive
  };

  const getStatusText = (lastSeen) => {
    const now = Date.now();
    const timeDiff = now - lastSeen;
    
    if (timeDiff < 30000) return 'Active now';
    if (timeDiff < 300000) return 'Active recently';
    return 'Inactive';
  };

  const formatLastSeen = (lastSeen) => {
    const now = Date.now();
    const timeDiff = now - lastSeen;
    
    if (timeDiff < 60000) return 'Just now';
    if (timeDiff < 3600000) return `${Math.floor(timeDiff / 60000)}m ago`;
    if (timeDiff < 86400000) return `${Math.floor(timeDiff / 3600000)}h ago`;
    return `${Math.floor(timeDiff / 86400000)}d ago`;
  };

  return (
    <div className="user-presence-container">
      <div 
        className="user-presence-header"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="user-presence-title">
          <span className="user-presence-icon">👥</span>
          <span>Online Users ({activeUsers.length})</span>
        </div>
        <div className="user-presence-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
        <button className="user-presence-toggle">
          {showDetails ? '▼' : '▶'}
        </button>
      </div>
      
      {showDetails && (
        <div className="user-presence-details">
          {activeUsers.length === 0 ? (
            <div className="user-presence-empty">
              <p>No other users online</p>
            </div>
          ) : (
            <div className="user-list">
              {activeUsers.map((user, index) => (
                <div key={index} className="user-item">
                  <div className="user-avatar">
                    <span>{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {user.username}
                      {user.username === currentUser?.name && (
                        <span className="user-badge">You</span>
                      )}
                    </div>
                    <div className="user-status">
                      <span 
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(user.lastSeen) }}
                      ></span>
                      <span className="status-text">{getStatusText(user.lastSeen)}</span>
                      <span className="last-seen">• {formatLastSeen(user.lastSeen)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserPresence;
