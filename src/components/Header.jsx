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
import { fetchWithFirebaseAuth } from "../utils/authenticatedFetch";
import { useAuth } from "../context/AuthContext";

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
  const { user, role } = useAuth();
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
  const isAdmin = ["Admin", "SuperAdmin"].includes(role);

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

  const fetchUnreadNotifications = async () => {
    const currentUser = user || auth.currentUser;

    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoadingNotifications(true);
    try {
      const requestUrl = isAdmin
        ? `${API_BASE_URL}notifications?userRole=Admin&page=1&limit=100&unread_only=true`
        : `${API_BASE_URL}notifications/user/${currentUser.uid}?unread_only=true`;
      const response = await fetchWithFirebaseAuth(currentUser, requestUrl, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        console.error('Failed to fetch dashboard notifications:', result.error || response.statusText);
        return;
      }

      const data = await response.json();
      const unreadNotifications = data.notifications || [];
      setNotifications(unreadNotifications);
      setUnreadCount(Number(
        data.unread_count ??
        data.stats?.unread ??
        unreadNotifications.filter((item) => !item.is_read).length
      ));
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const reconcileMissingTimesheetNotifications = async () => {
    const currentUser = user || auth.currentUser;
    const employeeId = profileData?.emp_id || profileData?.empId || profileData?.employeeId;

    if (!currentUser || !employeeId || isAdmin) return;

    try {
      const response = await fetchWithFirebaseAuth(currentUser, `${API_BASE_URL}notifications/timesheet/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.uid,
          emp_id: employeeId,
          timezone: 'Asia/Kolkata',
        }),
      });

      // A missing endpoint must not break the rest of the header while the
      // backend scheduler/API is being deployed.
      if (!response.ok && response.status !== 404) {
        console.error('Failed to reconcile missing-timesheet notifications');
      }
    } catch (error) {
      console.error('Failed to reconcile timesheet notifications:', error);
    }
  };

  const syncNotifications = async () => {
    await reconcileMissingTimesheetNotifications();
    await fetchUnreadNotifications();
  };

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

  useEffect(() => {
    if (!user?.uid) return;

    syncNotifications();

    const interval = setInterval(syncNotifications, 5 * 60 * 1000);
    const handleNotificationsUpdated = () => fetchUnreadNotifications();

    window.addEventListener('notifications:updated', handleNotificationsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:updated', handleNotificationsUpdated);
    };
  }, [user?.uid, role, profileData?.emp_id, profileData?.empId, profileData?.employeeId]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25 } }}>
            <Tooltip title={apiStatusTooltip} arrow>
              <Button
                type="button"
                onClick={checkApiStatus}
                startIcon={currentApiStatus.icon}
                sx={{
                  minWidth: { xs: 40, sm: 128 },
                  height: 38,
                  px: { xs: 1, sm: 1.75 },
                  borderRadius: "999px",
                  color: currentApiStatus.color,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  background: 'rgba(255, 255, 255, 0.96)',
                  border: `1px solid ${alpha(currentApiStatus.color, 0.35)}`,
                  boxShadow: '0 3px 10px rgba(15, 23, 42, 0.12)',
                  whiteSpace: "nowrap",
                  "& .MuiButton-startIcon": {
                    mr: { xs: 0, sm: 0.75 },
                    color: currentApiStatus.color,
                  },
                  "&:hover": {
                    background: 'white',
                    borderColor: alpha(currentApiStatus.color, 0.7),
                    transform: 'translateY(-1px)',
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
              onClick={handleNotificationMenuOpen}
              aria-label={`${unreadCount} unread notifications`}
              aria-controls={notificationOpen ? 'dashboard-notification-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={notificationOpen ? 'true' : undefined}
              sx={{
                position: 'relative',
                width: 42,
                height: 42,
                flexShrink: 0,
                color: 'white',
                background: "rgba(255, 255, 255, 0.16)",
                border: '1px solid rgba(255, 255, 255, 0.24)',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)',
                "&:hover": {
                  color: 'white',
                  background: "rgba(255, 255, 255, 0.26)",
                  transform: 'translateY(-1px)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                  fontSize: 23,
                  filter: 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.22))',
                },
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
                max={99}
                overlap="circular"
                invisible={unreadCount === 0}
                color="error"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{
                  '& .MuiBadge-badge': {
                    minWidth: 20,
                    height: 20,
                    px: 0.5,
                    fontSize: '0.68rem',
                    lineHeight: 1,
                    fontWeight: 800,
                    color: 'white',
                    backgroundColor: COLORS.danger,
                    border: `2px solid ${COLORS.primary}`,
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                  },
                }}
              >
                {loadingNotifications ? (
                  <CircularProgress size={22} thickness={5} sx={{ color: 'white' }} />
                ) : unreadCount > 0 ? (
                  <NotificationsActiveIcon />
                ) : (
                  <NotificationsIcon />
                )}
              </Badge>
            </IconButton>

            {/* User Info */}
            {!isSmall && (
              <Box sx={{ textAlign: "left", minWidth: 0, maxWidth: 180 }}>
                <Typography variant="body2" noWrap sx={{ color: "white", fontWeight: 700, lineHeight: 1.25 }}>
                  {profileData?.employee_name || profileData?.designation || 'Profile'}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: "rgba(255, 255, 255, 0.82)", display: 'block', lineHeight: 1.25 }}>
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
                background: 'rgba(255, 255, 255, 0.1)',
                transition: "all 0.2s ease",
                "&:hover": { border: "2px solid white", background: 'rgba(255, 255, 255, 0.2)', transform: "scale(1.04)" },
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

      {/* Dashboard notification preview */}
      <Menu
        id="dashboard-notification-menu"
        anchorEl={notificationAnchorEl}
        open={notificationOpen}
        onClose={handleNotificationMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: { xs: 320, sm: 390 },
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: "16px",
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 12px 36px rgba(30, 27, 46, 0.18)",
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ px: 2.25, py: 1.75, bgcolor: alpha(COLORS.primary, 0.06), borderBottom: `1px solid ${COLORS.border}` }}>
          <Typography sx={{ fontWeight: 800, color: COLORS.ink }}>
            {isAdmin ? 'All employee notifications' : 'Your notifications'}
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.muted }}>
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
          </Typography>
        </Box>

        {loadingNotifications ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={26} sx={{ color: COLORS.primary }} />
          </Box>
        ) : notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={handleGoToNotificationsPage}
              sx={{ alignItems: 'flex-start', gap: 1.25, py: 1.5, whiteSpace: 'normal', borderBottom: `1px solid ${COLORS.border}` }}
            >
              <NotificationsActiveIcon sx={{ mt: 0.25, color: COLORS.warning, fontSize: 21 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: COLORS.ink, fontWeight: 700, lineHeight: 1.35 }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.muted, display: 'block', mt: 0.35 }}>
                  {[
                    notification.metadata?.employee_name,
                    notification.metadata?.date,
                  ].filter(Boolean).join(' • ') || 'Timesheet notification'}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <Box sx={{ px: 2.25, py: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ color: COLORS.faint, mb: 0.75 }} />
            <Typography variant="body2" sx={{ color: COLORS.muted }}>No unread notifications</Typography>
          </Box>
        )}

        <Box sx={{ p: 1 }}>
          <Button fullWidth onClick={handleGoToNotificationsPage} sx={{ textTransform: 'none', fontWeight: 700 }}>
            View all notifications
          </Button>
        </Box>
      </Menu>

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
