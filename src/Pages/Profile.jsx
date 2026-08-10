import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Grid,
  Avatar,
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
  Tooltip,
  LinearProgress,
  Stack,
  Badge,
  GlobalStyles,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CameraAlt as CameraIcon,
  Badge as BadgeIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../Config';

// ---------------------------------------------------------------------------
// Shared design tokens — same palette/type used across Todo, Timesheet,
// Header, Sidebar and Notifications. Worth lifting into a single
// `theme/tokens.js` file so all pages stay in lockstep.
// ---------------------------------------------------------------------------
const COLORS = {
  primary: "#0EA5E9",
  primaryDark: "#0EA5E9",
  primarySoft: "#EEF2FF",
  ink: "#1E1B2E",
  muted: "#6B7280",
  faint: "#9CA3AF",
  surface: "#FFFFFF",
  bg: "#F6F7FB",
  border: "rgba(30,27,46,0.08)",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#0EA5E9",
};

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
`;

const Shell = styled(Box)({ fontFamily: "'Inter', sans-serif" });
const Display = styled('span')({ fontFamily: "'Outfit', sans-serif" });

const Surface = styled(Paper)({
  borderRadius: 20,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.04)',
});

const GradientButton = styled(Button)({
  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
  color: 'white',
  borderRadius: 12,
  padding: '10px 22px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 14px rgba(79,70,229,0.30)',
  '&:hover': {
    background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primaryDark} 100%)`,
    boxShadow: '0 6px 18px rgba(79,70,229,0.40)',
  },
  '&.Mui-disabled': { color: 'rgba(255,255,255,0.7)' },
});

const InfoCard = styled(Card)({
  borderRadius: 20,
  height: '100%',
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.04)',
  transition: 'all 0.25s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 28px rgba(16,24,40,0.08)',
    borderColor: alpha(COLORS.primary, 0.25),
  },
});

// Radial progress ring — same signature visual as the rest of the app,
// here used to show how complete the profile's information is.
const RadialProgress = ({ value = 0, size = 108, stroke = 11, color = COLORS.primary }) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(color, 0.12)} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.ink, lineHeight: 1 }}>
          <Display>{Math.round(value)}%</Display>
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.muted, fontSize: '0.62rem' }}>
          complete
        </Typography>
      </Box>
    </Box>
  );
};

const StatTile = ({ label, value, color, icon }) => (
  <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha(color, 0.06), borderLeft: `3px solid ${color}`, minWidth: 130, flex: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color }} noWrap>
        <Display>{value}</Display>
      </Typography>
      <Box sx={{ color, opacity: 0.85, display: 'flex' }}>{icon}</Box>
    </Box>
    <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

