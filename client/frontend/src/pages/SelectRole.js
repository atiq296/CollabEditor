import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Box, Alert } from "@mui/material";

function SelectRole() {
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setRole(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError("Please select a role.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/set-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to set role.");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2} bgcolor="#fff">
      <Typography variant="h5" align="center" gutterBottom>
        Select Your Role
      </Typography>
      <form onSubmit={handleSubmit}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Choose one:</FormLabel>
          <RadioGroup value={role} onChange={handleChange}>
            <FormControlLabel value="Owner" control={<Radio />} label="Owner (Full control)" />
            <FormControlLabel value="Editor" control={<Radio />} label="Editor (Can edit content)" />
            <FormControlLabel value="Viewer" control={<Radio />} label="Viewer (View only)" />
          </RadioGroup>
        </FormControl>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Role set! Redirecting...</Alert>}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
          Confirm Role
        </Button>
      </form>
    </Box>
  );
}

export default SelectRole; 