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
  Tooltip,
  Button,
  GlobalStyles,
  alpha,
} from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../Config";
import {
  Menu as MenuIcon,
  ExitToApp,
  Person,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CloudDone,
  CloudOff,
  Sync,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Config";

// ---------------------------------------------------------------------------
// Shared design tokens — same palette/type used across Todo, Timesheet,
// Header and Sidebar. Worth lifting into a single `theme/tokens.js` file.
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

const Display = ({ children, sx = {} }) => (
  <Box component="span" sx={{ fontFamily: "'Outfit', sans-serif", ...sx }}>
    {children}
  </Box>
);

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
  const [apiStatus, setApiStatus] = useState("checking");
  const [lastApiCheckedAt, setLastApiCheckedAt] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

  const checkApiStatus = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      setApiStatus("checking");
      const currentEmail = auth.currentUser?.email;
      const statusUrl = currentEmail
        ? `${API_BASE_URL}profile/${encodeURIComponent(currentEmail)}`
        : API_BASE_URL;

      const response = await fetch(statusUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      setApiStatus(response.status >= 500 ? "offline" : "online");
    } catch (error) {
      setApiStatus("offline");
    } finally {
      clearTimeout(timeoutId);
      setLastApiCheckedAt(new Date());
    }
  };

  const apiStatusConfig = {
    online: {
      label: "API Online",
      color: COLORS.success,
      icon: <CloudDone fontSize="small" />,
      tooltip: "API is working",
    },
    offline: {
      label: "API Offline",
      color: COLORS.danger,
      icon: <CloudOff fontSize="small" />,
      tooltip: "API is not responding",
    },
    checking: {
      label: "Checking API",
      color: COLORS.warning,
      icon: <Sync fontSize="small" />,
      tooltip: "Checking API status",
    },
  };

  const currentApiStatus = apiStatusConfig[apiStatus];
  const apiStatusTooltip = lastApiCheckedAt
    ? `${currentApiStatus.tooltip}. Last checked ${lastApiCheckedAt.toLocaleTimeString()}`
    : currentApiStatus.tooltip;

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
        checkApiStatus();
      } else {
        setProfileImage(null);
        setProfileData(null);
        setApiStatus("checking");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
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
      <GlobalStyles styles={fontImport} />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 20px rgba(79, 70, 229, 0.25)",
          ml: { sm: '280px' },
          width: { sm: `calc(100% - 280px)` },
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
                background: "rgba(255, 255, 255, 0.12)",
                "&:hover": { background: "rgba(255, 255, 255, 0.2)" },
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
              letterSpacing: "-0.3px",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: isSmall ? '0.9rem' : '1.1rem',
            }}
          >
            <Display>C-Tech Employee Work Management</Display>
          </Typography>

          {/* Right side: User Info and Notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={apiStatusTooltip} arrow>
              <Button
                type="button"
                onClick={checkApiStatus}
                startIcon={currentApiStatus.icon}
                sx={{
                  minWidth: { xs: 42, sm: 132 },
                  height: 40,
                  px: { xs: 1, sm: 1.5 },
                  borderRadius: "999px",
                  color: currentApiStatus.color,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  background: 'white',
                  border: `1px solid ${alpha(currentApiStatus.color, 0.45)}`,
                  whiteSpace: "nowrap",
                  "& .MuiButton-startIcon": {
                    mr: { xs: 0, sm: 0.75 },
                    color: currentApiStatus.color,
                  },
                  "&:hover": {
                    background: alpha(currentApiStatus.color, 0.32),
                    borderColor: alpha(currentApiStatus.color, 0.7),
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {currentApiStatus.label}
                </Box>
              </Button>
            </Tooltip>

            {/* Notification Bell */}
            <IconButton
              color="inherit"
              onClick={handleGoToNotificationsPage}
              sx={{
                position: 'relative',
                background: "rgba(255, 255, 255, 0.12)",
                "&:hover": { background: "rgba(255, 255, 255, 0.2)" },
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.6)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(255, 255, 255, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)' },
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    backgroundColor: COLORS.danger,
                    animation: unreadCount > 0 ? 'bounce 1s infinite' : 'none',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-3px)' },
                    },
                  },
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
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.78)" }}>
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
                transition: "all 0.2s ease",
                "&:hover": { border: "2px solid white", transform: "scale(1.05)" },
              }}
            >
              {loadingProfile ? (
                <CircularProgress size={36} sx={{ color: 'white', padding: '6px' }} />
              ) : (
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    background: profileImage ? 'transparent' : `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    border: profileImage ? '2px solid rgba(255, 255, 255, 0.8)' : 'none',
                  }}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 380,
            borderRadius: "16px",
            background: COLORS.surface,
            boxShadow: "0 12px 36px rgba(79, 70, 229, 0.18)",
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
            "& .MuiMenuItem-root": {
              py: 1.5,
              "&:hover": { backgroundColor: alpha(COLORS.primary, 0.06) },
            },
          },
        }}
      >
        {/* User Info */}
        <Box sx={{ p: 2.25, background: alpha(COLORS.primary, 0.05), borderBottom: `1px solid ${COLORS.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {loadingProfile ? (
              <CircularProgress size={40} sx={{ color: COLORS.primary }} />
            ) : (
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: profileImage ? 'transparent' : `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
                  fontWeight: 700,
                  boxShadow: `0 4px 12px ${alpha(COLORS.primary, 0.25)}`,
                  border: profileImage ? `2px solid ${alpha(COLORS.primary, 0.3)}` : 'none',
                }}
                src={profileImage || undefined}
              >
                {!profileImage && getUserInitials()}
              </Avatar>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: COLORS.ink }} noWrap>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.muted }}>
                {profileData?.designation || 'Employee'} • {profileData?.department || 'Department'}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.muted, display: 'block' }}>
                ID: {profileData?.emp_id || 'N/A'} • {unreadCount} unread notifications
              </Typography>
            </Box>
          </Box>
        </Box>

        <MenuItem
          onClick={() => {
            handleProfileMenuClose();
            navigate('/notifications');
          }}
        >
          <ListItemIcon>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon fontSize="small" sx={{ color: COLORS.primary }} />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Notifications" secondary={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleProfileMenuClose();
            navigate('/profile');
          }}
        >
          <ListItemIcon>
            <Person fontSize="small" sx={{ color: COLORS.primary }} />
          </ListItemIcon>
          <ListItemText primary="My profile" secondary="View and edit your profile" />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ color: COLORS.danger, "&:hover": { backgroundColor: alpha(COLORS.danger, 0.06) } }}
        >
          <ListItemIcon>
            <ExitToApp fontSize="small" sx={{ color: COLORS.danger }} />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} secondary="Sign out of your account" />
        </MenuItem>
      </Menu>

      {/* Spacer for content below AppBar */}
      <Toolbar />
    </>
  );
}