const FieldBox = ({ label, value, icon, color }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2.5,
      background: alpha(color || COLORS.primary, 0.04),
      border: `1px solid ${alpha(color || COLORS.primary, 0.14)}`,
      transition: 'all 0.2s ease',
      '&:hover': { background: alpha(color || COLORS.primary, 0.07), borderColor: alpha(color || COLORS.primary, 0.25) },
    }}
  >
    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.5, color: COLORS.muted }}>
      {React.cloneElement(icon, { sx: { fontSize: 14, color: color || COLORS.primary } })}
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, color: color || COLORS.ink }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

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
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
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
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile picture');
      }

      const result = await response.json();

      setProfile((prev) => ({
        ...prev,
        profile_img: result.data.profile_img,
        profile_img_url: result.data.profile_img_url,
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
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove profile picture');
      }

      setProfile((prev) => ({
        ...prev,
        profile_img: null,
        profile_img_url: null,
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
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const encodedEmail = encodeURIComponent(email);
      const response = await fetch(`${API_BASE_URL}profile/${encodedEmail}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await response.json();

      setProfile((prev) => ({ ...prev, ...editData }));
      setOpenEditDialog(false);

      toast.success('Profile updated successfully!');
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update profile',
        severity: 'error',
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
      day: 'numeric',
    });
  };

  if (loading && !profile) {
    return (
      <LocalizedLoading />
    );
  }

  if (error) {
    return (
      <Fade in>
        <Box sx={{ p: 3, bgcolor: COLORS.bg, minHeight: '100vh' }}>
          <GlobalStyles styles={fontImport} />
          <Alert
            severity="error"
            sx={{ borderRadius: 2.5, boxShadow: '0 4px 20px rgba(239,68,68,0.1)', border: `1px solid ${alpha(COLORS.danger, 0.25)}` }}
            icon={<ErrorIcon />}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {error}
            </Typography>
          </Alert>
        </Box>
      </Fade>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: COLORS.bg, minHeight: '100vh' }}>
        <GlobalStyles styles={fontImport} />
        <Typography variant="h6" sx={{ color: COLORS.muted }}>
          No profile data found.
        </Typography>
      </Box>
    );
  }

  const isAdmin = userRole === 'Admin';
  const profileImageSrc = profile.profile_img || profile.profile_img_url;

  // Profile completeness — used by the overview ring.
  const completenessFields = ['employee_name', 'email', 'designation', 'department', 'gender', 'work_mode', 'profile_img'];
  const filledFields = completenessFields.filter((f) => !!profile[f]).length;
  const completeness = (filledFields / completenessFields.length) * 100;

  return (
    <>
      <GlobalStyles styles={fontImport} />
      <ToastContainer />
      <Shell sx={{ px: { xs: 2, sm: 4 }, py: 4, bgcolor: COLORS.bg, minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: COLORS.ink }}>
              <Display>My profile</Display>
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.muted, mt: 0.5, maxWidth: 520 }}>
              View and manage your professional information and personal details.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
              label={userRole}
              variant="outlined"
              sx={{ borderWidth: '1.5px', fontWeight: 700, borderColor: isAdmin ? alpha(COLORS.danger, 0.4) : alpha(COLORS.primary, 0.4), color: isAdmin ? COLORS.danger : COLORS.primary }}
            />
            <GradientButton startIcon={<EditIcon />} onClick={() => setOpenEditDialog(true)}>
              Edit profile
            </GradientButton>
          </Stack>
        </Box>

        {/* Profile Overview Card */}
        <Fade in timeout={500}>
          <Surface sx={{ p: { xs: 2.5, sm: 4 }, mb: 4 }}>
            <Grid container spacing={4} alignItems="center">
              {/* Profile Picture */}
              <Grid item xs={12} md={3}>
                <Box sx={{ position: 'relative', display: 'inline-block', width: '100%', textAlign: 'center' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      isAdmin && (
                        <Tooltip title="Admin user">
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${COLORS.danger} 0%, #B91C1C 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '3px solid white',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                          >
                            <SecurityIcon sx={{ color: 'white', fontSize: 17 }} />
                          </Box>
                        </Tooltip>
                      )
                    }
                  >
                    <Avatar
                      src={profileImageSrc}
                      sx={{
                        width: 150,
                        height: 150,
                        border: `4px solid ${COLORS.primary}`,
                        background: profileImageSrc ? 'transparent' : `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
                        fontSize: '3.6rem',
                        fontWeight: 700,
                        boxShadow: `0 8px 28px ${alpha(COLORS.primary, 0.3)}`,
                        transition: 'all 0.3s ease',
                        cursor: profileImageSrc ? 'pointer' : 'default',
                        '&:hover': { transform: 'scale(1.04)', boxShadow: `0 12px 36px ${alpha(COLORS.primary, 0.4)}` },
                      }}
                      onClick={() => profileImageSrc && setImagePreviewOpen(true)}
                    >
                      {!profileImageSrc && (profile.employee_name?.charAt(0) || 'U')}
                    </Avatar>
                  </Badge>

                  {/* Upload Controls - Only for Admin */}
                  {isAdmin && (
                    <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <input accept="image/*" style={{ display: 'none' }} id="profile-picture-upload" type="file" onChange={handleProfilePictureUpload} disabled={uploading} />
                      <label htmlFor="profile-picture-upload">
                        <GradientButton component="span" fullWidth startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CameraIcon />} disabled={uploading}>
                          {uploading ? 'Uploading…' : 'Upload photo'}
                        </GradientButton>
                      </label>

                      {uploading && uploadProgress > 0 && (
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={uploadProgress}
                            sx={{ height: 7, borderRadius: 4, bgcolor: alpha(COLORS.primary, 0.12), '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, borderRadius: 4 } }}
                          />
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: 'block', textAlign: 'center', mt: 0.5 }}>
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
                          sx={{ borderColor: alpha(COLORS.danger, 0.4), color: COLORS.danger, borderRadius: '12px', py: 1, textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: COLORS.danger, background: alpha(COLORS.danger, 0.05) } }}
                        >
                          Remove photo
                        </Button>
                      )}
                    </Box>
                  )}

                  {!isAdmin && (
                    <Typography variant="caption" sx={{ color: COLORS.faint, display: 'block', mt: 2 }}>
                      Profile photo can only be changed by an admin.
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                    <Display>{profile.employee_name || 'Unknown user'}</Display>
                    {isAdmin && <Chip label="Admin" size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: alpha(COLORS.danger, 0.1), color: COLORS.danger }} />}
                  </Typography>

                  <Typography variant="body1" sx={{ color: COLORS.muted, display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <EmailIcon fontSize="small" />
                    {profile.email || 'No email available'}
                  </Typography>

                  <Stack direction="row" spacing={1.25} sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1.25 }}>
                    <Chip icon={<BadgeIcon />} label={`ID: ${profile.emp_id || 'N/A'}`} variant="outlined" sx={{ borderColor: alpha(COLORS.primary, 0.3), color: COLORS.primary, fontWeight: 600, '& .MuiChip-icon': { color: COLORS.primary } }} />
                    <Chip icon={<WorkIcon />} label={profile.designation || 'N/A'} variant="outlined" sx={{ borderColor: alpha(COLORS.primary, 0.3), color: COLORS.primary, fontWeight: 600, '& .MuiChip-icon': { color: COLORS.primary } }} />
                    <Chip icon={<BusinessIcon />} label={profile.department || 'N/A'} variant="outlined" sx={{ borderColor: alpha(COLORS.primary, 0.3), color: COLORS.primary, fontWeight: 600, '& .MuiChip-icon': { color: COLORS.primary } }} />
                  </Stack>
                </Box>
              </Grid>

              {/* Quick stats */}
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: { xs: 'center', md: 'flex-end' }, flexWrap: 'wrap'}}>
                  <RadialProgress value={completeness} color={COLORS.primary} />
                  <Stack spacing={1} sx={{ minWidth: 130 }}>
                    <StatTile label="Total hours" value={profile.total_hours || 0} color={COLORS.info} icon={<AccessTimeIcon fontSize="small" />} />
                    <StatTile label="Joined" value={formatDate(profile.date_of_joining)} color={COLORS.success} icon={<CalendarIcon fontSize="small" />} />
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Surface>
        </Fade>

        {/* Profile Details */}
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}width={'100%'}>
            <Fade in timeout={600}>
              <InfoCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: alpha(COLORS.primary, 0.1), display: 'flex' }}>
                      <PersonIcon sx={{ fontSize: 22, color: COLORS.primary }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: COLORS.ink }}>
                      <Display>Personal information</Display>
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

                  <Grid container spacing={2}>
                    {[
                      { label: 'Employee ID', value: profile.emp_id, icon: <BadgeIcon /> },
                      { label: 'Full name', value: profile.employee_name, icon: <PersonIcon /> },
                      { label: 'Gender', value: profile.gender || 'Not specified', icon: <PersonIcon /> },
                      { label: 'Email', value: profile.email, icon: <EmailIcon /> },
                      { label: 'Joining date', value: formatDate(profile.date_of_joining), icon: <CalendarIcon /> },
                      { label: 'Work mode', value: profile.work_mode, icon: <WorkIcon /> },
                    ].map((item, index) => (
                      <Grid item xs={12} sm={6} key={index}width={'30%'}>
                        <FieldBox {...item} />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </InfoCard>
            </Fade>
          </Grid>

          {/* Professional Information */}
          <Grid item xs={12} md={6}width={'100%'}>
            <Fade in timeout={700}>
              <InfoCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: alpha(COLORS.primary, 0.1), display: 'flex' }}>
                      <WorkIcon sx={{ fontSize: 22, color: COLORS.primary }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: COLORS.ink }}>
                      <Display>Professional information</Display>
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

                  <Grid container spacing={2}>
                    {[
                      { label: 'Designation', value: profile.designation, icon: <WorkIcon /> },
                      { label: 'Department', value: profile.department, icon: <BusinessIcon /> },
                      { label: 'Work mode', value: profile.work_mode, icon: <WorkIcon /> },
                      { label: 'Joining date', value: formatDate(profile.date_of_joining), icon: <CalendarIcon /> },
                      { label: 'Total hours', value: `${profile.total_hours || 0} hours`, icon: <AccessTimeIcon /> },
                      { label: 'Employment status', value: 'Active', icon: <CheckCircleIcon />, color: COLORS.success },
                    ].map((item, index) => (
                      <Grid item xs={12} sm={6} key={index}width={'30%'}>
                        <FieldBox {...item} />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </InfoCard>
            </Fade>
          </Grid>
        </Grid>

        {/* Edit Profile Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)' } }}>
          <Box sx={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: 'white', p: 3 }}>
            <DialogTitle sx={{ p: 0, color: 'white', fontWeight: 700 }}>
              <Display>Edit profile</Display>
            </DialogTitle>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Update your personal information.
            </Typography>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Full name"
                value={editData.employee_name || ''}
                onChange={(e) => handleEditChange('employee_name', e.target.value)}
                margin="normal"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Gender</InputLabel>
                <Select value={editData.gender || ''} label="Gender" onChange={(e) => handleEditChange('gender', e.target.value)} sx={{ borderRadius: '12px' }}>
                  <MenuItem value="">Select gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>

          <Box sx={{ p: 2, bgcolor: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }}>
            <DialogActions sx={{ p: 0 }}>
              <Button
                onClick={() => setOpenEditDialog(false)}
                variant="outlined"
                sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: '10px', px: 3, textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) } }}
              >
                Cancel
              </Button>
              <GradientButton onClick={handleSaveProfile} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}>
                {loading ? 'Saving…' : 'Save changes'}
              </GradientButton>
            </DialogActions>
          </Box>
        </Dialog>


        <Dialog
          open={imagePreviewOpen}
          onClose={() => setImagePreviewOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', bgcolor: COLORS.surface } }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>
              <Display>{profile.employee_name || 'Profile photo'}</Display>
            </Typography>
            <IconButton onClick={() => setImagePreviewOpen(false)} size="small" sx={{ color: COLORS.muted }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: 0, bgcolor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profileImageSrc && (
              <Box
                component="img"
                src={profileImageSrc}
                alt={`${profile.employee_name || 'Profile'} photo`}
                sx={{ width: '100%', maxHeight: '78vh', objectFit: 'contain' }}
              />
            )}
          </DialogContent>
        </Dialog>
        {/* Snackbar for notifications */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 32px rgba(16,24,40,0.12)' }}
            icon={snackbar.severity === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Shell>
    </>
  );
}

// Loading state kept as a small separate component so the font import and
// background still apply before `profile` has loaded.
function LocalizedLoading() {
  return (
    <>
      <GlobalStyles styles={fontImport} />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 2, bgcolor: COLORS.bg }}>
        <CircularProgress size={56} thickness={4} sx={{ color: COLORS.primary }} />
        <Typography variant="body1" sx={{ color: COLORS.muted, fontWeight: 500 }}>
          Loading your profile…
        </Typography>
      </Box>
    </>
  );
}