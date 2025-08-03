import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container, CssBaseline } from "@mui/material";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentEditor from "./pages/DocumentEditor";
import DocumentViewer from "./pages/DocumentViewer";
import SpreadsheetPage from "./pages/SpreadsheetPage";
import SpreadsheetViewer from "./pages/SpreadsheetViewer";
import HomePage from "./pages/HomePage";
import { ChatProvider } from "./contexts/ChatContext";
import GlobalChat from "./components/GlobalChat";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <CssBaseline />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor/:id" element={<DocumentEditor />} />
            <Route path="/viewer/:id" element={<DocumentViewer />} />
            <Route path="/spreadsheet/:id" element={<SpreadsheetPage />} />
            <Route path="/spreadsheet-viewer/:id" element={<SpreadsheetViewer />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        <GlobalChat />
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
