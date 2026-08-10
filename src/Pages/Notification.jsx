// src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Badge,
  Stack,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fade,
  alpha,
  styled,
  GlobalStyles,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  NotificationImportant as NotificationImportantIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, differenceInHours, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../Config';

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
  orange: "#F97316",
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

// Pill-shaped segmented control — same pattern as the Todo/Timesheet pages.
const Segmented = ({ value, onChange, options, size = 'medium' }) => (
  <Box sx={{ display: 'inline-flex', p: 0.5, borderRadius: 14, bgcolor: COLORS.bg, border: `1px solid ${COLORS.border}`, gap: 0.5, flexWrap: 'wrap' }}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <Button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          startIcon={opt.icon}
          size={size}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 11,
            px: 1.75,
            color: active ? '#fff' : COLORS.muted,
            bgcolor: active ? COLORS.primary : 'transparent',
            boxShadow: active ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
            '&:hover': { bgcolor: active ? COLORS.primaryDark : alpha(COLORS.primary, 0.08) },
          }}
        >
          {opt.label}
          {!!opt.badge && (
            <Box
              component="span"
              sx={{
                ml: 0.75,
                fontSize: '0.7rem',
                fontWeight: 700,
                px: 0.75,
                borderRadius: 8,
                bgcolor: active ? 'rgba(255,255,255,0.25)' : alpha(COLORS.danger, 0.12),
                color: active ? '#fff' : COLORS.danger,
              }}
            >
              {opt.badge}
            </Box>
          )}
        </Button>
      );
    })}
  </Box>
);

// Radial progress ring — same signature visual as the Todo/Timesheet dashboards.
const RadialProgress = ({ value = 0, size = 116, stroke = 12, color = COLORS.primary }) => {
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
        <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: COLORS.ink, lineHeight: 1 }}>
          <Display>{Math.round(value)}%</Display>
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.muted, fontSize: '0.68rem' }}>
          read
        </Typography>
      </Box>
    </Box>
  );
};

