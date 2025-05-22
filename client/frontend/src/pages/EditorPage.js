import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

function EditorPage() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quillValue, setQuillValue] = useState("");
  const quillRef = useRef();

  // ✅ Connect to backend socket
  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // ✅ Join document room
  useEffect(() => {
    if (!socket || !documentId) return;
    socket.emit("join-document", documentId);
  }, [socket, documentId]);

  // ✅ Receive changes from others
  useEffect(() => {
    if (!socket || !quillRef.current) return;

    const quill = quillRef.current.getEditor();

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket]);

  // ✅ Send changes when user types
  useEffect(() => {
    if (!socket || !quillRef.current) return;

    const quill = quillRef.current.getEditor();

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", { documentId, delta });
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket]);

  // ✅ Auto-save every 3 seconds
  useEffect(() => {
    if (!documentId || !quillValue) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem("token");

      fetch(`http://localhost:5000/api/document/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: quillValue }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("💾 Auto-saved:", data.updatedAt);
        })
        .catch((err) => {
          console.error("❌ Auto-save failed:", err.message);
        });
    }, 3000); // every 3 seconds

    return () => clearInterval(interval);
  }, [documentId, quillValue]);

  return (
    <div style={{ padding: "2rem" }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={quillValue}
        onChange={setQuillValue}
        placeholder="Start writing your collaborative document here..."
      />
    </div>
  );
}

export default EditorPage;
