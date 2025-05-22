
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container, CssBaseline, Typography } from "@mui/material";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/EditorPage";




function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <Container maxWidth="lg">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor/:id" element={<EditorPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
