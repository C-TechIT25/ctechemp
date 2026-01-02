import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Snackbar,
  alpha,
  styled,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Fade,
  Zoom,
  Tooltip,
  LinearProgress,
  Input,
  Stack,
  CardActionArea,
  CardMedia,
  Container,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CameraAlt as CameraIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
  ModeEdit as ModeEditIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../Config';

// Styled Components
const ProfilePaper = styled(Paper)(({ theme }) => ({
  borderRadius: "20px",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92))",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(86, 134, 254, 0.15)",
  boxShadow: `
    0 10px 40px rgba(86, 134, 254, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05)
  `,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #5686fe 0%, #3b6bff 50%, #2196f3 100%)',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
  }
}));

const GradientTypography = styled(Typography)(({ theme }) => ({
  background: "linear-gradient(135deg, #5686fe 0%, #3b6bff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 800,
  letterSpacing: '-0.5px',
}));

const InfoCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  height: "100%",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))",
  border: "1px solid rgba(86, 134, 254, 0.1)",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 4px 20px rgba(86, 134, 254, 0.08)",
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 40px rgba(86, 134, 254, 0.15)",
    borderColor: "rgba(86, 134, 254, 0.3)",
  },
}));

const UploadButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #5686fe 0%, #3b6bff 100%)',
  color: 'white',
  borderRadius: '12px',
  padding: '10px 20px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #3b6bff 0%, #2a56d4 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(86, 134, 254, 0.3)',
  },
  '&:disabled': {
    background: 'rgba(86, 134, 254, 0.2)',
    color: 'rgba(86, 134, 254, 0.5)',
  },
}));

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editData, setEditData] = useState({});
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const auth = getAuth();
  const db = getFirestore();

  // Get user role from Firestore
  const getUserRole = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return '';

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role || 'Employee';
      }
      return 'Employee';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'Employee';
    }
  };

  // Get email from Firebase auth
  const getUserEmail = () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      return user.email;
    } catch (error) {
      console.error('Error getting email from Firebase:', error);
      return '';
    }
  };

  // Fetch user profile from backend using email
// 1. In the fetchUserProfile function, update to handle URL:
const fetchUserProfile = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const userEmail = getUserEmail();
    if (!userEmail) {
      throw new Error('Could not find user email');
    }
    
    setEmail(userEmail);
    
    const role = await getUserRole();
    setUserRole(role);
    
    const encodedEmail = encodeURIComponent(userEmail);
    const response = await fetch(`${API_BASE_URL}profile/${encodedEmail}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }
    
    const result = await response.json();
    setProfile(result.data);
    setEditData(result.data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    setError(error.message || 'Failed to load profile. Please try again.');
    toast.error(error.message || 'Failed to load profile. Please try again.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handle profile picture upload
const handleProfilePictureUpload = async (event) => {
  try {
    setUploading(true);
    setUploadProgress(0);
    const file = event.target.files[0];
    if (!file) return;

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    const formData = new FormData();
    formData.append('profile_img', file);
    
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}profile/image/${encodedEmail}`, {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    setUploadProgress(100);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload profile picture');
    }
    
    const result = await response.json();
    
    // Update local profile with new image URL
    setProfile(prev => ({ 
      ...prev, 
      profile_img: result.data.profile_img,
      profile_img_url: result.data.profile_img_url
    }));
    
    toast.success('Profile picture updated successfully!');
    
    setTimeout(() => setUploadProgress(0), 1000);
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    toast.error(error.message || 'Failed to upload profile picture');
    setUploadProgress(0);
  } finally {
    setUploading(false);
  }
};


  // Remove profile picture
