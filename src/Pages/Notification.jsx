// src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Badge,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fade,
  Zoom,
  alpha,
  styled
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  MarkEmailRead as MarkEmailReadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Block as BlockIcon,
  AddAlert as AddAlertIcon,
  NotificationImportant as NotificationImportantIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, differenceInHours, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../Config';

// Green Gradient Theme
const greenTheme = {
  primary: "#2196F3",
  secondary: "#2196F3",
  lightGreen: "#2196F3",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  gradient: "linear-gradient(135deg, #2196F3 0%, #0c4879ff 100%)",
  lightGradient: "linear-gradient(135deg, #2196F3 0%, #064172ff 100%)"
};

// Styled Components
const GradientTypography = styled(Typography)(({ theme }) => ({
  background: greenTheme.gradient,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 700,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: greenTheme.gradient,
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 24px",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    background: greenTheme.lightGradient,
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(46, 122, 125, 0.25)",
  },
  "&:disabled": {
    background: "rgba(0, 0, 0, 0.12)",
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(46, 125, 50, 0.1)",
  boxShadow: "0 8px 32px rgba(46, 125, 50, 0.08)",
}));

const NotificationCard = styled(Card)(({ theme, read, type, stage }) => {
  const getTypeColor = () => {
    // Handle notification stages (early_warning, final)
    if (stage === 'final') return '#F44336';      // Red for CRITICAL
    if (stage === 'early_warning') return '#FF9800'; // Orange for reminder
    
    // Handle notification types
    switch(type) {
      case 'timesheet_missing': return '#FF9800';
      case 'approval_required': return '#F44336';
      case 'system_alert': return '#2196F3';
      default: return '#0e5996ff';
    }
  };
  
  return {
    borderRadius: "12px",
    marginBottom: "12px",
    borderLeft: `4px solid ${getTypeColor()}`,
    backgroundColor: read ? '#ffffff' : 'rgba(46, 125, 121, 0.05)',
    border: `1px solid ${read ? 'rgba(0, 0, 0, 0.1)' : getTypeColor() + '30'}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }
  };
});

const TypeChip = styled(Chip)(({ theme, type, stage }) => {
  const getColor = () => {
    // Handle stages first
    if (stage === 'final') return '#F44336';      // Red
    if (stage === 'early_warning') return '#FF9800'; // Orange
    
    // Then handle types
    switch(type) {
      case 'timesheet_missing': return '#FF9800';
      case 'approval_required': return '#F44336';
      case 'system_alert': return '#2196F3';
      default: return '#044377ff';
    }
  };
  
  const color = getColor();
  return {
    borderRadius: "8px",
    fontWeight: 600,
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
    fontSize: '0.75rem',
    height: '24px',
  };
});

const StatCard = styled(Card)(({ theme, color }) => ({
  borderRadius: "12px",
  height: "100%",
  background: color || greenTheme.gradient,
  color: "white",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "rgba(255, 255, 255, 0.3)",
  },
  "&:hover": {
    transform: "translateY(-2px)",
    transition: "transform 0.2s",
    boxShadow: "0 8px 24px rgba(46, 125, 121, 0.2)",
  }
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
  
  // Filter States
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    startDate: null,
    endDate: null,
    readStatus: 'all'
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
    quiet_end: '07:00'
  });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    timesheet_alerts: 0,
    approval_alerts: 0,
    critical_alerts: 0
  });
  
  // Date range options
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];
  
  // Notification types
  const notificationTypes = [
    { value: 'all', label: 'All Types', icon: <NotificationsIcon /> },
    { value: 'timesheet_missing', label: 'Timesheet Alerts', icon: <WarningIcon /> },
    { value: 'approval_required', label: 'Approval Required', icon: <NotificationImportantIcon /> },
    { value: 'system_alert', label: 'System Alerts', icon: <InfoIcon /> }
  ];
  
  // Bulk actions
  const bulkActions = [
    { label: 'Mark as Read', icon: <MarkEmailReadIcon />, action: 'mark_read' },
    { label: 'Mark as Unread', icon: <NotificationsActiveIcon />, action: 'mark_unread' },
    { label: 'Delete Selected', icon: <DeleteIcon />, action: 'delete', color: 'error' },
    { label: 'Archive Selected', icon: <ArchiveIcon />, action: 'archive' }
  ];
  
  // Fetch user info from Firebase
  const fetchUserInfo = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const userData = snap.data();
        setEmpId(userData.empId || user.uid);
        setUserRole(userData.role || 'User');
        console.log(`✅ User info loaded: Role=${userData.role}, EmpId=${userData.empId}`);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      setUserRole('User');
    }
  };
  
  // Fetch notifications from backend with role-based filtering
  const fetchNotifications = async () => {
    if (!user?.uid) return;
    
    setRefreshing(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add role and empId for role-based filtering
      if (userRole === 'Admin') {
        params.append('userRole', 'Admin');
        console.log('📋 Fetching: ALL notifications (Admin)');
      } else {
        params.append('userRole', 'User');
        params.append('empId', empId);
        console.log(`📋 Fetching: Notifications for employee ${empId}`);
      }
      
      // Add pagination
      params.append('page', '1');
      params.append('limit', '100');
      
      // Add filters if any
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.readStatus !== 'all') params.append('unread_only', filters.readStatus === 'unread');
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${API_BASE_URL}notifications?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Received ${data.notifications?.length || 0} notifications`);
        
        setNotifications(data.notifications || []);
        calculateStats(data.notifications || []);
        
        if (data.notifications?.length > 0) {
          toast.success(`Loaded ${data.notifications.length} notifications`);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        setError(errorData.error || 'Failed to fetch notifications');
        toast.error(errorData.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('❌ Network Error:', err);
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
    
    const stats = {
      total: notificationList.length,
      unread: notificationList.filter(n => !n.is_read).length,
      today: notificationList.filter(n => {
        const notifDate = new Date(n.created_at);
        return notifDate >= todayStart;
      }).length,
      timesheet_alerts: notificationList.filter(n => n.type === 'timesheet_missing').length,
      approval_alerts: notificationList.filter(n => n.type === 'approval_required').length,
      critical_alerts: notificationList.filter(n => n.metadata?.notification_stage === 'final').length
    };
    
    setStats(stats);
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empId, userRole })
        }
      );
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true } 
              : notif
          )
        );
        
        // Update selected notifications
        setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
        
        // Recalculate stats
        calculateStats(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
        
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
      const response = await fetch(
        `${API_BASE_URL}notifications/${notificationId}/unread`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empId, userRole })
        }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: false } 
              : notif
          )
        );
        
        calculateStats(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: false } : n
        ));
        
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
      const response = await fetch(
        `${API_BASE_URL}notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empId, userRole })
        }
      );
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
        
        toast.success('Notification deleted successfully');
        
        calculateStats(notifications.filter(n => n.id !== notificationId));
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
      const response = await fetch(
        `${API_BASE_URL}notifications/user/${user.uid}/mark-all-read`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empId, userRole })
        }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setSelectedNotifications([]);
        
        // Update stats
        setStats(prev => ({ ...prev, unread: 0 }));
        
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
      switch(action) {
        case 'mark_read':
          await Promise.all(selectedNotifications.map(id => markAsRead(id)));
          toast.success(`${selectedNotifications.length} notifications marked as read`);
          break;
          
        case 'mark_unread':
          await Promise.all(selectedNotifications.map(id => markAsUnread(id)));
          toast.success(`${selectedNotifications.length} notifications marked as unread`);
          break;
          
        case 'delete':
          setDeleteDialogOpen(true);
          break;
          
        case 'archive':
          toast.info('Archive functionality coming soon');
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
      await Promise.all(selectedNotifications.map(id => deleteNotification(id)));
      setSelectedNotifications([]);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to delete notifications');
    }
  };
  
  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };
  
  // Select all notifications
  const selectAllNotifications = () => {
    const filteredNotifications = getFilteredNotifications();
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };
  
  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffHours = differenceInHours(now, notifTime);
    const diffDays = differenceInDays(now, notifTime);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return format(notifTime, 'MMM dd, yyyy');
    }
  };
  
  // Get notification icon based on type and stage
  const getNotificationIcon = (type, stage, isRead) => {
    let iconColor = isRead ? '#757575' : getTypeColor(type, stage);
    
    // Handle stages
    if (stage === 'final') {
      iconColor = isRead ? '#757575' : '#F44336';
      return <ErrorOutlineIcon style={{ color: iconColor }} />;
    }
    if (stage === 'early_warning') {
      iconColor = isRead ? '#757575' : '#FF9800';
      return <WarningIcon style={{ color: iconColor }} />;
    }
    
    // Handle types
    switch(type) {
      case 'timesheet_missing':
        return <WarningIcon style={{ color: iconColor }} />;
      case 'approval_required':
        return <NotificationImportantIcon style={{ color: iconColor }} />;
      case 'system_alert':
        return <InfoIcon style={{ color: iconColor }} />;
      default:
        return <NotificationsIcon style={{ color: iconColor }} />;
    }
  };
  
  // Get type color
  const getTypeColor = (type, stage) => {
    if (stage === 'final') return '#F44336';
    if (stage === 'early_warning') return '#FF9800';
    
    switch(type) {
      case 'timesheet_missing': return '#FF9800';
      case 'approval_required': return '#F44336';
      case 'system_alert': return '#2196F3';
      default: return '#2E7D32';
    }
  };
  
  // Get filtered notifications
  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      // Search filter
      if (searchTerm && !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }
      
      // Read status filter
      if (filters.readStatus !== 'all') {
        const isRead = filters.readStatus === 'read';
        if (notification.is_read !== isRead) {
          return false;
        }
      }
      
      // Date range filter
      const notificationDate = new Date(notification.created_at);
      
      switch(filters.dateRange) {
        case 'today':
          const today = startOfDay(new Date());
          if (notificationDate < today) return false;
          break;
          
        case 'yesterday':
          const yesterday = startOfDay(new Date());
          yesterday.setDate(yesterday.getDate() - 1);
          const endYesterday = endOfDay(yesterday);
          if (notificationDate < yesterday || notificationDate > endYesterday) return false;
          break;
          
        case 'last7':
          const last7Days = new Date();
          last7Days.setDate(last7Days.getDate() - 7);
          if (notificationDate < last7Days) return false;
          break;
          
        case 'last30':
          const last30Days = new Date();
          last30Days.setDate(last30Days.getDate() - 30);
          if (notificationDate < last30Days) return false;
          break;
          
        case 'custom':
          if (filters.startDate && notificationDate < filters.startDate) return false;
          if (filters.endDate && notificationDate > endOfDay(filters.endDate)) return false;
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
    setFilters({
      type: 'all',
      dateRange: 'all',
      startDate: null,
      endDate: null,
      readStatus: 'all'
    });
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
        body: JSON.stringify({
          userId: user.uid,
          preferences: updatedPrefs
        })
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
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
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
  
  // Fetch notifications when user info is available
  useEffect(() => {
    if (user?.uid && (userRole || empId)) {
      console.log('🔄 Fetching notifications...');
      fetchNotifications();
      fetchPreferences();
    }
  }, [user?.uid, userRole, empId]);
  
  // Refresh notifications every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refreshing notifications...');
        fetchNotifications();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userRole, empId]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    
    // Apply tab-specific filters
    switch(newValue) {
      case 0: // All
        setFilters(prev => ({ ...prev, readStatus: 'all' }));
        break;
      case 1: // Unread
        setFilters(prev => ({ ...prev, readStatus: 'unread' }));
        break;
      case 2: // Timesheet Alerts
        setFilters(prev => ({ ...prev, type: 'timesheet_missing', readStatus: 'all' }));
        break;
      case 3: // Critical Alerts
        // For critical alerts, filter by stage in frontend
        setFilters(prev => ({ ...prev, type: 'all', readStatus: 'all' }));
        break;
    }
  };
  
  // Get filtered notifications for display
  const filteredNotifications = getFilteredNotifications();
  
  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="80vh"
          sx={{
            background: `linear-gradient(135deg, ${alpha("#2E7D32", 0.05)}, ${alpha("#4CAF50", 0.05)})`
          }}
        >
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Fade in={loading} style={{ transitionDelay: '200ms' }}>
            <Box textAlign="center">
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: greenTheme.primary,
                  mb: 2 
                }}
              />
              <Typography 
                variant="h6" 
                color={greenTheme.primary}
                sx={{ fontWeight: 500 }}
              >
                Loading Notifications...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <StyledPaper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ mb: 1, color: greenTheme.primary }}
              >
                Back
              </Button>
              <GradientTypography variant="h4">
                Notifications Center
              </GradientTypography>
              <Typography variant="body2" color="text.secondary">
                {userRole === 'Admin' ? 'View all system notifications' : 'Manage your alerts, reminders, and system notifications'}
              </Typography>
              <Chip
                label={userRole === 'Admin' ? '👑 Admin - All Notifications' : `👤 Employee - Your Notifications (${empId})`}
                color={userRole === 'Admin' ? 'error' : 'primary'}
                variant="outlined"
                sx={{ mt: 1 }}
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
                  sx={{
                    bgcolor: "rgba(46, 125, 50, 0.1)",
                    border: "1px solid rgba(46, 125, 50, 0.2)",
                    "&:hover": {
                      bgcolor: "rgba(46, 125, 50, 0.2)"
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
         
              
              <GradientButton
                startIcon={<MarkEmailReadIcon />}
                onClick={markAllAsRead}
                disabled={stats.unread === 0}
              >
                Mark All as Read
              </GradientButton>
            </Stack>
          </Box>
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4} minWidth={'250px'}>
              <StatCard color={greenTheme.gradient}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.total}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <NotificationsIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Notifications
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} minWidth={'250px'}>
              <StatCard color="#FF9800">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.unread}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <NotificationsActiveIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Unread
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} minWidth={'250px'}>
              <StatCard color="#2196F3">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.today}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Today
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} minWidth={'250px'}>
              <StatCard color="#FF5722">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.timesheet_alerts}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <WarningIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Timesheet Alerts
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} minWidth={'250px'}>
              <StatCard color="#F44336">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.critical_alerts}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <ErrorOutlineIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Critical Alerts
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
          </Grid>
          
          {/* Search and Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="success" />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: "12px",
                  bgcolor: "rgba(46, 125, 50, 0.05)",
                  border: "1px solid rgba(46, 125, 50, 0.1)"
                }
              }}
            />
            
          
            
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{
                borderColor: "rgba(46, 125, 50, 0.3)",
                color: "#2196F3",
                borderRadius: "12px",
                minWidth: '100px',
                "&:hover": {
                  borderColor: "#2E7D32",
                  bgcolor: "rgba(46, 125, 50, 0.05)"
                }
              }}
            >
              Clear
            </Button>
          </Box>
   
          {/* Tabs */}
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'medium',
                minHeight: '48px'
              }
            }}
          >
            <Tab 
              label="All Notifications" 
              icon={<NotificationsIcon />}
              iconPosition="start"
            />
            <Tab 
              label={
                <Badge badgeContent={stats.unread} color="error">
                  <span>Unread</span>
                </Badge>
              }
              icon={<NotificationsActiveIcon />}
              iconPosition="start"
            />
            <Tab 
              label="Timesheet Alerts" 
              icon={<WarningIcon />}
              iconPosition="start"
            />
            <Tab 
              label={
                <Badge badgeContent={stats.critical_alerts} color="error">
                  <span>Critical</span>
                </Badge>
              }
              icon={<ErrorOutlineIcon />}
              iconPosition="start"
            />
          </Tabs>
        </StyledPaper>
        
        {/* Bulk Actions Bar */}
        {selectedNotifications.length > 0 && (
          <StyledPaper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" color="#2E7D32" fontWeight="medium">
                <Badge badgeContent={selectedNotifications.length} color="success">
                  <span>Selected</span>
                </Badge>
              </Typography>
              
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  onClick={selectAllNotifications}
                  sx={{ color: '#2E7D32' }}
                >
                  {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MoreVertIcon />}
                  onClick={(e) => setBulkActionMenuAnchor(e.currentTarget)}
                  sx={{
                    borderColor: "rgba(46, 125, 50, 0.3)",
                    color: "#2196F3",
                  }}
                >
                  Actions
                </Button>
              </Stack>
            </Box>
          </StyledPaper>
        )}
        
        {/* Bulk Actions Menu */}
        <Menu
          anchorEl={bulkActionMenuAnchor}
          open={Boolean(bulkActionMenuAnchor)}
          onClose={() => setBulkActionMenuAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
            }
          }}
        >
          {bulkActions.map((action) => (
            <MenuItem
              key={action.action}
              onClick={() => handleBulkAction(action.action)}
              sx={{
                color: action.color || 'inherit',
                py: 1.5
              }}
            >
              <ListItemIcon>
                {React.cloneElement(action.icon, { fontSize: 'small', color: action.color || 'action' })}
              </ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
        
        {/* Notifications List */}
        <StyledPaper>
          {refreshing ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ color: greenTheme.primary }} />
            </Box>
          ) : filteredNotifications.length > 0 ? (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification) => {
                // Filter for critical alerts tab
                const isCritical = notification.metadata?.notification_stage === 'final';
                if (selectedTab === 3 && !isCritical) return null;
                
                return (
                  <NotificationCard
                    key={notification.id}
                    read={notification.is_read}
                    type={notification.type}
                    stage={notification.metadata?.notification_stage}
                  >
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        py: 2,
                        px: 3,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.02)'
                        }
                      }}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        setSelectedNotification(notification);
                        setNotificationDetailsOpen(true);
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title={notification.is_read ? "Mark as unread" : "Mark as read"}>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notification.is_read) {
                                  markAsUnread(notification.id);
                                } else {
                                  markAsRead(notification.id);
                                }
                              }}
                            >
                              {notification.is_read ? <NotificationsActiveIcon /> : <MarkEmailReadIcon />}
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
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 48, mt: 1 }}>
                        <Box sx={{ position: 'relative' }}>
                          {getNotificationIcon(notification.type, notification.metadata?.notification_stage, notification.is_read)}
                          {!notification.is_read && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: getTypeColor(notification.type, notification.metadata?.notification_stage)
                              }}
                            />
                          )}
                        </Box>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.is_read ? 'normal' : 'bold',
                                color: notification.is_read ? 'text.primary' : getTypeColor(notification.type, notification.metadata?.notification_stage)
                              }}
                            >
                              {notification.message}
                            </Typography>
                            <TypeChip 
                              label={notification.metadata?.notification_stage === 'final' 
                                ? '🚨 CRITICAL' 
                                : notification.metadata?.notification_stage === 'early_warning' 
                                  ? '⏰ REMINDER' 
                                  : notification.type.replace('_', ' ')} 
                              type={notification.type}
                              stage={notification.metadata?.notification_stage}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {formatNotificationTime(notification.created_at)}
                            </Typography>
                            {notification.metadata && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {notification.metadata.date && (
                                  <Chip
                                    size="small"
                                    icon={<CalendarIcon />}
                                    label={notification.metadata.date}
                                    variant="outlined"
                                  />
                                )}
                                {notification.metadata.employee_name && (
                                  <Chip
                                    size="small"
                                    icon={<PersonIcon />}
                                    label={notification.metadata.employee_name}
                                    variant="outlined"
                                  />
                                )}
                                {notification.metadata.status && (
                                  <Chip
                                    size="small"
                                    label={notification.metadata.status}
                                    variant="outlined"
                                    color={notification.metadata.status === 'OVERDUE' ? 'error' : 'default'}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      
                      <Box sx={{ position: 'absolute', right: 80, top: 16 }}>
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleNotificationSelection(notification.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </Box>
                    </ListItem>
                  </NotificationCard>
                );
              })}
            </List>
          ) : (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <NotificationsOffIcon sx={{ fontSize: 64, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || filters.type !== 'all' || filters.dateRange !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'You\'re all caught up!'}
              </Typography>
              {(searchTerm || filters.type !== 'all' || filters.dateRange !== 'all') && (
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{
                    borderColor: "rgba(46, 125, 50, 0.3)",
                    color: "#2196F3",
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          )}
          
          {/* Pagination/Footer */}
          {filteredNotifications.length > 0 && (
            <Box sx={{ 
              p: 2, 
              bgcolor: "rgba(46, 125, 50, 0.08)", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(46, 125, 50, 0.1)"
            }}>
              <Typography variant="body2" color="#2196F3" fontWeight="medium">
                Showing {filteredNotifications.filter(n => selectedTab !== 3 || n.metadata?.notification_stage === 'final').length} of {notifications.length} notifications
              </Typography>
              
              <Stack direction="row" spacing={1}>
                <Tooltip title="Export Notifications">
                  <IconButton size="small" onClick={exportNotifications}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          )}
        </StyledPaper>
      </Container>
      
      {/* Notification Details Dialog */}
      <Dialog
        open={notificationDetailsOpen}
        onClose={() => setNotificationDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
          }
        }}
      >
        {selectedNotification && (
          <>
            <DialogTitle
              sx={{
                background: getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage) + '20',
                color: getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage),
                fontWeight: "bold",
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {getNotificationIcon(selectedNotification.type, selectedNotification.metadata?.notification_stage, selectedNotification.is_read)}
              Notification Details
            </DialogTitle>
            
            <DialogContent sx={{ mt: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedNotification.message}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(new Date(selectedNotification.created_at), 'PPpp')}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TypeChip 
                    label={selectedNotification.type.replace('_', ' ')} 
                    type={selectedNotification.type}
                    stage={selectedNotification.metadata?.notification_stage}
                  />
                  {selectedNotification.metadata?.notification_stage && (
                    <TypeChip 
                      label={selectedNotification.metadata.notification_stage === 'final' ? '🚨 CRITICAL' : '⏰ REMINDER'} 
                      type={selectedNotification.type}
                      stage={selectedNotification.metadata.notification_stage}
                    />
                  )}
                </Box>
              </Box>
              
        
           
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
              <Button
                onClick={() => {
                  if (selectedNotification.is_read) {
                    markAsUnread(selectedNotification.id);
                  } else {
                    markAsRead(selectedNotification.id);
                  }
                }}
                startIcon={selectedNotification.is_read ? <NotificationsActiveIcon /> : <MarkEmailReadIcon />}
                sx={{ color: getTypeColor(selectedNotification.type, selectedNotification.metadata?.notification_stage) }}
              >
                {selectedNotification.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </Button>
              <Button
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                  setNotificationDetailsOpen(false);
                }}
                startIcon={<DeleteIcon />}
                color="error"
              >
                Delete
              </Button>
              <Button
                onClick={() => setNotificationDetailsOpen(false)}
                variant="outlined"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Notification Action Menu */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={() => setNotificationMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
          }
        }}
      >
        {selectedNotification && (
          <>
            <MenuItem
              onClick={() => {
                if (selectedNotification.is_read) {
                  markAsUnread(selectedNotification.id);
                } else {
                  markAsRead(selectedNotification.id);
                }
                setNotificationMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                {selectedNotification.is_read ? <NotificationsActiveIcon /> : <MarkEmailReadIcon />}
              </ListItemIcon>
              <ListItemText>
                {selectedNotification.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </ListItemText>
            </MenuItem>
            
            <MenuItem
              onClick={() => {
                setNotificationDetailsOpen(true);
                setNotificationMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem
              onClick={() => {
                deleteNotification(selectedNotification.id);
                setNotificationMenuAnchor(null);
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px",
          }
        }}
      >
        <DialogTitle color="error.main" fontWeight="bold">
          <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Delete Notifications
        </DialogTitle>
        
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedNotifications.length} selected notification(s)?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All selected notifications will be permanently deleted.
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete ({selectedNotifications.length})
          </Button>
        </DialogActions>
      </Dialog>
      

    </LocalizationProvider>
  );
};

export default NotificationsPage;