const StatTile = ({ label, value, color, icon }) => (
  <Box sx={{ p: 1.75, borderRadius: '14px', bgcolor: alpha(color, 0.06), borderLeft: `3px solid ${color}`, minWidth: 132, flex: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.45rem', color }}>
        <Display>{value}</Display>
      </Typography>
      <Box sx={{ color, opacity: 0.85, display: 'flex' }}>{icon}</Box>
    </Box>
    <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

// Severity colors for a notification — used by the card border, icon, and chip.
const getTypeColor = (type, stage) => {
  if (stage === 'final') return COLORS.danger;
  if (stage === 'early_warning') return COLORS.warning;

  switch (type) {
    case 'timesheet_missing':
      return COLORS.warning;
    case 'approval_required':
      return COLORS.danger;
    case 'system_alert':
      return COLORS.info;
    default:
      return COLORS.primary;
  }
};

const NotificationCard = styled(Box)(({ read, color }) => ({
  borderRadius: 16,
  marginBottom: 12,
  borderLeft: `4px solid ${color}`,
  border: `1px solid ${read ? COLORS.border : alpha(color, 0.3)}`,
  backgroundColor: read ? COLORS.surface : alpha(color, 0.04),
  transition: 'all 0.2s ease',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 6px 18px rgba(16,24,40,0.08)',
  },
}));

const TypeChip = styled(Chip)(({ color }) => ({
  borderRadius: 8,
  fontWeight: 600,
  backgroundColor: alpha(color, 0.12),
  color,
  border: `1px solid ${alpha(color, 0.3)}`,
  fontSize: '0.72rem',
  height: 24,
}));

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // User Info
  const [userRole, setUserRole] = useState('User');
  const [empId, setEmpId] = useState('');
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    startDate: null,
    endDate: null,
    readStatus: 'all',
  });

  // Dialog States
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationDetailsOpen, setNotificationDetailsOpen] = useState(false);

  // Notification Preferences
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    in_app_notifications: true,
    push_notifications: false,
    timesheet_reminders: true,
    approval_alerts: true,
    system_alerts: true,
    daily_summary: true,
    quiet_hours: false,
    quiet_start: '22:00',
    quiet_end: '07:00',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    timesheet_alerts: 0,
    approval_alerts: 0,
    critical_alerts: 0,
  });

  // Bulk actions
  const bulkActions = [
    { label: 'Mark as read', icon: <MarkEmailReadIcon />, action: 'mark_read' },
    { label: 'Mark as unread', icon: <NotificationsActiveIcon />, action: 'mark_unread' },
    { label: 'Delete selected', icon: <DeleteIcon />, action: 'delete', color: 'error' },
    { label: 'Archive selected', icon: <ArchiveIcon />, action: 'archive' },
  ];

  // Fetch user info from Firebase
  const fetchUserInfo = async () => {
    if (!user?.uid) return;

    setUserInfoLoaded(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const userData = snap.data();
        const employeeId = userData.empId || userData.emp_id || userData.employeeId || userData.uid || '';

        setEmpId(employeeId);
        setUserRole(userData.role || 'Employee');
        console.log(`User info loaded: Role=${userData.role}, EmpId=${employeeId}`);
        return;
      }

      if (user.email) {
        const encodedEmail = encodeURIComponent(user.email);
        const response = await fetch(`${API_BASE_URL}profile/${encodedEmail}`);

        if (response.ok) {
          const result = await response.json();
          setEmpId(result?.data?.emp_id || '');
        }
      }

      setUserRole('Employee');
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      setUserRole('Employee');
    } finally {
      setUserInfoLoaded(true);
    }
  };

  // Fetch notifications from backend with role-based filtering
  const fetchNotifications = async () => {
    if (!user?.uid || !userInfoLoaded) return;

    setRefreshing(true);
    setError('');

    try {
      const params = new URLSearchParams();
      let requestUrl = '';

      if (userRole === 'Admin') {
        params.append('userRole', 'Admin');
        params.append('page', '1');
        params.append('limit', '100');
        requestUrl = `${API_BASE_URL}notifications?${params.toString()}`;
        console.log('Fetching all notifications for admin');
      } else {
        if (!empId) {
          setError('Employee ID not found. Please refresh the page.');
          return;
        }

        requestUrl = `${API_BASE_URL}notifications/user/${user.uid}`;
        console.log(`Fetching notifications for employee ${empId}`);
      }

      const response = await fetch(requestUrl);

      if (response.ok) {
        const data = await response.json();
        console.log(`Received ${data.notifications?.length || 0} notifications`);

        setNotifications(data.notifications || []);
        calculateStats(data.notifications || []);

        if (data.notifications?.length > 0) {
          toast.success(`Loaded ${data.notifications.length} notifications`);
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError(errorData.error || 'Failed to fetch notifications');
        toast.error(errorData.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Network Error:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch notification preferences
  const fetchPreferences = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${API_BASE_URL}notifications/preferences/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  // Calculate statistics
  const calculateStats = (notificationList) => {
    const now = new Date();
    const todayStart = startOfDay(now);

    const newStats = {
      total: notificationList.length,
      unread: notificationList.filter((n) => !n.is_read).length,
      today: notificationList.filter((n) => {
        const notifDate = new Date(n.created_at);
        return notifDate >= todayStart;
      }).length,
      timesheet_alerts: notificationList.filter((n) => n.type === 'timesheet_missing').length,
      approval_alerts: notificationList.filter((n) => n.type === 'approval_required').length,
      critical_alerts: notificationList.filter((n) => n.metadata?.notification_stage === 'final').length,
    };

    setStats(newStats);
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, userRole }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)));
        setSelectedNotifications((prev) => prev.filter((id) => id !== notificationId));
        calculateStats(notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
        toast.success('Notification marked as read');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark notification as unread
  const markAsUnread = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}notifications/${notificationId}/unread`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, userRole }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: false } : notif)));
        calculateStats(notifications.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n)));
        toast.success('Notification marked as unread');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to mark notification as unread');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, userRole }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
        setSelectedNotifications((prev) => prev.filter((id) => id !== notificationId));
        toast.success('Notification deleted successfully');
        calculateStats(notifications.filter((n) => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to delete notification');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${API_BASE_URL}notifications/user/${user.uid}/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, userRole }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
        setSelectedNotifications([]);
        setStats((prev) => ({ ...prev, unread: 0 }));
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) {
      toast.warning('Please select notifications first');
      return;
    }

    try {
      switch (action) {
        case 'mark_read':
          await Promise.all(selectedNotifications.map((id) => markAsRead(id)));
          toast.success(`${selectedNotifications.length} notifications marked as read`);
          break;

        case 'mark_unread':
          await Promise.all(selectedNotifications.map((id) => markAsUnread(id)));
          toast.success(`${selectedNotifications.length} notifications marked as unread`);
          break;

        case 'delete':
          setDeleteDialogOpen(true);
          break;

        case 'archive':
          toast.info('Archive functionality coming soon');
          break;
        default:
          break;
      }

      setBulkActionMenuAnchor(null);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to perform bulk action');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await Promise.all(selectedNotifications.map((id) => deleteNotification(id)));
      setSelectedNotifications([]);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to delete notifications');
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications((prev) => (prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId]));
  };

  // Select all notifications
  const selectAllNotifications = () => {
    const filtered = getFilteredNotifications();
    if (selectedNotifications.length === filtered.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filtered.map((n) => n.id));
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffHours = differenceInHours(now, notifTime);
    const diffDays = differenceInDays(now, notifTime);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return format(notifTime, 'MMM dd, yyyy');
  };

  // Get notification icon based on type and stage
  const getNotificationIcon = (type, stage, isRead) => {
    const color = isRead ? COLORS.muted : getTypeColor(type, stage);

    if (stage === 'final') return <ErrorOutlineIcon style={{ color }} />;
    if (stage === 'early_warning') return <WarningIcon style={{ color }} />;

    switch (type) {
      case 'timesheet_missing':
        return <WarningIcon style={{ color }} />;
      case 'approval_required':
        return <NotificationImportantIcon style={{ color }} />;
      case 'system_alert':
        return <InfoIcon style={{ color }} />;
      default:
        return <NotificationsIcon style={{ color }} />;
    }
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    return notifications.filter((notification) => {
      if (searchTerm && !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }

      if (filters.readStatus !== 'all') {
        const isRead = filters.readStatus === 'read';
        if (notification.is_read !== isRead) return false;
      }

      const notificationDate = new Date(notification.created_at);

      switch (filters.dateRange) {
        case 'today': {
          const today = startOfDay(new Date());
          if (notificationDate < today) return false;
          break;
        }
        case 'yesterday': {
          const yesterday = startOfDay(new Date());
          yesterday.setDate(yesterday.getDate() - 1);
          const endYesterday = endOfDay(yesterday);
          if (notificationDate < yesterday || notificationDate > endYesterday) return false;
          break;
        }
        case 'last7': {
          const last7Days = new Date();
          last7Days.setDate(last7Days.getDate() - 7);
          if (notificationDate < last7Days) return false;
          break;
        }
        case 'last30': {
          const last30Days = new Date();
          last30Days.setDate(last30Days.getDate() - 30);
          if (notificationDate < last30Days) return false;
          break;
        }
        case 'custom': {
          if (filters.startDate && notificationDate < filters.startDate) return false;
          if (filters.endDate && notificationDate > endOfDay(filters.endDate)) return false;
          break;
        }
        default:
          break;
      }

      return true;
    });
  };

  // Apply filters
  const applyFilters = () => {
    setFilterMenuAnchor(null);
    toast.info('Filters applied successfully');
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ type: 'all', dateRange: 'all', startDate: null, endDate: null, readStatus: 'all' });
    setSearchTerm('');
    toast.info('Filters cleared');
  };

  // Update preferences
  const updatePreferences = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);

    try {
      await fetch(`${API_BASE_URL}notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, preferences: updatedPrefs }),
      });
      toast.success('Preferences updated successfully');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to update preferences');
    }
  };

  // Export notifications
  const exportNotifications = () => {
    const dataStr = JSON.stringify(getFilteredNotifications(), null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `notifications_${format(new Date(), 'yyyy-MM-dd')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Notifications exported successfully');
  };

  // Initialize
  useEffect(() => {
    if (user?.uid) {
      console.log('🔄 Initializing: Fetching user info...');
      fetchUserInfo();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !userInfoLoaded) return;

    if (userRole === 'Admin' || empId) {
      console.log('Fetching notifications...');
      fetchNotifications();
      fetchPreferences();
      return;
    }

    setLoading(false);
    setError('Employee ID not found. Please refresh the page.');
  }, [user?.uid, userInfoLoaded, userRole, empId]);

  // Refresh notifications every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && userInfoLoaded && (userRole === 'Admin' || empId)) {
        console.log('Auto-refreshing notifications...');
        fetchNotifications();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userInfoLoaded, userRole, empId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);

    switch (newValue) {
      case 0:
        setFilters((prev) => ({ ...prev, readStatus: 'all' }));
        break;
      case 1:
        setFilters((prev) => ({ ...prev, readStatus: 'unread' }));
        break;
      case 2:
        setFilters((prev) => ({ ...prev, type: 'timesheet_missing', readStatus: 'all' }));
        break;
      case 3:
        setFilters((prev) => ({ ...prev, type: 'all', readStatus: 'all' }));
        break;
      default:
        break;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const readRate = stats.total > 0 ? ((stats.total - stats.unread) / stats.total) * 100 : 0;

  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <GlobalStyles styles={fontImport} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={{ bgcolor: COLORS.bg }}>
          <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
          <Fade in={loading} style={{ transitionDelay: '200ms' }}>
            <Box textAlign="center">
              <CircularProgress size={56} thickness={4} sx={{ color: COLORS.primary, mb: 2 }} />
              <Typography sx={{ fontWeight: 600, color: COLORS.ink }}>
                <Display>Loading notifications…</Display>
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted, mt: 1 }}>
                {userRole === 'Admin' ? 'Fetching all notifications' : `Fetching your notifications (${empId})`}
              </Typography>
            </Box>
          </Fade>
        </Box>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <GlobalStyles styles={fontImport} />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

      <Shell sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: COLORS.bg, minHeight: '100vh' }}>
        {/* Header */}
        <Surface sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 1, color: COLORS.primary, textTransform: 'none', fontWeight: 600 }}>
                Back
              </Button>
              <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: COLORS.ink }}>
                <Display>Notifications center</Display>
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted, mt: 0.5 }}>
                {userRole === 'Admin' ? 'View all system notifications.' : 'Manage your alerts, reminders, and system notifications.'}
              </Typography>
              <Chip
                label={userRole === 'Admin' ? `Admin — all notifications` : `Employee — your notifications (${empId})`}
                variant="outlined"
                size="small"
                sx={{ mt: 1.25, borderColor: userRole === 'Admin' ? alpha(COLORS.danger, 0.4) : alpha(COLORS.primary, 0.4), color: userRole === 'Admin' ? COLORS.danger : COLORS.primary, fontWeight: 600 }}
              />
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => {
                    setRefreshing(true);
                    fetchNotifications();
                  }}
                  disabled={refreshing}
                  sx={{ bgcolor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.muted, '&:hover': { bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <GradientButton startIcon={<MarkEmailReadIcon />} onClick={markAllAsRead} disabled={stats.unread === 0}>
                Mark all as read
              </GradientButton>
            </Stack>
          </Box>

          {/* Overview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, flexWrap: 'wrap', mb: 3 }}>
            <RadialProgress value={readRate} color={COLORS.primary} />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
              <StatTile label="Total" value={stats.total} color={COLORS.primary} icon={<NotificationsIcon fontSize="small" />} />
              <StatTile label="Unread" value={stats.unread} color={COLORS.warning} icon={<NotificationsActiveIcon fontSize="small" />} />
              <StatTile label="Today" value={stats.today} color={COLORS.info} icon={<AccessTimeIcon fontSize="small" />} />
              <StatTile label="Timesheet alerts" value={stats.timesheet_alerts} color={COLORS.orange} icon={<WarningIcon fontSize="small" />} />
              <StatTile label="Critical alerts" value={stats.critical_alerts} color={COLORS.danger} icon={<ErrorOutlineIcon fontSize="small" />} />
            </Box>
          </Box>

          {/* Search and Filter Bar */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              placeholder="Search notifications…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLORS.muted, fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px', bgcolor: COLORS.bg },
              }}
            />

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: '12px', minWidth: 100, textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) } }}
            >
              Clear
            </Button>
          </Box>

          {/* Tabs */}
          <Segmented
            value={selectedTab}
            onChange={(val) => handleTabChange(null, val)}
            options={[
              { value: 0, label: 'All', icon: <NotificationsIcon fontSize="small" /> },
              { value: 1, label: 'Unread', icon: <NotificationsActiveIcon fontSize="small" />, badge: stats.unread },
              { value: 2, label: 'Timesheet alerts', icon: <WarningIcon fontSize="small" /> },
              { value: 3, label: 'Critical', icon: <ErrorOutlineIcon fontSize="small" />, badge: stats.critical_alerts },
            ]}
          />
        </Surface>

        {/* Bulk Actions Bar */}
        {selectedNotifications.length > 0 && (
          <Surface sx={{ p: 2, mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography sx={{ color: COLORS.primary, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge badgeContent={selectedNotifications.length} color="error" sx={{ '& .MuiBadge-badge': { right: -10 } }}>
                  <span>Selected</span>
                </Badge>
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={selectAllNotifications} sx={{ color: COLORS.primary, textTransform: 'none', fontWeight: 600 }}>
                  {selectedNotifications.length === filteredNotifications.length ? 'Deselect all' : 'Select all'}
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MoreVertIcon />}
                  onClick={(e) => setBulkActionMenuAnchor(e.currentTarget)}
                  sx={{ borderColor: COLORS.border, color: COLORS.muted, textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: COLORS.primary, color: COLORS.primary } }}
                >
                  Actions
                </Button>
              </Stack>
            </Box>
          </Surface>
        )}

        {/* Bulk Actions Menu */}
        <Menu anchorEl={bulkActionMenuAnchor} open={Boolean(bulkActionMenuAnchor)} onClose={() => setBulkActionMenuAnchor(null)} PaperProps={{ sx: { borderRadius: '14px' } }}>
          {bulkActions.map((action) => (
            <MenuItem key={action.action} onClick={() => handleBulkAction(action.action)} sx={{ color: action.color || COLORS.ink, py: 1.5 }}>
              <ListItemIcon>{React.cloneElement(action.icon, { fontSize: 'small', sx: { color: action.color ? COLORS.danger : COLORS.muted } })}</ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

        {/* Notifications List */}
        <Surface sx={{ overflow: 'hidden' }}>
          {refreshing ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ color: COLORS.primary }} />
            </Box>
          ) : filteredNotifications.length > 0 ? (
            <List sx={{ p: 1.5 }}>
              {filteredNotifications.map((notification) => {
                const isCritical = notification.metadata?.notification_stage === 'final';
                if (selectedTab === 3 && !isCritical) return null;

                const color = getTypeColor(notification.type, notification.metadata?.notification_stage);

                return (
                  <NotificationCard key={notification.id} read={notification.is_read} color={color}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ py: 2, px: 2, pl: 1, cursor: 'pointer', '&:hover': { backgroundColor: alpha(color, 0.03) } }}
                      onClick={() => {
                        if (!notification.is_read) markAsRead(notification.id);
                        setSelectedNotification(notification);
                        setNotificationDetailsOpen(true);
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title={notification.is_read ? 'Mark as unread' : 'Mark as read'}>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notification.is_read) markAsUnread(notification.id);
                                else markAsRead(notification.id);
                              }}
                            >
                              {notification.is_read ? <NotificationsActiveIcon fontSize="small" /> : <MarkEmailReadIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="More options">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotification(notification);
                                setNotificationMenuAnchor(e.currentTarget);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleNotificationSelection(notification.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{ mt: 0.5, color: COLORS.faint, '&.Mui-checked': { color: COLORS.primary } }}
                      />

                      <ListItemIcon sx={{ minWidth: 44, mt: 1 }}>
                        <Box sx={{ position: 'relative' }}>
                          {getNotificationIcon(notification.type, notification.metadata?.notification_stage, notification.is_read)}
                          {!notification.is_read && (
                            <Box sx={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                          )}
                        </Box>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: notification.is_read ? 500 : 700, color: notification.is_read ? COLORS.ink : color }}>
                              {notification.message}
                            </Typography>
                            <TypeChip
                              color={color}
                              label={
                                notification.metadata?.notification_stage === 'final'
                                  ? 'Critical'
                                  : notification.metadata?.notification_stage === 'early_warning'
                                  ? 'Reminder'
                                  : notification.type.replace('_', ' ')
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: COLORS.muted, mb: 1 }}>
                              {formatNotificationTime(notification.created_at)}
                            </Typography>
                            {notification.metadata && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {notification.metadata.date && <Chip size="small" icon={<CalendarIcon />} label={notification.metadata.date} variant="outlined" />}
                                {notification.metadata.employee_name && <Chip size="small" icon={<PersonIcon />} label={notification.metadata.employee_name} variant="outlined" />}
                                {notification.metadata.status && (
                                  <Chip
                                    size="small"
                                    label={notification.metadata.status}
                                    variant="outlined"
                                    sx={notification.metadata.status === 'OVERDUE' ? { borderColor: alpha(COLORS.danger, 0.4), color: COLORS.danger } : undefined}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </NotificationCard>
                );
              })}
            </List>
          ) : (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <NotificationsOffIcon sx={{ fontSize: 56, color: alpha(COLORS.muted, 0.3), mb: 2 }} />
              <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>No notifications found</Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 3 }}>
                {searchTerm || filters.type !== 'all' || filters.dateRange !== 'all' ? 'Try adjusting your search or filters.' : "You're all caught up!"}
              </Typography>
              {(searchTerm || filters.type !== 'all' || filters.dateRange !== 'all') && (
                <Button variant="outlined" onClick={clearFilters} sx={{ borderColor: COLORS.border, color: COLORS.primary, textTransform: 'none', fontWeight: 600 }}>
                  Clear filters
                </Button>
              )}
            </Box>
          )}

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <Box sx={{ p: 2, bgcolor: COLORS.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, borderTop: `1px solid ${COLORS.border}` }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, fontWeight: 500 }}>
                Showing {filteredNotifications.filter((n) => selectedTab !== 3 || n.metadata?.notification_stage === 'final').length} of {notifications.length} notifications
              </Typography>

              <Tooltip title="Export notifications">
                <IconButton size="small" onClick={exportNotifications} sx={{ color: COLORS.muted, '&:hover': { color: COLORS.primary } }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Surface>
      </Shell>

      {/* Notification Details Dialog */}
      <Dialog open={notificationDetailsOpen} onClose={() => setNotificationDetailsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
        {selectedNotification && (
          <>
            <Box
              sx={{
                background: alpha(getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage), 0.1),
                color: getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage),
                py: 2.5,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
              }}
            >
              {getNotificationIcon(selectedNotification.type, selectedNotification.metadata?.notification_stage, selectedNotification.is_read)}
              <DialogTitle sx={{ p: 0, fontWeight: 700, color: 'inherit' }}>
                <Display>Notification details</Display>
              </DialogTitle>
            </Box>

            <DialogContent sx={{ mt: 3 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ink, mb: 0.5 }}>
                  {selectedNotification.message}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  {format(new Date(selectedNotification.created_at), 'PPpp')}
                </Typography>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TypeChip
                    color={getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage)}
                    label={selectedNotification.type.replace('_', ' ')}
                  />
                  {selectedNotification.metadata?.notification_stage && (
                    <TypeChip
                      color={getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage)}
                      label={selectedNotification.metadata.notification_stage === 'final' ? 'Critical' : 'Reminder'}
                    />
                  )}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
              <Button
                onClick={() => {
                  if (selectedNotification.is_read) markAsUnread(selectedNotification.id);
                  else markAsRead(selectedNotification.id);
                }}
                startIcon={selectedNotification.is_read ? <NotificationsActiveIcon /> : <MarkEmailReadIcon />}
                sx={{ color: getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage), textTransform: 'none', fontWeight: 600 }}
              >
                {selectedNotification.is_read ? 'Mark as unread' : 'Mark as read'}
              </Button>
              <Button
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                  setNotificationDetailsOpen(false);
                }}
                startIcon={<DeleteIcon />}
                sx={{ color: COLORS.danger, textTransform: 'none', fontWeight: 600 }}
              >
                Delete
              </Button>
              <Button onClick={() => setNotificationDetailsOpen(false)} variant="outlined" sx={{ borderColor: COLORS.border, color: COLORS.muted, textTransform: 'none', fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Notification Action Menu */}
      <Menu anchorEl={notificationMenuAnchor} open={Boolean(notificationMenuAnchor)} onClose={() => setNotificationMenuAnchor(null)} PaperProps={{ sx: { borderRadius: '14px' } }}>
        {selectedNotification && (
          <>
            <MenuItem
              onClick={() => {
                if (selectedNotification.is_read) markAsUnread(selectedNotification.id);
                else markAsRead(selectedNotification.id);
                setNotificationMenuAnchor(null);
              }}
            >
              <ListItemIcon>{selectedNotification.is_read ? <NotificationsActiveIcon fontSize="small" /> : <MarkEmailReadIcon fontSize="small" />}</ListItemIcon>
              <ListItemText>{selectedNotification.is_read ? 'Mark as unread' : 'Mark as read'}</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setNotificationDetailsOpen(true);
                setNotificationMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <InfoIcon fontSize="small" sx={{ color: COLORS.info }} />
              </ListItemIcon>
              <ListItemText>View details</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                deleteNotification(selectedNotification.id);
                setNotificationMenuAnchor(null);
              }}
              sx={{ color: COLORS.danger }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: COLORS.danger }} />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ color: COLORS.danger, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon />
          Delete notifications
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ color: COLORS.ink }}>Are you sure you want to delete {selectedNotifications.length} selected notification(s)?</Typography>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2.5 }}>
            This action cannot be undone. All selected notifications will be permanently deleted.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderColor: COLORS.border, color: COLORS.muted, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" startIcon={<DeleteIcon />} sx={{ bgcolor: COLORS.danger, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#DC2626' } }}>
            Delete ({selectedNotifications.length})
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default NotificationsPage;