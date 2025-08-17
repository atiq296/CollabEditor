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
  FormHelperText,
  Link,
  Tooltip,
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
  Instagram,
  Facebook,
  YouTube,
  Chat,
  Telegram,
  WhatsApp,
  CameraAlt,
  VideoLibrary,
  Forum,
  LiveTv,
  Pinterest,
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
  const [validationErrors, setValidationErrors] = useState({});

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
    instagram: '',
    facebook: '',
    youtube: '',
    discord: '',
    telegram: '',
    whatsapp: '',
    snapchat: '',
    tiktok: '',
    reddit: '',
    twitch: '',
    pinterest: '',
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
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          youtube: data.youtube || '',
          discord: data.discord || '',
          telegram: data.telegram || '',
          whatsapp: data.whatsapp || '',
          snapchat: data.snapchat || '',
          tiktok: data.tiktok || '',
          reddit: data.reddit || '',
          twitch: data.twitch || '',
          pinterest: data.pinterest || '',
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
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          youtube: data.youtube || '',
          discord: data.discord || '',
          telegram: data.telegram || '',
          whatsapp: data.whatsapp || '',
          snapchat: data.snapchat || '',
          tiktok: data.tiktok || '',
          reddit: data.reddit || '',
          twitch: data.twitch || '',
          pinterest: data.pinterest || '',
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

  // Validation functions
  const validateName = (name) => {
    if (!name) return '';
    
    // Check if name contains only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    
    if (name.length < 2) return 'Name must be at least 2 characters long';
    if (name.length > 100) return 'Name is too long (max 100 characters)';
    
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return '';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (email.length > 100) return 'Email is too long (max 100 characters)';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return '';
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) return 'Phone number must be at least 10 digits';
    if (digitsOnly.length > 15) return 'Phone number is too long (max 15 digits)';
    
    // Check if it contains only valid characters (digits, spaces, dashes, parentheses, plus)
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(phone)) return 'Phone number contains invalid characters';
    
    return '';
  };

  const validateCompany = (company) => {
    if (!company) return '';
    
    // Check if company contains only letters, numbers, spaces, hyphens, apostrophes, and common business characters
    const companyRegex = /^[a-zA-Z0-9\s\-'&.,()]+$/;
    if (!companyRegex.test(company)) return 'Company name contains invalid characters';
    
    if (company.length < 2) return 'Company name must be at least 2 characters long';
    if (company.length > 100) return 'Company name is too long (max 100 characters)';
    
    return '';
  };

  const validateEducation = (education) => {
    if (!education) return '';
    
    // Check if education contains only letters, numbers, spaces, hyphens, apostrophes, and common education characters
    const educationRegex = /^[a-zA-Z0-9\s\-'&.,()]+$/;
    if (!educationRegex.test(education)) return 'Education contains invalid characters';
    
    if (education.length < 2) return 'Education must be at least 2 characters long';
    if (education.length > 100) return 'Education is too long (max 100 characters)';
    
    return '';
  };

  const validateBio = (bio) => {
    if (!bio) return '';
    
    // Check for minimum length
    if (bio.length < 10) return 'Bio must be at least 10 characters long';
    if (bio.length > 500) return 'Bio is too long (max 500 characters)';
    
    // Check for inappropriate content (basic check)
    const inappropriateWords = ['spam', 'advertisement', 'promotion'];
    const lowerBio = bio.toLowerCase();
    for (const word of inappropriateWords) {
      if (lowerBio.includes(word)) {
        return 'Bio contains inappropriate content';
      }
    }
    
    return '';
  };

  const validateURL = (url, fieldName) => {
    if (!url) return '';
    
    // Add protocol if missing
    let urlToValidate = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('www.')) {
      urlToValidate = 'https://' + url;
    } else if (url.startsWith('www.')) {
      urlToValidate = 'https://' + url;
    }
    
    try {
      new URL(urlToValidate);
      return '';
    } catch {
      return `Please enter a valid ${fieldName} URL`;
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US format
    if (digitsOnly.length >= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    } else if (digitsOnly.length >= 3) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else if (digitsOnly.length > 0) {
      return `(${digitsOnly}`;
    }
    
    return digitsOnly;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    // Apply formatting for phone number
    if (field === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setProfile(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Validate the field
    let error = '';
    if (field === 'name') {
      error = validateName(formattedValue);
    } else if (field === 'email') {
      error = validateEmail(formattedValue);
    } else if (field === 'phone') {
      error = validatePhone(formattedValue);
    } else if (field === 'company') {
      error = validateCompany(formattedValue);
    } else if (field === 'education') {
      error = validateEducation(formattedValue);
    } else if (field === 'bio') {
      error = validateBio(formattedValue);
    } else if (field === 'website') {
      error = validateURL(formattedValue, 'website');
    } else if (field === 'linkedin') {
      error = validateURL(formattedValue, 'LinkedIn');
    } else if (field === 'github') {
      error = validateURL(formattedValue, 'GitHub');
    } else if (field === 'twitter') {
      error = validateURL(formattedValue, 'Twitter');
    } else if (field === 'instagram') {
      error = validateURL(formattedValue, 'Instagram');
    } else if (field === 'facebook') {
      error = validateURL(formattedValue, 'Facebook');
    } else if (field === 'youtube') {
      error = validateURL(formattedValue, 'YouTube');
    } else if (field === 'discord') {
      error = validateURL(formattedValue, 'Discord');
    } else if (field === 'telegram') {
      error = validateURL(formattedValue, 'Telegram');
    } else if (field === 'whatsapp') {
      error = validateURL(formattedValue, 'WhatsApp');
    } else if (field === 'snapchat') {
      error = validateURL(formattedValue, 'Snapchat');
    } else if (field === 'tiktok') {
      error = validateURL(formattedValue, 'TikTok');
    } else if (field === 'reddit') {
      error = validateURL(formattedValue, 'Reddit');
    } else if (field === 'twitch') {
      error = validateURL(formattedValue, 'Twitch');
    } else if (field === 'pinterest') {
      error = validateURL(formattedValue, 'Pinterest');
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleKeyPress = (field, event) => {
    // Prevent invalid characters from being typed
    if (field === 'name') {
      // Only allow letters, spaces, hyphens, and apostrophes
      const validChars = /[a-zA-Z\s\-']/;
      if (!validChars.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'phone') {
      // Only allow digits, spaces, dashes, parentheses, and plus
      const validChars = /[\d\s\-\(\)\+]/;
      if (!validChars.test(event.key)) {
        event.preventDefault();
      }
    }
  };

  const handlePaste = (field, event) => {
    // Filter pasted content for invalid characters
    if (field === 'name') {
      const pastedText = event.clipboardData.getData('text');
      const filteredText = pastedText.replace(/[^a-zA-Z\s\-']/g, '');
      if (filteredText !== pastedText) {
        event.preventDefault();
        // You could show a message here about invalid characters being removed
      }
    } else if (field === 'phone') {
      const pastedText = event.clipboardData.getData('text');
      const filteredText = pastedText.replace(/[^\d\s\-\(\)\+]/g, '');
      if (filteredText !== pastedText) {
        event.preventDefault();
        // You could show a message here about invalid characters being removed
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (profile.name) {
      errors.name = validateName(profile.name);
    }
    
    if (profile.email) {
      errors.email = validateEmail(profile.email);
    }
    
    if (profile.phone) {
      errors.phone = validatePhone(profile.phone);
    }

    if (profile.company) {
      errors.company = validateCompany(profile.company);
    }

    if (profile.education) {
      errors.education = validateEducation(profile.education);
    }

    if (profile.bio) {
      errors.bio = validateBio(profile.bio);
    }

    if (profile.website) {
      errors.website = validateURL(profile.website, 'website');
    }

    if (profile.linkedin) {
      errors.linkedin = validateURL(profile.linkedin, 'LinkedIn');
    }

    if (profile.github) {
      errors.github = validateURL(profile.github, 'GitHub');
    }

    if (profile.twitter) {
      errors.twitter = validateURL(profile.twitter, 'Twitter');
    }

    if (profile.instagram) {
      errors.instagram = validateURL(profile.instagram, 'Instagram');
    }

    if (profile.facebook) {
      errors.facebook = validateURL(profile.facebook, 'Facebook');
    }

    if (profile.youtube) {
      errors.youtube = validateURL(profile.youtube, 'YouTube');
    }

    if (profile.discord) {
      errors.discord = validateURL(profile.discord, 'Discord');
    }

    if (profile.telegram) {
      errors.telegram = validateURL(profile.telegram, 'Telegram');
    }

    if (profile.whatsapp) {
      errors.whatsapp = validateURL(profile.whatsapp, 'WhatsApp');
    }

    if (profile.snapchat) {
      errors.snapchat = validateURL(profile.snapchat, 'Snapchat');
    }

    if (profile.tiktok) {
      errors.tiktok = validateURL(profile.tiktok, 'TikTok');
    }

    if (profile.reddit) {
      errors.reddit = validateURL(profile.reddit, 'Reddit');
    }

    if (profile.twitch) {
      errors.twitch = validateURL(profile.twitch, 'Twitch');
    }

    if (profile.pinterest) {
      errors.pinterest = validateURL(profile.pinterest, 'Pinterest');
    }

    setValidationErrors(errors);
    return Object.values(errors).every(error => !error);
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
    // Validate form before saving
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix validation errors before saving' });
      return;
    }

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
    setValidationErrors({});
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (profile.avatar && typeof profile.avatar === 'string') {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/avatars/${profile.avatar}`;
    }
    return null;
  };

  const getSocialIcon = (platform) => {
    const icons = {
      website: <Language />,
      linkedin: <LinkedIn />,
      github: <GitHub />,
      twitter: <Twitter />,
      instagram: <Instagram />,
      facebook: <Facebook />,
      youtube: <YouTube />,
      discord: <Chat />,
      telegram: <Telegram />,
      whatsapp: <WhatsApp />,
      snapchat: <CameraAlt />,
      tiktok: <VideoLibrary />,
      reddit: <Forum />,
      twitch: <LiveTv />,
      pinterest: <Pinterest />
    };
    return icons[platform] || <Language />;
  };

  const getSocialLabel = (platform) => {
    const labels = {
      website: 'Website',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      twitter: 'Twitter',
      instagram: 'Instagram',
      facebook: 'Facebook',
      youtube: 'YouTube',
      discord: 'Discord',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      snapchat: 'Snapchat',
      tiktok: 'TikTok',
      reddit: 'Reddit',
      twitch: 'Twitch',
      pinterest: 'Pinterest'
    };
    return labels[platform] || 'Social Link';
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
                        onKeyPress={(e) => handleKeyPress('name', e)}
                        onPaste={(e) => handlePaste('name', e)}
                        disabled={!isEditing}
                        error={!!validationErrors.name}
                        InputProps={{
                          startAdornment: <Person className="input-icon" />
                        }}
                        inputProps={{
                          maxLength: 100
                        }}
                      />
                      {validationErrors.name && (
                        <FormHelperText error>
                          {validationErrors.name}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('email', e)}
                        onPaste={(e) => handlePaste('email', e)}
                        disabled={!isEditing}
                        error={!!validationErrors.email}
                        InputProps={{
                          startAdornment: <Email className="input-icon" />
                        }}
                        inputProps={{
                          maxLength: 100
                        }}
                      />
                      {validationErrors.email && (
                        <FormHelperText error>
                          {validationErrors.email}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('phone', e)}
                        onPaste={(e) => handlePaste('phone', e)}
                        disabled={!isEditing}
                        error={!!validationErrors.phone}
                        placeholder="(123) 456-7890"
                        InputProps={{
                          startAdornment: <Phone className="input-icon" />
                        }}
                        inputProps={{
                          maxLength: 20
                        }}
                      />
                      {validationErrors.phone && (
                        <FormHelperText error>
                          {validationErrors.phone}
                        </FormHelperText>
                      )}
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
                        inputProps={{
                          maxLength: 100
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
                        onKeyPress={(e) => handleKeyPress('company', e)}
                        onPaste={(e) => handlePaste('company', e)}
                        disabled={!isEditing}
                        error={!!validationErrors.company}
                        InputProps={{
                          startAdornment: <Business className="input-icon" />
                        }}
                        inputProps={{
                          maxLength: 100
                        }}
                      />
                      {validationErrors.company && (
                        <FormHelperText error>
                          {validationErrors.company}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Education"
                        value={profile.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('education', e)}
                        onPaste={(e) => handlePaste('education', e)}
                        disabled={!isEditing}
                        error={!!validationErrors.education}
                        InputProps={{
                          startAdornment: <School className="input-icon" />
                        }}
                        inputProps={{
                          maxLength: 100
                        }}
                      />
                      {validationErrors.education && (
                        <FormHelperText error>
                          {validationErrors.education}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        multiline
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('bio', e)}
                        onPaste={(e) => handlePaste('bio', e)}
                        disabled={!isEditing}
                        error={!!validationErrors.bio}
                        placeholder="Tell us about yourself..."
                        inputProps={{
                          maxLength: 500
                        }}
                      />
                      {validationErrors.bio && (
                        <FormHelperText error>
                          {validationErrors.bio}
                        </FormHelperText>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                {/* Social Links */}
                <Box className="info-section">
                  <Typography variant="h6" className="section-title">
                    Social Links
                  </Typography>
                  
                  {/* Primary Social Links */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={profile.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.website}
                        InputProps={{
                          startAdornment: getSocialIcon('website')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.website && (
                        <FormHelperText error>
                          {validationErrors.website}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="LinkedIn"
                        value={profile.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.linkedin}
                        InputProps={{
                          startAdornment: getSocialIcon('linkedin')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.linkedin && (
                        <FormHelperText error>
                          {validationErrors.linkedin}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="GitHub"
                        value={profile.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.github}
                        InputProps={{
                          startAdornment: getSocialIcon('github')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.github && (
                        <FormHelperText error>
                          {validationErrors.github}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Twitter"
                        value={profile.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.twitter}
                        InputProps={{
                          startAdornment: getSocialIcon('twitter')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.twitter && (
                        <FormHelperText error>
                          {validationErrors.twitter}
                        </FormHelperText>
                      )}
                    </Grid>
                  </Grid>

                  {/* Additional Social Media */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Instagram"
                        value={profile.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.instagram}
                        InputProps={{
                          startAdornment: getSocialIcon('instagram')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.instagram && (
                        <FormHelperText error>
                          {validationErrors.instagram}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Facebook"
                        value={profile.facebook}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.facebook}
                        InputProps={{
                          startAdornment: getSocialIcon('facebook')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.facebook && (
                        <FormHelperText error>
                          {validationErrors.facebook}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="YouTube"
                        value={profile.youtube}
                        onChange={(e) => handleInputChange('youtube', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.youtube}
                        InputProps={{
                          startAdornment: getSocialIcon('youtube')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.youtube && (
                        <FormHelperText error>
                          {validationErrors.youtube}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Discord"
                        value={profile.discord}
                        onChange={(e) => handleInputChange('discord', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.discord}
                        InputProps={{
                          startAdornment: getSocialIcon('discord')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.discord && (
                        <FormHelperText error>
                          {validationErrors.discord}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Telegram"
                        value={profile.telegram}
                        onChange={(e) => handleInputChange('telegram', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.telegram}
                        InputProps={{
                          startAdornment: getSocialIcon('telegram')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.telegram && (
                        <FormHelperText error>
                          {validationErrors.telegram}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="WhatsApp"
                        value={profile.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.whatsapp}
                        InputProps={{
                          startAdornment: getSocialIcon('whatsapp')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.whatsapp && (
                        <FormHelperText error>
                          {validationErrors.whatsapp}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Snapchat"
                        value={profile.snapchat}
                        onChange={(e) => handleInputChange('snapchat', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.snapchat}
                        InputProps={{
                          startAdornment: getSocialIcon('snapchat')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.snapchat && (
                        <FormHelperText error>
                          {validationErrors.snapchat}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="TikTok"
                        value={profile.tiktok}
                        onChange={(e) => handleInputChange('tiktok', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.tiktok}
                        InputProps={{
                          startAdornment: getSocialIcon('tiktok')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.tiktok && (
                        <FormHelperText error>
                          {validationErrors.tiktok}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Reddit"
                        value={profile.reddit}
                        onChange={(e) => handleInputChange('reddit', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.reddit}
                        InputProps={{
                          startAdornment: getSocialIcon('reddit')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.reddit && (
                        <FormHelperText error>
                          {validationErrors.reddit}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Twitch"
                        value={profile.twitch}
                        onChange={(e) => handleInputChange('twitch', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.twitch}
                        InputProps={{
                          startAdornment: getSocialIcon('twitch')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.twitch && (
                        <FormHelperText error>
                          {validationErrors.twitch}
                        </FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pinterest"
                        value={profile.pinterest}
                        onChange={(e) => handleInputChange('pinterest', e.target.value)}
                        disabled={!isEditing}
                        error={!!validationErrors.pinterest}
                        InputProps={{
                          startAdornment: getSocialIcon('pinterest')
                        }}
                        inputProps={{
                          maxLength: 200
                        }}
                      />
                      {validationErrors.pinterest && (
                        <FormHelperText error>
                          {validationErrors.pinterest}
                        </FormHelperText>
                      )}
                    </Grid>
                  </Grid>

                  {/* Social Links Preview (when not editing) */}
                  {/* Temporarily commented out to isolate issue
                  {!isEditing && (
                    <Box className="social-links-preview" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                        Active Social Links:
                      </Typography>
                      <Box className="social-links-grid">
                        {Object.entries(profile).map(([key, value]) => {
                          if (['website', 'linkedin', 'github', 'twitter', 'instagram', 'facebook', 'youtube', 'discord', 'telegram', 'whatsapp', 'snapchat', 'tiktok', 'reddit', 'twitch', 'pinterest'].includes(key) && value) {
                            return (
                              <Tooltip key={key} title={`Visit ${getSocialLabel(key)}`}>
                                <Link
                                  href={value.startsWith('http') ? value : `https://${value}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="social-link-chip"
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    textDecoration: 'none',
                                    color: 'primary.main',
                                    '&:hover': {
                                      color: 'primary.dark',
                                      textDecoration: 'underline'
                                    }
                                  }}
                                >
                                  {getSocialIcon(key)}
                                  {getSocialLabel(key)}
                                </Link>
                              </Tooltip>
                            );
                          }
                          return null;
                        })}
                      </Box>
                    </Box>
                  )}
                  */}
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