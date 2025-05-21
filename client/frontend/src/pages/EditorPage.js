import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import { Container, Typography } from "@mui/material";

function EditorPage() {
  const { id } = useParams(); // document ID from URL
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  // Fetch the document from backend
  useEffect(() => {
    const fetchDoc = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/document/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setTitle(data.title);
        setContent(data.content);
      } else {
        alert("Failed to load document");
      }
    };

    fetchDoc();
  }, [id]);

  const handleChange = (value) => {
    setContent(value);
    // You’ll sync this in real time via socket in next step
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        {title}
      </Typography>
      <ReactQuill value={content} onChange={handleChange} />
    </Container>
  );
}

export default EditorPage;
