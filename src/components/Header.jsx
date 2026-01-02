import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
} from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../Config";
import {
  Menu as MenuIcon,
  CalendarMonth,
  ExitToApp,
  Person,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle,
  Warning,
  Info,
  ArrowForward,
  MarkEmailRead as MarkEmailReadIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Config";

export default function Header({ onMenuClick }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [now, setNow] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

  // Fetch user profile data
  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      const user = auth.currentUser;
      if (!user) return;

      const userEmail = user.email;
      if (!userEmail) return;

      // Call backend API to get profile data using email
      const encodedEmail = encodeURIComponent(userEmail);
      const response = await fetch(`${API_BASE_URL}profile/${encodedEmail}`);
      
      if (!response.ok) {
        console.error('Failed to fetch profile');
        return;
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setProfileData(result.data);
        // Use profile_img (URL) or profile_img_url (URL) from backend
        const imageUrl = result.data.profile_img || result.data.profile_img_url;
        if (imageUrl) {
          setProfileImage(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    
    // Fetch profile data when component mounts
    if (auth.currentUser) {
      fetchProfileData();
    }
    
    return () => clearInterval(interval);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProfileData();
      } else {
        setProfileImage(null);
        setProfileData(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await signOut(auth);
  };

  const handleGoToNotificationsPage = () => {
    navigate('/notifications');
    handleNotificationMenuClose();
  };


  const userName = profileData?.employee_name || auth.currentUser?.displayName || auth.currentUser?.email || 'User';

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!userName || userName === 'User') return 'U';
    return userName.charAt(0).toUpperCase();
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#2196F3',
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 20px rgba(33, 150, 243, 0.15)",
          ml: { sm: '280px' },
          width: { sm: `calc(100% - 280px)` },
          backdropFilter: "blur(10px)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.05)",
          }
        }}
      >
        <Toolbar sx={{ position: "relative", zIndex: 1 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuClick}
              sx={{ 
                mr: 2,
                background: "rgba(255, 255, 255, 0.15)",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.25)",
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Left side: Title */}
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: isSmall ? '0.9rem' : '1.1rem',
            }}
          >
            C-Tech Employee Work Management
          </Typography>

          {/* Right side: User Info and Notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notification Bell */}
            <IconButton
              color="inherit"
              onClick={handleGoToNotificationsPage}
              sx={{
                position: 'relative',
                background: "rgba(255, 255, 255, 0.15)",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.25)",
                },
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.7)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 10px rgba(255, 255, 255, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)',
                  },
                }
              }}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    animation: unreadCount > 0 ? 'bounce 1s infinite' : 'none',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-3px)' },
                    }
                  }
                }}
              >
                {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
              </Badge>
            </IconButton>

            {/* User Info */}
            {!isSmall && (
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                  {profileData?.employee_name || profileData?.designation || 'Profile'}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  {profileData?.department || (unreadCount > 0 ? `${unreadCount} unread alerts` : 'Welcome back')}
                </Typography>
              </Box>
            )}
            
            {/* User Profile */}
            <IconButton
              size="small"
              edge="end"
              onClick={handleProfileMenuOpen}
              sx={{
                border: "2px solid rgba(255, 255, 255, 0.3)",
                padding: "2px",
                transition: "all 0.3s ease",
                "&:hover": {
                  border: "2px solid white",
                  transform: "scale(1.05)",
                }
              }}
            >
              {loadingProfile ? (
                <CircularProgress 
                  size={36} 
                  sx={{ 
                    color: 'white',
                    padding: '6px'
                  }} 
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    background: profileImage ? 'transparent' : "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    border: profileImage ? '2px solid rgba(255, 255, 255, 0.8)' : 'none',
                  }}
                  // Use the URL directly - no need for base64 conversion
                  src={profileImage || undefined}
                >
                  {!profileImage && getUserInitials()}
                </Avatar>
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 400,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            boxShadow: "0 8px 32px rgba(33, 150, 243, 0.15)",
            border: "1px solid rgba(33, 150, 243, 0.1)",
            "& .MuiMenuItem-root": {
              py: 1.5,
              "&:hover": {
                backgroundColor: "rgba(33, 150, 243, 0.05)",
              },
            },
          },
        }}
      >
        {/* User Info */}
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(0, 0, 0, 0.08)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {loadingProfile ? (
              <CircularProgress size={40} sx={{ color: '#2196F3' }} />
            ) : (
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  background: profileImage ? 'transparent' : "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(33, 150, 243, 0.2)",
                  border: profileImage ? '2px solid rgba(33, 150, 243, 0.3)' : 'none',
                }}
                // Use the URL directly
                src={profileImage || undefined}
              >
                {!profileImage && getUserInitials()}
              </Avatar>
            )}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1565C0" }}>
                {userName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {profileData?.designation || 'Employee'} • {profileData?.department || 'Department'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                ID: {profileData?.emp_id || 'N/A'} • {unreadCount} unread notifications
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={() => {
          handleProfileMenuClose();
          navigate('/notifications');
        }}>
          <ListItemIcon>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon fontSize="small" color="primary" />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Notifications" 
            secondary={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          />
        </MenuItem>

        <MenuItem onClick={() => {
          handleProfileMenuClose();
          navigate('/profile');
        }}>
          <ListItemIcon>
            <Person fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="My Profile" 
            secondary="View and edit your profile"
          />
        </MenuItem>

        
        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={handleLogout} 
          sx={{ 
            color: "#d32f2f",
            "&:hover": {
              backgroundColor: "rgba(211, 47, 47, 0.05)",
            }
          }}
        >
          <ListItemIcon>
            <ExitToApp fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ fontWeight: 600 }}
            secondary="Sign out of your account"
          />
        </MenuItem>
      </Menu>

      {/* Spacer for content below AppBar */}
      <Toolbar />
    </>
  );
}