const handleRemoveProfilePicture = async () => {
  try {
    setUploading(true);
    
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}profile/image/${encodedEmail}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove profile picture');
    }
    
    const result = await response.json();
    
    // Update local profile
    setProfile(prev => ({ 
      ...prev, 
      profile_img: null,
      profile_img_url: null
    }));
    
    toast.success('Profile picture removed successfully!');
  } catch (error) {
    console.error('Error removing profile picture:', error);
    toast.error(error.message || 'Failed to remove profile picture');
  } finally {
    setUploading(false);
  }
};
  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      // Update backend using email
      const encodedEmail = encodeURIComponent(email);
      const response = await fetch(`${API_BASE_URL}profile/${encodedEmail}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const result = await response.json();
      
      // Update local profile
      setProfile(prev => ({ ...prev, ...editData }));
      setOpenEditDialog(false);
      
      toast.success('Profile updated successfully!');
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !profile) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress 
          size={60} 
          sx={{ 
            color: '#5686fe',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography variant="body1" color="text.secondary">
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Fade in={true}>
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.2)',
            }}
            icon={<ErrorIcon />}
          >
            <Typography variant="body1" fontWeight="medium">
              {error}
            </Typography>
          </Alert>
        </Box>
      </Fade>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No profile data found.
        </Typography>
      </Box>
    );
  }

  const isAdmin = userRole === 'Admin';

  return (
    <>
      <ToastContainer />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Zoom in={true}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 6,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <GradientTypography variant="h3" gutterBottom>
                My Profile
              </GradientTypography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                View and manage your professional information and personal details
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
                label={userRole}
                color={isAdmin ? "primary" : "default"}
                variant="outlined"
                sx={{
                  borderWidth: '2px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              />
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setOpenEditDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #5686fe 0%, #3b6bff 100%)',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3b6bff 0%, #2a56d4 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(86, 134, 254, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Edit Profile
              </Button>
            </Stack>
          </Box>
        </Zoom>

        {/* Profile Header Card */}
        <Fade in={true} timeout={800}>
          <ProfilePaper sx={{ p: 4, mb: 6 }}>
            <Grid container spacing={4} alignItems="center">
              {/* Profile Picture */}
              <Grid item xs={12} md={3}>
                <Box sx={{ 
                  position: 'relative', 
                  display: 'inline-block',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      isAdmin && (
                        <Tooltip title="Admin User">
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '3px solid white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                          >
                            <SecurityIcon sx={{ color: 'white', fontSize: 18 }} />
                          </Box>
                        </Tooltip>
                      )
                    }
                  >
                  <Avatar
  src={profile.profile_img || profile.profile_img_url}  // Use URL directly
  sx={{
    width: 160,
    height: 160,
    border: '4px solid #5686fe',
    bgcolor: (profile.profile_img || profile.profile_img_url) ? 'transparent' : 'linear-gradient(135deg, #5686fe 0%, #3b6bff 100%)',
    fontSize: '4rem',
    fontWeight: 700,
    boxShadow: '0 8px 32px rgba(86, 134, 254, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 12px 48px rgba(86, 134, 254, 0.4)',
    },
  }}
>
  {!(profile.profile_img || profile.profile_img_url) && (profile.employee_name?.charAt(0) || 'U')}
</Avatar>
                  </Badge>

                  {/* Upload Controls - Only for Admin */}
                  {isAdmin && (
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-picture-upload"
                        type="file"
                        onChange={handleProfilePictureUpload}
                        disabled={uploading}
                      />
                      <label htmlFor="profile-picture-upload">
                        <UploadButton
                          component="span"
                          fullWidth
                          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CameraIcon />}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload Photo'}
                        </UploadButton>
                      </label>
                      
                      {uploading && uploadProgress > 0 && (
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress} 
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #5686fe 0%, #3b6bff 100%)',
                                borderRadius: 4,
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 0.5 }}>
                            {uploadProgress}%
                          </Typography>
                        </Box>
                      )}
                      
                      {profile.profile_img && (
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={handleRemoveProfilePicture}
                          disabled={uploading}
                          sx={{
                            borderColor: 'error.main',
                            color: 'error.main',
                            borderRadius: '12px',
                            py: 1,
                            '&:hover': {
                              borderColor: 'error.dark',
                              background: 'rgba(244, 67, 54, 0.04)',
                            }
                          }}
                        >
                          Remove Photo
                        </Button>
                      )}
                    </Box>
                  )}
                  
                  {!isAdmin && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Profile photo can only be changed by Admin
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Basic Info */}
              <Grid item xs={12} md={9}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a237e' }}>
                    {profile.employee_name || 'Unknown User'}
                    {isAdmin && (
                      <Chip
                        label="Admin"
                        color="primary"
                        size="small"
                        sx={{ ml: 2, fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    )}
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    {profile.email || 'No email available'}
                  </Typography>
                  
                  <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: 'wrap', gap: 1.5 }}>
                    <Chip 
                      icon={<BadgeIcon />} 
                      label={`ID: ${profile.emp_id || 'N/A'}`} 
                      variant="outlined"
                      sx={{ 
                        borderColor: 'rgba(86, 134, 254, 0.3)',
                        color: '#5686fe',
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          color: '#5686fe',
                        }
                      }}
                    />
                    <Chip 
                      icon={<WorkIcon />} 
                      label={profile.designation || 'N/A'} 
                      variant="outlined"
                      sx={{ 
                        borderColor: 'rgba(86, 134, 254, 0.3)',
                        color: '#5686fe',
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          color: '#5686fe',
                        }
                      }}
                    />
                    <Chip 
                      icon={<BusinessIcon />} 
                      label={profile.department || 'N/A'} 
                      variant="outlined"
                      sx={{ 
                        borderColor: 'rgba(86, 134, 254, 0.3)',
                        color: '#5686fe',
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          color: '#5686fe',
                        }
                      }}
                    />
                    <Chip 
                      icon={<VerifiedIcon />} 
                      label={`${profile.total_hours || 0} Total Hours`} 
                      variant="outlined"
                      sx={{ 
                        borderColor: 'rgba(86, 134, 254, 0.3)',
                        color: '#5686fe',
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          color: '#5686fe',
                        }
                      }}
                    />
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </ProfilePaper>
        </Fade>

        {/* Profile Details */}
        <Grid container spacing={4}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <InfoCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PersonIcon sx={{ fontSize: 28, color: '#5686fe', mr: 1.5 }} />
                    <Typography variant="h5" fontWeight="bold" color="#1a237e">
                      Personal Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(86, 134, 254, 0.1)' }} />
                  
                  <Grid container spacing={3}>
                    {[
                      { label: 'Employee ID', value: profile.emp_id, icon: <BadgeIcon /> },
                      { label: 'Full Name', value: profile.employee_name, icon: <PersonIcon /> },
                      { label: 'Gender', value: profile.gender || 'Not specified', icon: <PersonIcon /> },
                      { label: 'Email', value: profile.email, icon: <EmailIcon /> },
                      { label: 'Joining Date', value: formatDate(profile.date_of_joining), icon: <CalendarIcon /> },
                      { label: 'Work Mode', value: profile.work_mode, icon: <WorkIcon /> },
                    ].map((item, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          background: 'rgba(86, 134, 254, 0.03)',
                          border: '1px solid rgba(86, 134, 254, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(86, 134, 254, 0.06)',
                            borderColor: 'rgba(86, 134, 254, 0.2)',
                          }
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5 
                          }}>
                            {React.cloneElement(item.icon, { sx: { fontSize: 14 } })}
                            {item.label}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {item.value || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </InfoCard>
            </Zoom>
          </Grid>

          {/* Professional Information */}
          <Grid item xs={12} md={6}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <InfoCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <WorkIcon sx={{ fontSize: 28, color: '#5686fe', mr: 1.5 }} />
                    <Typography variant="h5" fontWeight="bold" color="#1a237e">
                      Professional Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(86, 134, 254, 0.1)' }} />
                  
                  <Grid container spacing={3}>
                    {[
                      { label: 'Designation', value: profile.designation, icon: <WorkIcon /> },
                      { label: 'Department', value: profile.department, icon: <BusinessIcon /> },
                      { label: 'Work Mode', value: profile.work_mode, icon: <WorkIcon /> },
                      { label: 'Joining Date', value: formatDate(profile.date_of_joining), icon: <CalendarIcon /> },
                      { label: 'Total Hours', value: `${profile.total_hours || 0} hours`, icon: <AccessTimeIcon /> },
                      { label: 'Employment Status', value: 'Active', icon: <CheckCircleIcon />, color: 'success.main' },
                    ].map((item, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          background: 'rgba(86, 134, 254, 0.03)',
                          border: '1px solid rgba(86, 134, 254, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(86, 134, 254, 0.06)',
                            borderColor: 'rgba(86, 134, 254, 0.2)',
                          }
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5 
                          }}>
                            {React.cloneElement(item.icon, { 
                              sx: { 
                                fontSize: 14,
                                color: item.color || '#5686fe'
                              } 
                            })}
                            {item.label}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight="medium"
                            sx={{ color: item.color || 'inherit' }}
                          >
                            {item.value || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </InfoCard>
            </Zoom>
          </Grid>
        </Grid>

        {/* Edit Profile Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))',
              boxShadow: '0 20px 60px rgba(86, 134, 254, 0.2)',
            }
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Typography variant="h5" fontWeight="bold" color="#1a237e">
              Edit Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your personal information
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={editData.employee_name || ''}
                onChange={(e) => handleEditChange('employee_name', e.target.value)}
                margin="normal"
                InputProps={{
                  sx: {
                    borderRadius: '12px',
                    background: 'rgba(86, 134, 254, 0.03)',
                  }
                }}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={editData.gender || ''}
                  label="Gender"
                  onChange={(e) => handleEditChange('gender', e.target.value)}
                  sx={{
                    borderRadius: '12px',
                    background: 'rgba(86, 134, 254, 0.03)',
                  }}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setOpenEditDialog(false)}
              sx={{
                color: '#5686fe',
                borderColor: '#5686fe',
                borderRadius: '12px',
                px: 3,
                '&:hover': {
                  borderColor: '#3b6bff',
                  bgcolor: 'rgba(86, 134, 254, 0.05)'
                }
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #5686fe 0%, #3b6bff 100%)',
                color: 'white',
                borderRadius: '12px',
                px: 4,
                '&:hover': {
                  background: 'linear-gradient(135deg, #3b6bff 0%, #2a56d4 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(86, 134, 254, 0.3)',
                },
                '&:disabled': {
                  background: 'rgba(86, 134, 254, 0.2)',
                  color: 'rgba(86, 134, 254, 0.5)',
                },
                transition: 'all 0.3s ease',
              }}
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
            icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}