import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  alpha,
  styled,
  Divider,
  Avatar,
  Fade,
  Zoom,
  Stack,
  InputAdornment,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemButton,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert as MuiAlert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  Work as WorkIcon,
  Timer as TimerIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpward as ArrowUpwardIcon,
  TrendingUp,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Groups,
  Person,
  Comment as CommentIcon,
  Info as InfoIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  LunchDining as LunchDiningIcon,
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  DeleteOutline as DeleteOutlineIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationImportant as NotificationImportantIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, isToday, differenceInHours } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Config';
import { API_BASE_URL } from '../Config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Green Gradient Theme - Consistent with UserManagement
const greenTheme = {
  primary: "#2E7D32",
  secondary: "#4CAF50",
  lightGreen: "#66BB2196F36A",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  gradient: "linear-gradient(135deg, #2196F3 0%, #115186ff 100%)",
  lightGradient: "linear-gradient(135deg, #2196F3 0%, #2196F3 100%)"
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
    boxShadow: "0 6px 12px rgba(46, 125, 50, 0.25)",
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
    boxShadow: "0 8px 24px rgba(46, 125, 50, 0.2)",
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower?.includes("approved")) return "#2E7D32";
    if (statusLower?.includes("rejected")) return "#F44336";
    if (statusLower?.includes("pending")) return "#FF9800";
    if (statusLower?.includes("absent")) return "#9C27B0";
    return "#757575";
  };
  
  const color = getColor(status);
  return {
    borderRadius: "8px",
    fontWeight: 600,
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
    "&:hover": {
      backgroundColor: `${color}30`,
    }
  };
});

const ActivityChip = styled(Chip)(({ theme, category }) => {
  const getColor = (category) => {
    const catLower = category?.toLowerCase();
    if (catLower?.includes("productive")) return "#2196F3";
    if (catLower?.includes("idle")) return "#FF9800";
    if (catLower?.includes("leave")) return "#F44336";
    if (catLower?.includes("holiday")) return "#9C27B0";
    return "#757575";
  };
  
  const color = getColor(category);
  return {
    borderRadius: "8px",
    fontWeight: 600,
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
    "&:hover": {
      backgroundColor: `${color}30`,
    }
  };
});

const WorkModeChip = styled(Chip)(({ theme, mode }) => {
  const getColor = (mode) => {
    const modeLower = mode?.toLowerCase();
    if (modeLower?.includes("office")) return "#033a70ff";
    if (modeLower?.includes("home")) return "#2196F3";
    if (modeLower?.includes("hybrid")) return "#ED6C02";
    if (modeLower?.includes("client")) return "#7B1FA2";
    if (modeLower?.includes("travel")) return "#F57C00";
    return "#757575";
  };
  
  const color = getColor(mode);
  return {
    borderRadius: "8px",
    fontWeight: 600,
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
    "&:hover": {
      backgroundColor: `${color}30`,
    }
  };
});

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
    backgroundColor: '#F44336',
    color: 'white',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
    },
  }
}));

const TimesheetPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timesheets, setTimesheets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [empId, setEmpId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] = useState(null);
  const [notificationTab, setNotificationTab] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [todayTimesheetStatus, setTodayTimesheetStatus] = useState(null);
  const [showTodayAlert, setShowTodayAlert] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    in_app_notifications: true,
    daily_summary: true
  });

  const { user } = useAuth();

  // Updated activity categories (removed separate permission category)
  const activityCategories = [
    'Productive Effort',
    'Idle - System Issue',
    'Idle - Power Issue',
    'Full Day Leave',
    'Sunday / Holiday'
  ];

  // Work modes
  const workModes = [
    'Office',
    'Work From Home',
    'Hybrid',
    'On-site Client',
    'Business Travel'
  ];

  /* ================= TOAST NOTIFICATIONS ================= */
  const showToast = (message, type = "success") => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      case "info":
        toast.info(message);
        break;
      default:
        toast(message);
    }
  };

  // Fetch employee ID from Firestore
  const fetchEmpId = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const userData = snap.data();
        setEmpId(userData.empId || userData.uid);
        showToast(`Welcome ${userData.name || userData.email}`, "success");
      }
    } catch (err) {
      console.error('Failed to fetch employee ID:', err);
      showToast('Failed to load user data', 'error');
    }
  };

  // Fetch all timesheets
  const fetchTimesheets = async () => {
    if (!empId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}timesheets/employee/${empId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data);
        
        // Check today's timesheet status
        checkTodayTimesheetStatus(data);
        
        showToast(`Loaded ${data.length} timesheet entries`, "success");
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to fetch timesheets', 'error');
        setError(errorData.error || 'Failed to fetch timesheets');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if today's timesheet is submitted
  const checkTodayTimesheetStatus = (timesheetData) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const todayTimesheet = timesheetData.find(ts => {
      const timesheetDate = ts.date;
      
      if (timesheetDate === today) {
        return true;
      }
      
      try {
        const parsedDate = new Date(timesheetDate);
        const formattedDate = format(parsedDate, 'yyyy-MM-dd');
        return formattedDate === today;
      } catch (err) {
        console.error('Error parsing date:', timesheetDate, err);
        return false;
      }
    });
    
    if (todayTimesheet) {
      setTodayTimesheetStatus({
        exists: true,
        data: todayTimesheet,
        message: 'Timesheet submitted for today'
      });
      setShowTodayAlert(false);
    } else {
      const currentHour = new Date().getHours();
      const isAfter6PM = currentHour >= 18;
      
      setTodayTimesheetStatus({
        exists: false,
        isAfter6PM,
        message: isAfter6PM 
          ? 'Timesheet missing for today (after 6 PM)' 
          : 'Timesheet not yet submitted for today'
      });
      
      setShowTodayAlert(isAfter6PM);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.uid) return;
    
    setNotificationLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}notifications/user/${user.uid}?unread_only=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Fetch all notifications (for drawer)
  const fetchAllNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}notifications/user/${user.uid}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching all notifications:', err);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}notifications/${notificationId}/read`,
        { method: 'PUT' }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true } 
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}notifications/user/${user.uid}/mark-all-read`,
        { method: 'PUT' }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      showToast('Failed to mark notifications as read', 'error');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}notifications/${notificationId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
        
        const deletedNotif = notifications.find(n => n.id === notificationId);
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        showToast('Notification deleted', 'success');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      showToast('Failed to delete notification', 'error');
    }
  };

  // Check for missing timesheet and create notification
  const checkAndNotifyMissingTimesheet = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentHour = new Date().getHours();
    
    if (currentHour < 18) return;
    
    const todayTimesheet = timesheets.find(ts => ts.date === today);
    
    if (!todayTimesheet && empId) {
      try {
        const response = await fetch(`${API_BASE_URL}notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            empId: empId,
            message: `Timesheet missing for ${today}. Please submit your timesheet before end of day.`,
            type: 'timesheet_missing',
            metadata: {
              date: today,
              reminder_time: '18:00',
              action_required: true
            }
          })
        });
        
        if (response.ok) {
          showToast('Reminder: Please submit today\'s timesheet', 'warning');
          fetchNotifications();
        }
      } catch (err) {
        console.error('Error creating timesheet notification:', err);
      }
    }
  };

  // Handle notification menu
  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchorEl(null);
  };

  // Open notification drawer
  const openNotificationDrawer = () => {
    setNotificationDrawerOpen(true);
    fetchAllNotifications();
  };

  // Close notification drawer
  const closeNotificationDrawer = () => {
    setNotificationDrawerOpen(false);
  };

  // Handle notification tab change
  const handleNotificationTabChange = (event, newValue) => {
    setNotificationTab(newValue);
  };

  // Get filtered notifications based on tab
  const getFilteredNotifications = () => {
    if (notificationTab === 0) {
      return notifications;
    } else if (notificationTab === 1) {
      return notifications.filter(n => !n.is_read);
    } else {
      return notifications.filter(n => n.type === 'timesheet_missing');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'timesheet_missing':
        return <WarningIcon color="warning" />;
      case 'approval_required':
        return <NotificationImportantIcon color="error" />;
      case 'system_alert':
        return <InfoIcon color="info" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffHours = differenceInHours(now, notifTime);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return format(notifTime, 'MMM dd, HH:mm');
    }
  };

  // Update notification preferences
  const updateNotificationPreferences = async (key, value) => {
    const updatedPrefs = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(updatedPrefs);
    
    try {
      await fetch(`${API_BASE_URL}notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          preferences: updatedPrefs
        })
      });
      showToast('Notification preferences updated', 'success');
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchEmpId();
  }, [user?.uid]);

  useEffect(() => {
    if (empId) {
      fetchTimesheets();
      fetchNotifications();
      
      const interval = setInterval(() => {
        checkAndNotifyMissingTimesheet();
      }, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [empId]);

  // Check every hour after 6 PM
  useEffect(() => {
    const checkHourly = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 18) {
        checkAndNotifyMissingTimesheet();
      }
    };

    const hourlyInterval = setInterval(checkHourly, 60 * 60 * 1000);
    return () => clearInterval(hourlyInterval);
  }, [empId, timesheets]);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date(),
    activity_category: '',
    work_mode: '',
    description: '',
    check_in: '',
    check_out: '',
    lunch_in: '',
    lunch_out: '',
    permission_hours: ''
  });

  // Check if activity requires time tracking
  const requiresTimeTracking = (activity) => {
    return activity === 'Productive Effort' || 
           activity === 'Idle - System Issue' || 
           activity === 'Idle - Power Issue';
  };

  // Check if activity requires minimal fields (Sunday/Holiday)
  const isMinimalActivity = (activity) => {
    return activity === 'Sunday / Holiday' || activity === 'Full Day Leave';
  };

  const resetForm = () => {
    setFormData({
      date: new Date(),
      activity_category: '',
      work_mode: '',
      description: '',
      check_in: '',
      check_out: '',
      lunch_in: '',
      lunch_out: '',
      permission_hours: ''
    });
    setEditingTimesheet(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle activity category change
  const handleActivityChange = (e) => {
    const activity = e.target.value;
    setFormData(prev => ({
      ...prev,
      activity_category: activity,
      // Reset fields for minimal activities
      work_mode: isMinimalActivity(activity) ? '' : prev.work_mode,
      description: isMinimalActivity(activity) ? '' : prev.description,
      check_in: isMinimalActivity(activity) ? '' : prev.check_in,
      check_out: isMinimalActivity(activity) ? '' : prev.check_out,
      lunch_in: isMinimalActivity(activity) ? '' : prev.lunch_in,
      lunch_out: isMinimalActivity(activity) ? '' : prev.lunch_out,
      permission_hours: isMinimalActivity(activity) ? '' : prev.permission_hours
    }));
  };

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (timesheet) => {
    setDialogMode('edit');
    setEditingTimesheet(timesheet);
    setFormData({
      date: new Date(timesheet.date),
      activity_category: timesheet.activity_category,
      work_mode: timesheet.work_mode || '',
      description: timesheet.description || '',
      check_in: timesheet.check_in || '',
      check_out: timesheet.check_out || '',
      lunch_in: timesheet.lunch_in || '',
      lunch_out: timesheet.lunch_out || '',
      permission_hours: timesheet.permission_hours || ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields based on activity
    if (!formData.activity_category) {
      showToast('Please select an activity category', 'error');
      return;
    }

    // For activities that require work mode (not Sunday/Holiday)
    if (!isMinimalActivity(formData.activity_category) && !formData.work_mode) {
      showToast('Please select work mode', 'error');
      return;
    }

    // Validation for time tracking activities
    if (requiresTimeTracking(formData.activity_category)) {
      if (!formData.check_in) {
        showToast('Check-in time is required', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const day = format(formData.date, 'EEEE');
      
      const payload = {
        emp_id: empId,
        date: dateStr,
        day: day,
        activity_category: formData.activity_category,
        work_mode: isMinimalActivity(formData.activity_category) ? 'Not Applicable' : formData.work_mode,
        description: formData.description || '',
        check_in: formData.check_in || null,
        check_out: formData.check_out || null,
        lunch_in: formData.lunch_in || null,
        lunch_out: formData.lunch_out || null,
        permission_hours: formData.permission_hours ? parseFloat(formData.permission_hours) : 0
      };

      const url = dialogMode === 'edit' && editingTimesheet
        ? `${API_BASE_URL}timesheets/${editingTimesheet.id}`
        : `${API_BASE_URL}timesheets`;
      
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        showToast(
          dialogMode === 'edit' ? 'Timesheet updated successfully!' : 'Timesheet added successfully!', 
          'success'
        );
        handleCloseDialog();
        fetchTimesheets();
        
        if (dateStr === format(new Date(), 'yyyy-MM-dd')) {
          fetchNotifications();
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to save timesheet', 'error');
        setError(errorData.error || 'Failed to save timesheet');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timesheet?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}timesheets/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Timesheet deleted successfully!', 'success');
        fetchTimesheets();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to delete timesheet', 'error');
        setError(errorData.error || 'Failed to delete timesheet');
      }
    } catch (err) {
      showToast('Failed to delete timesheet', 'error');
      setError('Failed to delete timesheet');
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Filter timesheets based on search term and filters
  const filteredTimesheets = timesheets.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" ||
      row.date?.toLowerCase().includes(searchLower) ||
      row.day?.toLowerCase().includes(searchLower) ||
      row.activity_category?.toLowerCase().includes(searchLower) ||
      row.description?.toLowerCase().includes(searchLower) ||
      row.work_mode?.toLowerCase().includes(searchLower);

    const matchesActivity = selectedActivity === "all" || row.activity_category === selectedActivity;
    const matchesWorkMode = selectedWorkMode === "all" || row.work_mode === selectedWorkMode;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const rowDate = new Date(row.date);
      matchesDate = rowDate >= startDate && rowDate <= endDate;
    }

    return matchesSearch && matchesActivity && matchesWorkMode && matchesDate;
  });

  // Apply filters
  const handleApplyFilters = () => {
    showToast("Filters applied successfully!", "info");
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedActivity("all");
    setSelectedWorkMode("all");
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    showToast("Filters cleared!", "info");
  };

  // Format time display
  const formatTime = (time) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalHours = timesheets.reduce((sum, ts) => sum + (parseFloat(ts.total_hours) || 0), 0);
    const productiveDays = timesheets.filter(ts => ts.activity_category === 'Productive Effort').length;
    const avgHours = timesheets.length > 0 ? totalHours / timesheets.length : 0;
    const pendingApprovals = timesheets.filter(ts => !ts.remark || ts.remark === "").length;
    
    return { totalHours, productiveDays, avgHours, pendingApprovals };
  };

  const stats = calculateStats();

  // Get color based on hours
  const getHoursColor = (hours) => {
    const h = parseFloat(hours) || 0;
    if (h >= 8) return "#2e7d32";
    if (h >= 6) return "#ed6c02";
    return "#d32f2f";
  };

  // Calculate work duration
  const calculateWorkDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "N/A";
    try {
      const [inHour, inMin] = checkIn.split(":").map(Number);
      const [outHour, outMin] = checkOut.split(":").map(Number);
      const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch {
      return "N/A";
    }
  };

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
                  mb: 2,
                  color:"#2196F3"
                }}
              />
              <Typography 
                variant="h6" 
                color="#2196F3"
                sx={{ fontWeight: 500 }}
              >
                Loading Timesheets...
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
      
      {/* Today's Timesheet Alert */}
      <Snackbar
        open={showTodayAlert}
        autoHideDuration={10000}
        onClose={() => setShowTodayAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="warning"
          onClose={() => setShowTodayAlert(false)}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                handleOpenAddDialog();
                setShowTodayAlert(false);
              }}
            >
              Add Now
            </Button>
          }
          sx={{ 
            borderRadius: '12px',
            alignItems: 'center',
            fontSize: '0.9rem'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Timesheet Missing for Today!
              </Typography>
              <Typography variant="body2">
                It's past 6 PM and you haven't submitted today's timesheet.
              </Typography>
            </Box>
          </Box>
        </MuiAlert>
      </Snackbar>
      
      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: 4, 
          mb: 4,
          minHeight: '100vh'
        }}
      >
        {/* HEADER SECTION */}
        <StyledPaper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <GradientTypography variant="h4">
                Timesheet Management
              </GradientTypography>
              <Typography variant="body2" color="text.secondary">
                Manage your daily work logs and track your hours
              </Typography>
              
              {/* Today's Status Badge */}
              {todayTimesheetStatus && (
                <Chip
                  label={todayTimesheetStatus.message}
                  color={todayTimesheetStatus.exists ? "success" : "warning"}
                  variant="outlined"
                  size="small"
                  icon={todayTimesheetStatus.exists ? <CheckCircleOutlineIcon /> : <WarningIcon />}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: "flex", gap: 1, alignItems: 'center' }}>
              {/* Notification Bell */}
              <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}>
                <IconButton 
                  onClick={handleNotificationMenuOpen}
                  sx={{ 
                    position: 'relative',
                    bgcolor: "rgba(46, 125, 50, 0.1)",
                    border: "1px solid rgba(46, 125, 50, 0.2)",
                    "&:hover": {
                      bgcolor: "rgba(46, 125, 50, 0.2)"
                    }
                  }}
                >
                  <NotificationBadge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </NotificationBadge>
                </IconButton>
              </Tooltip>
              
              {/* Notification Menu */}
              <Menu
                anchorEl={notificationMenuAnchorEl}
                open={Boolean(notificationMenuAnchorEl)}
                onClose={handleNotificationMenuClose}
                PaperProps={{
                  sx: {
                    width: 350,
                    maxHeight: 400,
                    borderRadius: '12px',
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="#2E7D32" fontWeight="bold">
                      Notifications
                      {unreadCount > 0 && (
                        <Chip 
                          label={`${unreadCount} new`} 
                          size="small" 
                          color="error" 
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        openNotificationDrawer();
                        handleNotificationMenuClose();
                      }}
                      sx={{ color: '#2E7D32' }}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>
                
                {notificationLoading ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress size={24} sx={{ color: '#2E7D32' }} />
                  </Box>
                ) : notifications.length > 0 ? (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {notifications.slice(0, 5).map((notification) => (
                      <MenuItem 
                        key={notification.id}
                        onClick={() => {
                          markNotificationAsRead(notification.id);
                          handleNotificationMenuClose();
                        }}
                        sx={{ 
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                          bgcolor: notification.is_read ? 'transparent' : 'rgba(46, 125, 50, 0.05)',
                          '&:hover': {
                            bgcolor: 'rgba(46, 125, 50, 0.1)'
                          }
                        }}
                      >
                        <ListItem disablePadding sx={{ width: '100%' }}>
                          <ListItemIcon>
                            {getNotificationIcon(notification.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                                {notification.message}
                              </Typography>
                            }
                            secondary={formatNotificationTime(notification.created_at)}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                          {!notification.is_read && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2E7D32', ml: 1 }} />
                          )}
                        </ListItem>
                      </MenuItem>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.2)', mb: 1 }} />
                    <Typography color="text.secondary">No notifications</Typography>
                  </Box>
                )}
                
                <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={markAllNotificationsAsRead}
                    disabled={unreadCount === 0}
                    sx={{ 
                      color: '#2E7D32',
                      borderColor: 'rgba(46, 125, 50, 0.3)',
                      '&:hover': {
                        borderColor: '#2E7D32',
                        bgcolor: 'rgba(46, 125, 50, 0.05)'
                      }
                    }}
                  >
                    <MarkEmailReadIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    Mark All as Read
                  </Button>
                </Box>
              </Menu>
              
              <Tooltip title="Toggle filters">
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? "success" : "default"}
                  sx={{ 
                    bgcolor: showFilters ? "rgba(46, 125, 50, 0.1)" : "transparent",
                    border: "1px solid rgba(46, 125, 50, 0.2)",
                    "&:hover": {
                      bgcolor: "rgba(46, 125, 50, 0.15)"
                    }
                  }}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh data">
                <IconButton 
                  onClick={() => {
                    fetchTimesheets();
                    fetchNotifications();
                  }}
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
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                sx={{ px: 3 }}
              >
                Add Timesheet
              </GradientButton>
            </Box>
          </Box>

          {/* STATS CARDS */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color={greenTheme.gradient}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {timesheets.length}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <CalendarIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Entries
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#2196F3">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalHours.toFixed(1)}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Hours
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#4CAF50">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.productiveDays}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Productive Days
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color={unreadCount > 0 ? "#FF9800" : "#2E7D32"}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <NotificationBadge badgeContent={unreadCount} color="error">
                      <Typography variant="h4" fontWeight="bold">
                        {unreadCount}
                      </Typography>
                    </NotificationBadge>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <NotificationsIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Unread Alerts
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
          </Grid>

          {/* SEARCH BAR */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by date, activity, description, or work mode..."
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

          {/* FILTER SECTION */}
          <Collapse in={showFilters}>
            <StyledPaper sx={{ p: 3, mt: 3, bgcolor: "rgba(46, 125, 50, 0.02)" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2196F3" sx={{mb:2}} gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle',color:"#2196F3" }} />
                Filter Timesheets
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Activity Category</InputLabel>
                    <Select
                      value={selectedActivity}
                      label="Activity Category"
                      onChange={(e) => setSelectedActivity(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.05)",
                        border: "1px solid rgba(46, 125, 50, 0.1)"
                      }}
                    >
                      <MenuItem value="all">All Activities</MenuItem>
                      {activityCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          <ActivityChip label={category} size="small" category={category} sx={{ mr: 1 }} />
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Work Mode</InputLabel>
                    <Select
                      value={selectedWorkMode}
                      label="Work Mode"
                      onChange={(e) => setSelectedWorkMode(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.05)",
                        border: "1px solid rgba(46, 125, 50, 0.1)"
                      }}
                    >
                      <MenuItem value="all">All Work Modes</MenuItem>
                      {workModes.map((mode) => (
                        <MenuItem key={mode} value={mode}>
                          <WorkModeChip label={mode} size="small" mode={mode} sx={{ mr: 1 }} />
                          {mode}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ 
                      textField: { 
                        size: "small", 
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }
                      } 
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ 
                      textField: { 
                        size: "small", 
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }
                      } 
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <GradientButton
                      onClick={handleApplyFilters}
                      size="small"
                      startIcon={<FilterIcon />}
                      sx={{ px: 2 }}
                    >
                      Apply Filters
                    </GradientButton>
                    
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                      size="small"
                      sx={{ 
                        borderColor: "rgba(46, 125, 50, 0.3)",
                        color: "#2196F3",
                        borderRadius: "8px",
                        "&:hover": {
                          borderColor: "#2E7D32",
                          bgcolor: "rgba(46, 125, 50, 0.05)"
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
              
              {(selectedActivity !== "all" || selectedWorkMode !== "all" || startDate || endDate) && (
                <Typography variant="caption" color="#2196F3" sx={{ mt: 1, display: "block" }}>
                  Filtering by: 
                  {selectedActivity !== "all" && ` Activity = ${selectedActivity}`}
                  {selectedWorkMode !== "all" && `, Work Mode = ${selectedWorkMode}`}
                  {startDate && endDate && `, Date Range: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`}
                </Typography>
              )}
            </StyledPaper>
          </Collapse>
        </StyledPaper>

        {/* EMPLOYEE INFO CARD */}
        {empId && (
          <StyledPaper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "rgba(46, 125, 50, 0.1)",
                  color: "#2196F3",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  border: "2px solid rgba(46, 125, 50, 0.2)"
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" color="#2196F3">
                  {user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Employee ID: {empId} • {timesheets.length} timesheet entries
                  {todayTimesheetStatus && !todayTimesheetStatus.exists && (
                    <span style={{ color: '#FF9800', marginLeft: '8px' }}>
                      • Today's timesheet pending
                    </span>
                  )}
                </Typography>
              </Box>
              <Chip
                label={stats.avgHours.toFixed(1) + "h average"}
                color="success"
                variant="outlined"
                icon={<TimerIcon />}
              />
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} alerts`}
                  color="warning"
                  variant="filled"
                  icon={<NotificationsIcon />}
                  onClick={openNotificationDrawer}
                  clickable
                />
              )}
            </Box>
          </StyledPaper>
        )}

        {/* TIMESHEETS TABLE */}
        <StyledPaper>
          <TableContainer sx={{ maxHeight: "calc(100vh - 500px)" }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: "rgba(46, 125, 50, 0.08)",
                  borderBottom: "2px solid #2E7D32"
                }}>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", width: 60 ,backgroundColor:"#2196F3"}}>S.No</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Date/Day</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Activity</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold",backgroundColor:"#2196F3" }}>Work Mode</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold",backgroundColor:"#2196F3" }}>Description</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Hours</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Status</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold",backgroundColor:"#2196F3", width: 180 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((row, index) => (
                    <React.Fragment key={row.id}>
                      <TableRow 
                        hover
                        sx={{ 
                          '&:nth-of-type(even)': { bgcolor: 'rgba(46, 125, 50, 0.02)' },
                          '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' },
                          borderBottom: expandedRows.includes(row.id) ? 'none' : '1px solid rgba(46, 125, 50, 0.1)'
                        }}
                      >
                        <TableCell>
                          {index+1}.
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium" color="#2196F3">
                              {format(parseISO(row.date), 'dd/MM/yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.day}
                              {row.date === format(new Date(), 'yyyy-MM-dd') && (
                                <Chip 
                                  label="Today" 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ ml: 1, fontSize: '0.6rem', height: 18 }}
                                />
                              )}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <ActivityChip
                            label={row.activity_category}
                            size="small"
                            category={row.activity_category}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <WorkModeChip
                            label={row.work_mode}
                            size="small"
                            mode={row.work_mode}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={row.description || "No description"} arrow>
                            <Typography 
                              variant="body2" 
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: row.description ? "text.primary" : "text.secondary",
                                fontStyle: row.description ? "normal" : "italic"
                              }}
                            >
                              {row.description || "No description provided"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: getHoursColor(row.total_hours),
                                mr: 1,
                              }}
                            />
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              sx={{ color: getHoursColor(row.total_hours) }}
                            >
                              {row.total_hours || "0.0"}h
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <StatusChip
                            label={row.remark || "Pending"}
                            size="small"
                            status={row.remark}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(row)}
                                sx={{
                                  backgroundColor: "rgba(46, 125, 50, 0.1)",
                                  color: "#2196F3",
                                  "&:hover": {
                                    backgroundColor: "rgba(46, 125, 50, 0.2)",
                                  },
                                  borderRadius: "8px",
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(row.id)}
                                sx={{
                                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                                  color: "#F44336",
                                  "&:hover": {
                                    backgroundColor: "rgba(244, 67, 54, 0.2)",
                                  },
                                  borderRadius: "8px",
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {row.remark && (
                              <Tooltip title="View Remark">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    showToast(`Remark: ${row.remark}`, 'info');
                                  }}
                                  sx={{
                                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                                    color: "#2196F3",
                                    "&:hover": {
                                      backgroundColor: "rgba(33, 150, 243, 0.2)",
                                    },
                                    borderRadius: "8px",
                                  }}
                                >
                                  <CommentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row Details */}
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0 }}>
                          <Collapse in={expandedRows.includes(row.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: 'rgba(46, 125, 50, 0.02)' }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#2196F3' }}>
                                    <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Time Tracking
                                  </Typography>
                                  <Grid container spacing={2}>
                                    {[
                                      { icon: <LoginIcon />, label: "Check In", value: formatTime(row.check_in), color: "#2196F3" },
                                      { icon: <LogoutIcon />, label: "Check Out", value: formatTime(row.check_out), color: "#D32F2F" },
                                      { icon: <LunchDiningIcon />, label: "Lunch In", value: formatTime(row.lunch_in), color: "#ED6C02" },
                                      { icon: <LunchDiningIcon />, label: "Lunch Out", value: formatTime(row.lunch_out), color: "#7B1FA2" }
                                    ].map((item, index) => (
                                      <Grid item xs={6} key={index}>
                                        <Paper elevation={0} sx={{ 
                                          p: 2, 
                                          bgcolor: `${item.color}10`, 
                                          borderRadius: 2,
                                          border: `1px solid ${item.color}20`
                                        }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            {React.cloneElement(item.icon, { sx: { mr: 1, color: item.color } })}
                                            <Typography variant="body2" fontWeight="bold">{item.label}</Typography>
                                          </Box>
                                          <Typography variant="h6" fontWeight="bold" color={item.color}>
                                            {item.value}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    ))}
                                  </Grid>
                                  
                                  <Paper elevation={0} sx={{ 
                                    p: 2, 
                                    mt: 2, 
                                    bgcolor: 'rgba(33, 150, 243, 0.1)', 
                                    borderRadius: 2,
                                    border: "1px solid rgba(33, 150, 243, 0.2)"
                                  }}>
                                    <Typography variant="body2" fontWeight="bold" color="#2196F3" gutterBottom>
                                      Work Duration
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" color="#2196F3">
                                      {calculateWorkDuration(row.check_in, row.check_out)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#2196F3' }}>
                                    <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Details
                                  </Typography>
                                  
                                  <Paper elevation={0} sx={{ 
                                    p: 2, 
                                    mb: 2, 
                                    bgcolor: 'rgba(255, 152, 0, 0.1)', 
                                    borderRadius: 2,
                                    border: "1px solid rgba(255, 152, 0, 0.2)"
                                  }}>
                                    <Typography variant="body2" fontWeight="bold" color="#FF9800" gutterBottom>
                                      Description
                                    </Typography>
                                    <Typography variant="body2">
                                      {row.description || "No description provided"}
                                    </Typography>
                                  </Paper>
                                  
                                  <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                      <Paper elevation={0} sx={{ 
                                        p: 2, 
                                        bgcolor: 'rgba(244, 67, 54, 0.1)', 
                                        borderRadius: 2,
                                        border: "1px solid rgba(244, 67, 54, 0.2)"
                                      }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          Permission Hours
                                        </Typography>
                                        <Typography variant="h6" color="#F44336" fontWeight="bold">
                                          {row.permission_hours || "0.0"}h
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Paper elevation={0} sx={{ 
                                        p: 2, 
                                        bgcolor: 'rgba(46, 125, 50, 0.1)', 
                                        borderRadius: 2,
                                        border: "1px solid rgba(46, 125, 50, 0.2)"
                                      }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          Total Hours
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold" color="#2196F3">
                                          {row.total_hours || "0.0"}h
                                        </Typography>
                                      </Paper>
                                    </Grid>
                                  </Grid>
                                  
                                  {row.remark && (
                                    <Paper elevation={0} sx={{ 
                                      p: 2, 
                                      bgcolor: 'rgba(46, 125, 50, 0.1)', 
                                      borderRadius: 2,
                                      border: `1px solid rgba(46, 125, 50, 0.2)`
                                    }}>
                                      <Typography variant="body2" fontWeight="bold" color="#2196F3" gutterBottom>
                                        <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Supervisor Remark
                                      </Typography>
                                      <Typography variant="body2">
                                        {row.remark}
                                      </Typography>
                                    </Paper>
                                  )}
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <AccessTimeIcon sx={{ fontSize: 64, color: "rgba(46, 125, 50, 0.3)", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          {searchTerm ? "No matching records found" : "No timesheet entries"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm ? "Try adjusting your search or filters" : "Click 'Add Timesheet' to create your first entry"}
                        </Typography>
                        {!todayTimesheetStatus?.exists && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                            sx={{ mt: 2, bgcolor: greenTheme.gradient }}
                          >
                            Add Today's Timesheet
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* TABLE FOOTER */}
          {filteredTimesheets.length > 0 && (
            <Box sx={{ 
              p: 2, 
              bgcolor: "rgba(46, 125, 50, 0.08)", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(46, 125, 50, 0.1)"
            }}>
              <Typography variant="body2" color="#2196F3" fontWeight="medium">
                Showing {filteredTimesheets.length} of {timesheets.length} entries
                {selectedActivity !== "all" && ` in ${selectedActivity}`}
                {selectedWorkMode !== "all" && ` with ${selectedWorkMode}`}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="#2196F3">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total hours: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0).toFixed(1)}h
              </Typography>
            </Box>
          )}
        </StyledPaper>

        {/* NOTIFICATION DRAWER */}
        <Drawer
          anchor="right"
          open={notificationDrawerOpen}
          onClose={closeNotificationDrawer}
          PaperProps={{
            sx: {
              width: 450,
              borderRadius: '16px 0 0 16px',
              overflow: 'hidden',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Box sx={{ 
            background: greenTheme.gradient, 
            color: 'white', 
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Notifications
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {unreadCount} unread • {notifications.length} total
              </Typography>
            </Box>
            <IconButton onClick={closeNotificationDrawer} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Tabs 
            value={notificationTab} 
            onChange={handleNotificationTabChange}
            sx={{ 
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              '& .MuiTab-root': { 
                textTransform: 'none',
                fontWeight: 'medium'
              }
            }}
          >
            <Tab 
              label="All" 
              icon={<NotificationsIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Unread" 
              icon={
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsActiveIcon />
                </Badge>
              } 
              iconPosition="start"
            />
            <Tab 
              label="Timesheet Alerts" 
              icon={<WarningIcon />} 
              iconPosition="start"
            />
          </Tabs>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {notificationLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ color: greenTheme.primary }} />
              </Box>
            ) : getFilteredNotifications().length > 0 ? (
              <List sx={{ p: 0 }}>
                {getFilteredNotifications().map((notification) => (
                  <ListItem
                    key={notification.id}
                    sx={{
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      bgcolor: notification.is_read ? 'transparent' : 'rgba(46, 125, 50, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(46, 125, 50, 0.1)'
                      }
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        {!notification.is_read && (
                          <Tooltip title="Mark as read">
                            <IconButton 
                              size="small"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <MarkEmailReadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: notification.is_read ? 'normal' : 'bold',
                            color: notification.type === 'timesheet_missing' ? '#FF9800' : 'inherit'
                          }}
                        >
                          {notification.message}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatNotificationTime(notification.created_at)}
                          </Typography>
                          {notification.metadata?.date && (
                            <Chip 
                              label={notification.metadata.date} 
                              size="small" 
                              variant="outlined"
                              sx={{ ml: 1, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 64, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notificationTab === 1 
                    ? "You've read all notifications" 
                    : "No notifications in this category"}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={markAllNotificationsAsRead}
                disabled={unreadCount === 0}
                sx={{ bgcolor: greenTheme.gradient }}
              >
                Mark All as Read
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => {
                  showToast('Notification settings would open here', 'info');
                }}
                sx={{ 
                  borderColor: 'rgba(46, 125, 50, 0.3)',
                  color: greenTheme.primary
                }}
              >
                Settings
              </Button>
            </Stack>
            
            {/* Notification Preferences */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(46, 125, 50, 0.05)', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color={greenTheme.primary} gutterBottom>
                <SettingsIcon sx={{ mr: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
                Notification Preferences
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPreferences.in_app_notifications}
                      onChange={(e) => updateNotificationPreferences('in_app_notifications', e.target.checked)}
                      color="success"
                    />
                  }
                  label="In-app notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPreferences.email_notifications}
                      onChange={(e) => updateNotificationPreferences('email_notifications', e.target.checked)}
                      color="success"
                    />
                  }
                  label="Email notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPreferences.daily_summary}
                      onChange={(e) => updateNotificationPreferences('daily_summary', e.target.checked)}
                      color="success"
                    />
                  }
                  label="Daily summary"
                />
              </Stack>
            </Box>
          </Box>
        </Drawer>

        {/* ADD/EDIT TIMESHEET DIALOG */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: 'hidden',
            }
          }}
        >
          <DialogTitle
            sx={{
              background: greenTheme.gradient,
              color: "white",
              fontWeight: "bold",
              py: 2,
            }}
          >
            {dialogMode === 'add' ? 'Add New Timesheet Entry' : 'Edit Timesheet Entry'}
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}minWidth={'250px'}>
                  <DatePicker
                    label="Date *"
                    value={formData.date}
                    onChange={(newDate) => setFormData(prev => ({ ...prev, date: newDate }))}
                    slotProps={{ 
                      textField: { 
                        size: "small", 
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }
                      } 
                    }}
                    disabled={dialogMode === 'edit'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}minWidth={'250px'}maxWidth={'250px'}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Activity Category *"
                    name="activity_category"
                    value={formData.activity_category}
                    onChange={handleActivityChange}
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.05)",
                        border: "1px solid rgba(46, 125, 50, 0.1)"
                      }
                    }}
                  >
                    {activityCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <ActivityChip label={category} size="small" category={category} sx={{ mr: 1 }} />
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Work Mode - Only show for non-minimal activities */}
                {!isMinimalActivity(formData.activity_category) && (
                  <Grid item xs={12} sm={6}minWidth={'250px'}maxWidth={'250px'}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Work Mode *"
                      name="work_mode"
                      value={formData.work_mode}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: "8px",
                          bgcolor: "rgba(46, 125, 50, 0.05)",
                          border: "1px solid rgba(46, 125, 50, 0.1)"
                        }
                      }}
                    >
                      {workModes.map((mode) => (
                        <MenuItem key={mode} value={mode}>
                          <WorkModeChip label={mode} size="small" mode={mode} sx={{ mr: 1 }} />
                          {mode}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

             

                {/* Time Tracking Section - Only for time tracking activities */}
                {requiresTimeTracking(formData.activity_category) && (
                  <>
                    <Grid item xs={12}>
                        <Chip 
                          label="Time Tracking" 
                          icon={<TimerIcon />}
                          sx={{ 
                            bgcolor: "rgba(46, 125, 50, 0.1)",
                            color: "#2E7D32",
                            fontWeight: 'medium'
                          }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}minWidth={'150px'}>
                      <TextField
                        fullWidth
                        required
                        type="time"
                        label="Check In *"
                        name="check_in"
                        value={formData.check_in}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}minWidth={'150px'}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Check Out"
                        name="check_out"
                        value={formData.check_out}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}minWidth={'150px'}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Lunch In"
                        name="lunch_in"
                        value={formData.lunch_in}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}minWidth={'150px'}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Lunch Out"
                        name="lunch_out"
                        value={formData.lunch_out}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "8px",
                            bgcolor: "rgba(46, 125, 50, 0.05)",
                            border: "1px solid rgba(46, 125, 50, 0.1)"
                          }
                        }}
                      />
                    </Grid>
                  </>
                )}

                {/* Info Alert for non-time tracking activities */}
                {(formData.activity_category === 'Full Day Leave' || 
                  formData.activity_category === 'Sunday / Holiday') && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: "rgba(33, 150, 243, 0.1)",
                        color: "#2196F3",
                        border: "1px solid rgba(33, 150, 243, 0.3)"
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        No time tracking required for {formData.activity_category}. Just select the activity and submit.
                      </Typography>
                    </Alert>
                  </Grid>
                )}
   {/* Permission Hours - Only show for Productive Effort */}
                {formData.activity_category === 'Productive Effort' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Permission Hours (optional)"
                      name="permission_hours"
                      value={formData.permission_hours}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: "8px",
                          bgcolor: "rgba(46, 125, 50, 0.05)",
                          border: "1px solid rgba(46, 125, 50, 0.1)"
                        }
                      }}
                      InputProps={{
                        inputProps: { min: 0, max: 8, step: 0.5 },
                        endAdornment: (
                          <Typography variant="body2" color="text.secondary">
                            hours
                          </Typography>
                        )
                      }}
                      helperText="Permission hours will be subtracted from total work hours"
                    />
                  </Grid>
                )}
                {/* Description - Only show for non-minimal activities */}
                {!isMinimalActivity(formData.activity_category) && (
                  <Grid item xs={12}minWidth={'450px'}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Work Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your tasks, achievements, and any challenges faced during the day..."
                      size="small"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: "8px",
                          bgcolor: "rgba(46, 125, 50, 0.05)",
                          border: "1px solid rgba(46, 125, 50, 0.1)"
                        }
                      }}
                    />
                  </Grid>
                )}
              </Grid>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 3, display: "block", fontStyle: "italic" }}
              >
                * Required fields
              </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(46, 125, 50, 0.1)" }}>
              <Button
                onClick={handleCloseDialog}
                disabled={saving}
                variant="outlined"
                sx={{
                  borderColor: "rgba(46, 125, 50, 0.3)",
                  color: "#2E7D32",
                  borderRadius: "8px",
                  "&:hover": {
                    borderColor: "#2E7D32",
                    bgcolor: "rgba(46, 125, 50, 0.05)"
                  }
                }}
              >
                Cancel
              </Button>
              <GradientButton
                type="submit"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ minWidth: 140 }}
              >
                {saving ? 'Saving...' : dialogMode === 'add' ? 'Add Timesheet' : 'Update Timesheet'}
              </GradientButton>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default TimesheetPage;