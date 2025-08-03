import React from 'react';

const CollabEditorLogo = ({ size = 120, className = "" }) => {
  return (
    <div className={`collabeditor-logo ${className}`} style={{ width: size, height: size * 0.8 }}>
      <img 
        src="/logo512.png" 
        alt="CollabEditor Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(0, 255, 255, 0.3))'
        }}
      />
    </div>
);
};

export default CollabEditorLogo; 