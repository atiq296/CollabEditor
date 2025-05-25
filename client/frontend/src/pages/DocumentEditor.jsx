import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './DocumentEditor.css';
import ChatPanel from './ChatPanel';

function DocumentEditor({ docId, user }) {
  const [content, setContent] = useState('');

  const handleChange = (value) => {
    setContent(value);
  };

  const handleSave = () => {
    console.log('Document content:', content);
    // TODO: Send content to backend to save in MongoDB
  };

  return (
    <div className="editor-wrapper" style={{ display: 'flex', height: '100vh' }}>
      <div className="editor-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="editor-header">
          <h2>CollabEditor - Document Editor</h2>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleChange}
          placeholder="Start typing here..."
          modules={DocumentEditor.modules}
          formats={DocumentEditor.formats}
          style={{ flex: 1 }}
        />
      </div>
      {/* Chat sidebar */}
      {docId && user && (
        <ChatPanel documentId={docId} user={user} />
      )}
    </div>
  );
}

// Toolbar settings
DocumentEditor.modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
};

DocumentEditor.formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align',
  'list', 'bullet', 'link', 'image'
];

export default DocumentEditor;
