import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Person,
  Email,
  Phone,
  LocationOn,
  Business,
  School,
  Language,
  LinkedIn,
  GitHub,
  Twitter,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './ProfileManagement.css';

function ProfileManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    company: '',
    education: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    avatar: null
  });

  const [originalProfile, setOriginalProfile] = useState({});

  const getToken = () => localStorage.getItem('token') || '';

  // Fetch user profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          company: data.company || '',
          education: data.education || '',
          bio: data.bio || '',
          website: data.website || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          twitter: data.twitter || '',
          avatar: data.avatar || null
        });
        setOriginalProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          company: data.company || '',
          education: data.education || '',
          bio: data.bio || '',
          website: data.website || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          twitter: data.twitter || '',
          avatar: data.avatar || null
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      setShowAvatarDialog(true);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      setProfile(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = getToken();

      // Create FormData for file upload
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (key === 'avatar' && profile[key] instanceof File) {
          formData.append('avatar', profile[key]);
        } else if (key !== 'avatar') {
          formData.append(key, profile[key]);
        }
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile update successful:', data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setAvatarPreview(null);
        
        // Update original profile
        setOriginalProfile({
          ...profile,
          avatar: data.avatar || profile.avatar
        });
        
        // Update profile with server response
        setProfile(prev => ({
          ...prev,
          avatar: data.avatar || prev.avatar
        }));
      } else {
        const errorData = await response.json();
        console.error('Profile update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setMessage({ type: 'error', text: errorData.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
    setAvatarPreview(null);
    setMessage({ type: '', text: '' });
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (profile.avatar && typeof profile.avatar === 'string') {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/avatars/${profile.avatar}`;
    }
    return null;
  };

  const hasChanges = () => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile) || avatarPreview;
  };

  if (loading && !profile.name) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="profile-management-root">
      <Box className="profile-header">
        <Typography variant="h4" className="profile-title">
          Profile Management
        </Typography>
        <Typography variant="body1" className="profile-subtitle">
          Update your personal information and avatar
        </Typography>
      </Box>

      {message.text && (
        <Alert 
          severity={message.type} 
          className="profile-alert"
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Card className="profile-card">
        <CardContent>
          <Grid container spacing={3}>
            {/* Avatar Section */}
            <Grid item xs={12} md={4}>
              <Box className="avatar-section">
                <Box className="avatar-container" onClick={handleAvatarClick}>
                  <Avatar
                    src={getAvatarUrl()}
                    className="profile-avatar"
                    sx={{ width: 120, height: 120 }}
                  >
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  {isEditing && (
                    <IconButton className="avatar-edit-button">
                      <PhotoCamera />
                    </IconButton>
                  )}
                </Box>
                
                                 {isEditing && (
                   <Button
                     variant="outlined"
                     onClick={() => fileInputRef.current?.click()}
                     className="upload-button"
                     startIcon={<PhotoCamera />}
                   >
                     Upload Photo
                   </Button>
                 )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>
            </Grid>

            {/* Profile Information */}
            <Grid item xs={12} md={8}>
              <Box className="profile-info">
                <Box className="profile-header-actions">
                  <Typography variant="h5" className="profile-name">
                    {profile.name || 'Your Name'}
                  </Typography>
                  <Box className="profile-actions">
                    {!isEditing ? (
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setIsEditing(true)}
                        className="edit-button"
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box className="edit-actions">
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          disabled={loading || !hasChanges()}
                          className="save-button"
                        >
                          {loading ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          className="cancel-button"
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Divider className="profile-divider" />

                {/* Basic Information */}
                <Box className="info-section">
                  <Typography variant="h6" className="section-title">
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Person className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Email className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Phone className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={profile.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <LocationOn className="input-icon" />
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Professional Information */}
                <Box className="info-section">
                  <Typography variant="h6" className="section-title">
                    Professional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company"
                        value={profile.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Business className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Education"
                        value={profile.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <School className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        multiline
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Social Links */}
                <Box className="info-section">
                  <Typography variant="h6" className="section-title">
                    Social Links
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={profile.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Language className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="LinkedIn"
                        value={profile.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <LinkedIn className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="GitHub"
                        value={profile.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <GitHub className="input-icon" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Twitter"
                        value={profile.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Twitter className="input-icon" />
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarDialog} onClose={() => setShowAvatarDialog(false)}>
        <DialogTitle>Upload Profile Photo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Choose a photo to upload as your profile picture. Supported formats: JPG, PNG, GIF. Maximum size: 5MB.
          </Typography>
          <Box className="avatar-upload-preview">
            {avatarPreview && (
              <Avatar
                src={avatarPreview}
                sx={{ width: 100, height: 100, margin: '20px auto' }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAvatarDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              fileInputRef.current?.click();
              setShowAvatarDialog(false);
            }}
            variant="contained"
          >
            Choose File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProfileManagement; 