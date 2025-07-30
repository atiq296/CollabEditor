import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container, CssBaseline } from "@mui/material";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentEditor from "./pages/DocumentEditor";
import SpreadsheetPage from "./pages/SpreadsheetPage";
import HomePage from "./pages/HomePage";
import { ChatProvider } from "./contexts/ChatContext";
import GlobalChat from "./components/GlobalChat";
import SelectRole from "./pages/SelectRole";
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
          <Route path="/spreadsheet/:id" element={<SpreadsheetPage />} />
          <Route path="/select-role" element={<SelectRole />} />
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
