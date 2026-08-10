import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
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
  alpha,
  styled,
  Divider,
  Avatar,
  Fade,
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
  Tabs,
  Tab,
  Alert as MuiAlert,
  Snackbar,
  GlobalStyles,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  LunchDining as LunchDiningIcon,
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  DeleteOutline as DeleteOutlineIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationImportant as NotificationImportantIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, differenceInHours, isAfter, isToday, isPast, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Config';
import { API_BASE_URL } from '../Config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ---------------------------------------------------------------------------
// Design tokens — shared visual language with the Todo page. If both pages
// live in the same app, consider lifting this block into a shared
// `theme/tokens.js` file so palette/type stay in lockstep automatically.
// ---------------------------------------------------------------------------
const COLORS = {
  primary: '#0EA5E9',
  primaryDark: '#0EA5E9',
  primarySoft: '#EEF2FF',
  ink: '#1E1B2E',
  muted: '#6B7280',
  faint: '#9CA3AF',
  surface: '#FFFFFF',
  bg: '#F6F7FB',
  border: 'rgba(30,27,46,0.08)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
  violet: '#7C3AED',
  orange: '#F97316',
};

const ACTIVITY_COLOR = {
  'Productive Effort': COLORS.info,
  'Idle - System Issue': COLORS.warning,
  'Idle - Power Issue': COLORS.warning,
  'Full Day Leave': COLORS.danger,
  'Sunday / Holiday': COLORS.violet,
};

const WORKMODE_COLOR = {
  Office: COLORS.primary,
  'Work From Home': COLORS.info,
  Hybrid: COLORS.warning,
  'On-site Client': COLORS.violet,
  'Business Travel': COLORS.orange,
  'Full Day Leave': COLORS.danger,
  'Sunday / Holiday': COLORS.violet,
};

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
`;

// ---------------------------------------------------------------------------
// Styled primitives
// ---------------------------------------------------------------------------
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

const colorByMap = (map) => (value) => map[value] || COLORS.muted;
const getActivityColor = colorByMap(ACTIVITY_COLOR);
const getWorkModeColor = colorByMap(WORKMODE_COLOR);

const ActivityChip = styled(Chip)(({ category }) => {
  const color = getActivityColor(category);
  return {
    borderRadius: 8,
    fontWeight: 600,
    backgroundColor: alpha(color, 0.12),
    color,
    border: `1px solid ${alpha(color, 0.25)}`,
    '&:hover': { backgroundColor: alpha(color, 0.18) },
  };
});

const WorkModeChip = styled(Chip)(({ mode }) => {
  const color = getWorkModeColor(mode);
  return {
    borderRadius: 8,
    fontWeight: 600,
    backgroundColor: alpha(color, 0.12),
    color,
    border: `1px solid ${alpha(color, 0.25)}`,
    '&:hover': { backgroundColor: alpha(color, 0.18) },
  };
});

const NotificationBadge = styled(Badge)({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: `2px solid ${COLORS.surface}`,
    padding: '0 4px',
    backgroundColor: COLORS.danger,
    color: 'white',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' },
    '70%': { boxShadow: '0 0 0 10px rgba(239,68,68,0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0)' },
  },
});

// Radial progress ring — same signature visual as the Todo dashboard.
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
          productive
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

const TimesheetPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timesheets, setTimesheets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [empId, setEmpId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  
  // New state for month filter
  const [viewMode, setViewMode] = useState('currentMonth'); // 'currentMonth' or 'all'

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] = useState(null);
  const [notificationTab, setNotificationTab] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [todayTimesheetStatus, setTodayTimesheetStatus] = useState(null);
  const [showTodayAlert, setShowTodayAlert] = useState(false);
  const [criticalAlertVisible, setCriticalAlertVisible] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    in_app_notifications: true,
    daily_summary: true,
  });

  const { user } = useAuth();

  const activityCategories = [
    'Productive Effort',
    'Idle - System Issue',
    'Idle - Power Issue',
    'Full Day Leave',
    'Sunday / Holiday',
  ];

  const workModes = ['Office', 'Work From Home', 'Hybrid', 'On-site Client', 'Business Travel'];
  const minimalActivityModes = ['Full Day Leave', 'Sunday / Holiday'];

  /* ================= TOAST NOTIFICATIONS ================= */
  const showToast = (message, type = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
        toast.info(message);
        break;
      default:
        toast(message);
    }
  };

  const fetchEmpId = async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const userData = snap.data();
        const displayName = userData.name || userData.employee_name || user.displayName || user.email || 'User';

        setEmpId(userData.empId || userData.uid);
        setEmployeeName(displayName);
        showToast(`Welcome ${displayName}`, 'success');

        if (user.email) {
          try {
            const encodedEmail = encodeURIComponent(user.email);
            const response = await fetch(`${API_BASE_URL}profile/${encodedEmail}`);

            if (response.ok) {
              const result = await response.json();
              const profileName = result?.data?.employee_name;

              if (profileName) {
                setEmployeeName(profileName);
              }
            }
          } catch (profileError) {
            console.error('Failed to fetch employee profile name:', profileError);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch employee ID:', err);
      showToast('Failed to load user data', 'error');
    }
  };

  const fetchTimesheets = async () => {
    if (!empId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}timesheets/employee/${empId}`);

      if (response.ok) {
        const data = await response.json();
        setTimesheets(data);
        checkTodayTimesheetStatus(data);
        showToast(`Loaded ${data.length} timesheet entries`, 'success');
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

  const checkTodayTimesheetStatus = (timesheetData) => {
    const today = format(new Date(), 'yyyy-MM-dd');

    const todayTimesheet = timesheetData.find((ts) => {
      const timesheetDate = ts.date;

      if (timesheetDate === today) return true;

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
      setTodayTimesheetStatus({ exists: true, data: todayTimesheet, message: 'Timesheet submitted for today' });
      setShowTodayAlert(false);
      setCriticalAlertVisible(false);
    } else {
      const currentHour = new Date().getHours();
      const isAfter6PM = currentHour >= 18;
      const isAfter11PM = currentHour >= 23;

      setTodayTimesheetStatus({
        exists: false,
        isAfter6PM,
        isAfter11PM,
        message: isAfter11PM
          ? 'Timesheet OVERDUE - Day completed without submission'
          : isAfter6PM
          ? 'Timesheet not yet submitted for today'
          : 'Timesheet pending for today',
      });

      setShowTodayAlert(isAfter6PM);
      setCriticalAlertVisible(isAfter11PM);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.uid) return;

    setNotificationLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}notifications/user/${user.uid}?unread_only=true`);

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

  const fetchAllNotifications = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${API_BASE_URL}notifications/user/${user.uid}`);

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching all notifications:', err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}notifications/${notificationId}/read`, { method: 'PUT' });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${API_BASE_URL}notifications/user/${user.uid}/mark-all-read`, { method: 'PUT' });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
        setUnreadCount(0);
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      showToast('Failed to mark notifications as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}notifications/${notificationId}`, { method: 'DELETE' });

      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

        const deletedNotif = notifications.find((n) => n.id === notificationId);
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        showToast('Notification deleted', 'success');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchorEl(null);
  };

  const openNotificationDrawer = () => {
    setNotificationDrawerOpen(true);
    fetchAllNotifications();
  };

  const closeNotificationDrawer = () => {
    setNotificationDrawerOpen(false);
  };

  const handleNotificationTabChange = (event, newValue) => {
    setNotificationTab(newValue);
  };

  const getFilteredNotifications = () => {
    if (notificationTab === 0) return notifications;
    if (notificationTab === 1) return notifications.filter((n) => !n.is_read);
    if (notificationTab === 2) return notifications.filter((n) => n.metadata?.notification_stage === 'early_warning');
    return notifications.filter((n) => n.metadata?.notification_stage === 'final');
  };

  const getNotificationIcon = (type, stage) => {
    if (stage === 'final') return <ErrorOutlineIcon sx={{ color: COLORS.danger }} />;
    if (stage === 'early_warning') return <WarningIcon sx={{ color: COLORS.warning }} />;
    switch (type) {
      case 'timesheet_missing':
        return <WarningIcon sx={{ color: COLORS.warning }} />;
      case 'approval_required':
        return <NotificationImportantIcon sx={{ color: COLORS.danger }} />;
      case 'system_alert':
        return <InfoIcon sx={{ color: COLORS.info }} />;
      default:
        return <NotificationsIcon sx={{ color: COLORS.muted }} />;
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffHours = differenceInHours(now, notifTime);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return format(notifTime, 'MMM dd, HH:mm');
  };

  const getNotificationSeverityColor = (stage, priority) => {
    if (stage === 'final') return COLORS.danger;
    if (priority === 'critical') return COLORS.danger;
    if (stage === 'early_warning') return COLORS.warning;
    return COLORS.info;
  };

  const updateNotificationPreferences = async (key, value) => {
    const updatedPrefs = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(updatedPrefs);

    try {
      await fetch(`${API_BASE_URL}notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, preferences: updatedPrefs }),
      });
      showToast('Notification preferences updated', 'success');
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  };

  useEffect(() => {
    fetchEmpId();
  }, [user?.uid]);

  useEffect(() => {
    if (empId) {
      fetchTimesheets();
      fetchNotifications();

      const interval = setInterval(() => {
        fetchTimesheets();
        fetchNotifications();
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [empId]);

  const [formData, setFormData] = useState({
    date: new Date(),
    activity_category: '',
    work_mode: '',
    description: '',
    check_in: '',
    check_out: '',
    lunch_in: '',
    lunch_out: '',
    permission_hours: '',
    overtime_hours: '',
  });

  const requiresTimeTracking = (activity) =>
    activity === 'Productive Effort' || activity === 'Idle - System Issue' || activity === 'Idle - Power Issue';

  const isMinimalActivity = (activity) => activity === 'Sunday / Holiday' || activity === 'Full Day Leave';

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
      permission_hours: '',
      overtime_hours: '',
    });
    setEditingTimesheet(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActivityChange = (e) => {
    const activity = e.target.value;
    const minimalActivity = isMinimalActivity(activity);

    setFormData((prev) => ({
      ...prev,
      activity_category: activity,
      work_mode: minimalActivity ? activity : isMinimalActivity(prev.work_mode) ? '' : prev.work_mode,
      description: minimalActivity ? '' : prev.description,
      check_in: minimalActivity ? '' : prev.check_in,
      check_out: minimalActivity ? '' : prev.check_out,
      lunch_in: minimalActivity ? '' : prev.lunch_in,
      lunch_out: minimalActivity ? '' : prev.lunch_out,
      permission_hours: minimalActivity ? '' : prev.permission_hours,
      overtime_hours: minimalActivity ? '' : prev.overtime_hours,
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
      permission_hours: timesheet.permission_hours || '',
      overtime_hours: timesheet.ot_hours || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  // Date validation function - prevents future dates
  const isDateValid = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate <= today;
  };

  // Calculate working hours (total hours from check-in/out minus lunch and permission)
  const calculateWorkingHours = (checkIn, checkOut, lunchIn, lunchOut, permissionHours) => {
    if (!checkIn || !checkOut) return 0;
    
    try {
      const [inHour, inMin] = checkIn.split(':').map(Number);
      const [outHour, outMin] = checkOut.split(':').map(Number);
      let totalMinutes = outHour * 60 + outMin - (inHour * 60 + inMin);
      
      // Subtract lunch break if both lunch in and lunch out are provided
      if (lunchIn && lunchOut) {
        const [lInHour, lInMin] = lunchIn.split(':').map(Number);
        const [lOutHour, lOutMin] = lunchOut.split(':').map(Number);
        const lunchMinutes = lOutHour * 60 + lOutMin - (lInHour * 60 + lInMin);
        totalMinutes -= lunchMinutes;
      }
      
      // Subtract permission hours (convert to minutes)
      if (permissionHours) {
        totalMinutes -= parseFloat(permissionHours) * 60;
      }
      
      // Return hours as a number (rounded to 2 decimal places)
      return Math.round((totalMinutes / 60) * 100) / 100;
    } catch {
      return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDateValid(formData.date)) {
      showToast('Date cannot be in the future. Please select today or a past date.', 'error');
      return;
    }

    if (!formData.activity_category) {
      showToast('Please select an activity category', 'error');
      return;
    }

    if (!isMinimalActivity(formData.activity_category) && !formData.work_mode) {
      showToast('Please select work mode', 'error');
      return;
    }

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

      // Calculate working hours
      const workingHours = calculateWorkingHours(
        formData.check_in,
        formData.check_out,
        formData.lunch_in,
        formData.lunch_out,
        formData.permission_hours
      );

      // Parse overtime hours
      const overtimeHours = formData.overtime_hours ? parseFloat(formData.overtime_hours) : 0;
      
      // Calculate total hours = working hours + overtime hours
      const totalHours = workingHours + overtimeHours;

      const payload = {
        emp_id: empId,
        date: dateStr,
        day,
        activity_category: formData.activity_category,
        work_mode: isMinimalActivity(formData.activity_category) ? formData.activity_category : formData.work_mode,
        description: formData.description || '',
        check_in: formData.check_in || null,
        check_out: formData.check_out || null,
        lunch_in: formData.lunch_in || null,
        lunch_out: formData.lunch_out || null,
        permission_hours: formData.permission_hours ? parseFloat(formData.permission_hours) : 0,
        ot_hours: overtimeHours,
        total_hours: totalHours, // Now total_hours = working_hours + ot_hours
      };

      const url =
        dialogMode === 'edit' && editingTimesheet ? `${API_BASE_URL}timesheets/${editingTimesheet.id}` : `${API_BASE_URL}timesheets`;
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(dialogMode === 'edit' ? 'Timesheet updated successfully!' : 'Timesheet added successfully!', 'success');
        handleCloseDialog();
        fetchTimesheets();

        if (dateStr === format(new Date(), 'yyyy-MM-dd')) {
          fetchNotifications();
          checkTodayTimesheetStatus([...timesheets, data]);
          setCriticalAlertVisible(false);
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
      const response = await fetch(`${API_BASE_URL}timesheets/${id}`, { method: 'DELETE' });

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

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  // Filter timesheets based on view mode (current month or all)
  const getFilteredTimesheets = () => {
    let filtered = timesheets;

    if (viewMode === 'currentMonth') {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      filtered = filtered.filter((row) => {
        try {
          const rowDate = new Date(row.date);
          return isWithinInterval(rowDate, { start: monthStart, end: monthEnd });
        } catch (err) {
          return false;
        }
      });
    }

    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter((row) => {
      const matchesSearch =
        searchTerm === '' ||
        row.date?.toLowerCase().includes(searchLower) ||
        row.day?.toLowerCase().includes(searchLower) ||
        row.activity_category?.toLowerCase().includes(searchLower) ||
        row.description?.toLowerCase().includes(searchLower) ||
        row.work_mode?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });

    if (selectedActivity !== 'all') {
      filtered = filtered.filter((row) => row.activity_category === selectedActivity);
    }

    if (selectedWorkMode !== 'all') {
      filtered = filtered.filter((row) => row.work_mode === selectedWorkMode);
    }

    if (startDate && endDate) {
      filtered = filtered.filter((row) => {
        const rowDate = new Date(row.date);
        return rowDate >= startDate && rowDate <= endDate;
      });
    }

    return filtered;
  };

  const filteredTimesheets = getFilteredTimesheets();

  const handleApplyFilters = () => {
    showToast('Filters applied successfully!', 'info');
  };

  const handleClearFilters = () => {
    setSelectedActivity('all');
    setSelectedWorkMode('all');
    setStartDate(null);
    setEndDate(null);
    setSearchTerm('');
    setViewMode('currentMonth');
    showToast('Filters cleared!', 'info');
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  const calculateStats = () => {
    const filteredData = viewMode === 'currentMonth' ? filteredTimesheets : timesheets;
    const totalWorkingHours = filteredData.reduce((sum, ts) => sum + (parseFloat(ts.total_hours || 0) - parseFloat(ts.ot_hours || 0)), 0);
    const totalOTHours = filteredData.reduce((sum, ts) => sum + (parseFloat(ts.ot_hours) || 0), 0);
    const totalHours = filteredData.reduce((sum, ts) => sum + (parseFloat(ts.total_hours) || 0), 0);
    const productiveDays = filteredData.filter((ts) => ts.activity_category === 'Productive Effort').length;
    const avgHours = filteredData.length > 0 ? totalHours / filteredData.length : 0;

    return { totalWorkingHours, totalOTHours, totalHours, productiveDays, avgHours };
  };

  const stats = calculateStats();
  const productivityRate = filteredTimesheets.length > 0 ? (stats.productiveDays / filteredTimesheets.length) * 100 : 0;

  const getHoursColor = (hours) => {
    const h = parseFloat(hours) || 0;
    if (h >= 8) return COLORS.success;
    if (h >= 6) return COLORS.warning;
    return COLORS.danger;
  };

  const calculateWorkDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    try {
      const [inHour, inMin] = checkIn.split(':').map(Number);
      const [outHour, outMin] = checkOut.split(':').map(Number);
      const totalMinutes = outHour * 60 + outMin - (inHour * 60 + inMin);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <GlobalStyles styles={fontImport} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={{ bgcolor: COLORS.bg }}>
          <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
          <Fade in={loading} style={{ transitionDelay: '200ms' }}>
            <Box textAlign="center">
              <CircularProgress size={56} thickness={4} sx={{ mb: 2, color: COLORS.primary }} />
              <Typography sx={{ fontWeight: 600, color: COLORS.ink }}>
                <Display>Loading your timesheets…</Display>
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

      {/* CRITICAL END-OF-DAY ALERT (11:59 PM) */}
      <Snackbar open={criticalAlertVisible} autoHideDuration={0} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert
          elevation={8}
          variant="filled"
          severity="error"
          onClose={() => setCriticalAlertVisible(false)}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                handleOpenAddDialog();
                setCriticalAlertVisible(false);
              }}
            >
              Submit now
            </Button>
          }
          sx={{
            borderRadius: '12px',
            alignItems: 'center',
            fontSize: '0.95rem',
            background: `linear-gradient(135deg, ${COLORS.danger} 0%, #B91C1C 100%)`,
            boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ErrorOutlineIcon sx={{ mr: 1, fontSize: '1.4rem' }} />
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Timesheet not submitted
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                It's past 11:59 PM and your timesheet is overdue. This is required for your attendance record — submit immediately.
              </Typography>
            </Box>
          </Box>
        </MuiAlert>
      </Snackbar>

      {/* Today's Timesheet Early Warning Alert (7:00 PM) */}
      <Snackbar
        open={showTodayAlert && !todayTimesheetStatus?.exists && !todayTimesheetStatus?.isAfter11PM}
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
              Add now
            </Button>
          }
          sx={{ borderRadius: '12px', alignItems: 'center', fontSize: '0.9rem', background: `linear-gradient(135deg, ${COLORS.warning} 0%, #D97706 100%)` }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Timesheet reminder
              </Typography>
              <Typography variant="body2">You haven't submitted today's timesheet yet. Please submit before 11:59 PM.</Typography>
            </Box>
          </Box>
        </MuiAlert>
      </Snackbar>

      <Shell sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: COLORS.bg, minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ display: 'flex', p: 1, borderRadius: '14px', bgcolor: alpha(COLORS.primary, 0.1) }}>
                <AccessTimeIcon sx={{ color: COLORS.primary }} />
              </Box>
              <Display>Timesheets</Display>
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.muted, mt: 0.5 }}>
              Log your daily work and keep your hours on record.
            </Typography>

            {todayTimesheetStatus && (
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={todayTimesheetStatus.message}
                  color={todayTimesheetStatus.exists ? 'success' : todayTimesheetStatus.isAfter11PM ? 'error' : 'warning'}
                  variant="outlined"
                  size="small"
                  icon={todayTimesheetStatus.exists ? <CheckCircleOutlineIcon /> : todayTimesheetStatus.isAfter11PM ? <ErrorOutlineIcon /> : <WarningIcon />}
                />
                {todayTimesheetStatus.isAfter11PM && <Chip label="Overdue — needs immediate action" color="error" variant="filled" size="small" icon={<ErrorOutlineIcon />} />}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip title="Toggle filters">
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  bgcolor: showFilters ? alpha(COLORS.primary, 0.12) : COLORS.bg,
                  color: showFilters ? COLORS.primary : COLORS.muted,
                  border: `1px solid ${COLORS.border}`,
                  '&:hover': { bgcolor: alpha(COLORS.primary, 0.12), color: COLORS.primary },
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
                sx={{ bgcolor: COLORS.bg, color: COLORS.muted, border: `1px solid ${COLORS.border}`, '&:hover': { bgcolor: alpha(COLORS.primary, 0.12), color: COLORS.primary } }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {!isMobile && (
              <GradientButton startIcon={<AddIcon />} onClick={handleOpenAddDialog} size="large">
                Add timesheet
              </GradientButton>
            )}
          </Box>
        </Box>

        {/* Overview */}
        <Surface sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, flexWrap: 'wrap' }}>
            <RadialProgress value={productivityRate} color={COLORS.primary} />

            <Box sx={{ minWidth: 180 }}>
              <Typography variant="overline" sx={{ color: COLORS.faint, letterSpacing: 1, fontWeight: 700 }}>
                Overview
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.ink }}>
                <Display>{stats.productiveDays} productive days logged</Display>
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted }}>
                Employee ID: {empId || 'loading…'}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
              <StatTile label="Total entries" value={filteredTimesheets.length} color={COLORS.primary} icon={<CalendarIcon fontSize="small" />} />
              <StatTile label="Working Hours" value={stats.totalWorkingHours.toFixed(1)} color={COLORS.info} icon={<AccessTimeIcon fontSize="small" />} />
              <StatTile label="OT Hours" value={stats.totalOTHours.toFixed(1)} color={COLORS.orange} icon={<TimerIcon fontSize="small" />} />
              <StatTile label="Total Hours" value={stats.totalHours.toFixed(1)} color={COLORS.success} icon={<CheckCircleIcon fontSize="small" />} />
              <StatTile label="Avg. hours / day" value={stats.avgHours.toFixed(1)} color={COLORS.warning} icon={<TimerIcon fontSize="small" />} />
            </Box>
          </Box>
        </Surface>

        {/* Search and View Mode */}
        <Surface sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField
              fullWidth
              placeholder="Search by date, activity, description, or work mode…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLORS.muted, fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px', bgcolor: COLORS.bg },
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button
                variant={viewMode === 'currentMonth' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('currentMonth')}
                size="small"
                startIcon={<ViewModuleIcon />}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  ...(viewMode === 'currentMonth' && {
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primaryDark} 100%)`,
                    },
                  }),
                  ...(viewMode !== 'currentMonth' && {
                    borderColor: COLORS.border,
                    color: COLORS.muted,
                    '&:hover': {
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                      bgcolor: alpha(COLORS.primary, 0.04),
                    },
                  }),
                }}
              >
                This Month
              </Button>
              <Button
                variant={viewMode === 'all' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('all')}
                size="small"
                startIcon={<ViewListIcon />}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  ...(viewMode === 'all' && {
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primaryDark} 100%)`,
                    },
                  }),
                  ...(viewMode !== 'all' && {
                    borderColor: COLORS.border,
                    color: COLORS.muted,
                    '&:hover': {
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                      bgcolor: alpha(COLORS.primary, 0.04),
                    },
                  }),
                }}
              >
                All Entries
              </Button>
            </Box>
          </Box>

          <Collapse in={showFilters}>
            <Divider sx={{ my: 2.5 }} />
            <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ fontSize: 18, color: COLORS.primary }} />
              Filter timesheets
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3} minWidth={200}>
                <FormControl fullWidth size="small">
                  <InputLabel>Activity category</InputLabel>
                  <Select
                    value={selectedActivity}
                    label="Activity category"
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    sx={{ borderRadius: '10px', bgcolor: COLORS.bg }}
                  >
                    <MenuItem value="all">All activities</MenuItem>
                    {activityCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <ActivityChip label={category} size="small" category={category} sx={{ mr: 1 }} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3} minWidth={200}>
                <FormControl fullWidth size="small">
                  <InputLabel>Work mode</InputLabel>
                  <Select value={selectedWorkMode} label="Work mode" onChange={(e) => setSelectedWorkMode(e.target.value)} sx={{ borderRadius: '10px', bgcolor: COLORS.bg }}>
                    <MenuItem value="all">All work modes</MenuItem>
                    {[...workModes, ...minimalActivityModes].map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        <WorkModeChip label={mode} size="small" mode={mode} sx={{ mr: 1 }} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3} minWidth={180}>
                <DatePicker
                  label="Start date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: COLORS.bg } } } }}
                />
              </Grid>

              <Grid item xs={12} md={3} minWidth={180}>
                <DatePicker
                  label="End date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: COLORS.bg } } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <GradientButton onClick={handleApplyFilters} size="small" startIcon={<FilterIcon />}>
                    Apply filters
                  </GradientButton>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    size="small"
                    sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: '10px', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) } }}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {(selectedActivity !== 'all' || selectedWorkMode !== 'all' || startDate || endDate) && (
              <Typography variant="caption" sx={{ color: COLORS.muted, mt: 1.5, display: 'block' }}>
                Filtering by:
                {selectedActivity !== 'all' && ` Activity = ${selectedActivity}`}
                {selectedWorkMode !== 'all' && `, Work mode = ${selectedWorkMode}`}
                {startDate && endDate && `, Date range: ${format(startDate, 'MMM dd, yyyy')} – ${format(endDate, 'MMM dd, yyyy')}`}
                {viewMode === 'currentMonth' && ', View: Current Month'}
                {viewMode === 'all' && ', View: All Entries'}
              </Typography>
            )}
          </Collapse>
        </Surface>

        {/* Employee info card */}
        {empId && (
          <Surface sx={{ p: 2.25, mb: 2.5 }}>
            <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
              <Avatar sx={{ width: 52, height: 52, bgcolor: alpha(COLORS.primary, 0.12), color: COLORS.primary, fontSize: '1.3rem', fontWeight: 700, border: `2px solid ${alpha(COLORS.primary, 0.2)}` }}>
                {(employeeName || user?.email)?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box flex={1} minWidth={180}>
                <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{employeeName || user?.displayName || user?.email}</Typography>
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  Employee ID: {empId} • {timesheets.length} total entries • {filteredTimesheets.length} {viewMode === 'currentMonth' ? 'this month' : 'shown'}
                  {todayTimesheetStatus && !todayTimesheetStatus.exists && (
                    <Box component="span" sx={{ color: todayTimesheetStatus.isAfter11PM ? COLORS.danger : COLORS.warning, ml: 1, fontWeight: 700 }}>
                      • {todayTimesheetStatus.isAfter11PM ? 'Overdue — urgent' : 'Pending submission'}
                    </Box>
                  )}
                </Typography>
              </Box>
              <Chip label={`${stats.avgHours.toFixed(1)}h average`} variant="outlined" icon={<TimerIcon />} sx={{ borderColor: alpha(COLORS.success, 0.4), color: COLORS.success }} />
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} alerts`}
                  variant="filled"
                  icon={<NotificationsIcon />}
                  onClick={openNotificationDrawer}
                  clickable
                  sx={{ bgcolor: COLORS.danger, color: 'white', '&:hover': { bgcolor: '#DC2626' } }}
                />
              )}
            </Box>
          </Surface>
        )}

        {/* Timesheets table */}
        <Surface sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 480px)', minHeight: 320 }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, width: 48, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }} />
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Date / Day</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Activity</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Work mode</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Description</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Hours</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`, width: 150 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((row) => {
                    const expanded = expandedRows.includes(row.id);
                    // Calculate working hours (total_hours - ot_hours)
                    const workingHours = (parseFloat(row.total_hours) || 0) - (parseFloat(row.ot_hours) || 0);
                    const otHours = parseFloat(row.ot_hours) || 0;
                    const totalHours = parseFloat(row.total_hours) || 0;
                    
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow hover sx={{ '&:hover': { bgcolor: alpha(COLORS.primary, 0.03) }, borderBottom: expanded ? 'none' : `1px solid ${COLORS.border}` }}>
                          <TableCell>
                            <IconButton size="small" onClick={() => toggleRowExpansion(row.id)} sx={{ color: COLORS.muted }}>
                              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                              {format(parseISO(row.date), 'dd/MM/yyyy')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.muted }}>
                              {row.day}
                              {row.date === format(new Date(), 'yyyy-MM-dd') && (
                                <Chip label="Today" size="small" variant="outlined" sx={{ ml: 1, fontSize: '0.6rem', height: 18, borderColor: alpha(COLORS.success, 0.4), color: COLORS.success }} />
                              )}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <ActivityChip label={row.activity_category} size="small" category={row.activity_category} />
                          </TableCell>

                          <TableCell>
                            <WorkModeChip label={row.work_mode} size="small" mode={row.work_mode} />
                          </TableCell>

                          <TableCell sx={{ maxWidth: 220 }}>
                            <Tooltip title={row.description || 'No description'} arrow>
                              <Typography
                                variant="body2"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  color: row.description ? COLORS.ink : COLORS.faint,
                                  fontStyle: row.description ? 'normal' : 'italic',
                                }}
                              >
                                {row.description || 'No description provided'}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getHoursColor(totalHours), mr: 1 }} />
                              <Typography variant="body2" fontWeight="bold" sx={{ color: getHoursColor(totalHours) }}>
                                {totalHours.toFixed(1)}h
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenEditDialog(row)} sx={{ bgcolor: alpha(COLORS.primary, 0.08), color: COLORS.primary, '&:hover': { bgcolor: COLORS.primary, color: 'white' } }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ bgcolor: alpha(COLORS.danger, 0.08), color: COLORS.danger, '&:hover': { bgcolor: COLORS.danger, color: 'white' } }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 0, border: expanded ? undefined : 'none' }}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, bgcolor: COLORS.bg }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <AccessTimeIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                                      Time tracking
                                    </Typography>
                                    <Grid container spacing={2}>
                                      {[
                                        { icon: <LoginIcon />, label: 'Check in', value: formatTime(row.check_in), color: COLORS.info },
                                        { icon: <LogoutIcon />, label: 'Check out', value: formatTime(row.check_out), color: COLORS.danger },
                                        { icon: <LunchDiningIcon />, label: 'Lunch in', value: formatTime(row.lunch_in), color: COLORS.warning },
                                        { icon: <LunchDiningIcon />, label: 'Lunch out', value: formatTime(row.lunch_out), color: COLORS.violet },
                                      ].map((item, idx) => (
                                        <Grid item xs={6} key={idx}>
                                          <Box sx={{ p: 1.75, bgcolor: alpha(item.color, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(item.color, 0.18)}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                                              {React.cloneElement(item.icon, { sx: { mr: 1, fontSize: 18, color: item.color } })}
                                              <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                                                {item.label}
                                              </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>
                                              {item.value}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      ))}
                                    </Grid>

                                    <Box sx={{ p: 1.75, mt: 2, bgcolor: alpha(COLORS.primary, 0.06), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.primary, 0.18)}` }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.primary }}>
                                        Work duration (Check-in to Check-out)
                                      </Typography>
                                      <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.primary }}>
                                        {calculateWorkDuration(row.check_in, row.check_out)}
                                      </Typography>
                                    </Box>
                                  </Grid>

                                  <Grid item xs={12} md={6}>
                                    <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <InfoIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                                      Hours Breakdown
                                    </Typography>

                                    <Box sx={{ p: 1.75, mb: 2, bgcolor: alpha(COLORS.warning, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.warning, 0.2)}` }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.warning, mb: 0.5 }}>
                                        Description
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: COLORS.ink }}>
                                        {row.description || 'No description provided'}
                                      </Typography>
                                    </Box>

                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                      <Grid item xs={6}>
                                        <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.info, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.info, 0.2)}` }}>
                                          <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                                            Working Hours
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.info }}>
                                            {workingHours.toFixed(1)}h
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                            Total - OT
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.orange, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.orange, 0.2)}` }}>
                                          <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                                            OT Hours
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.orange }}>
                                            {otHours.toFixed(1)}h
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                            Overtime
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12}>
                                        <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.success, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.success, 0.2)}` }}>
                                          <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                                            Total Hours
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.success }}>
                                            {totalHours.toFixed(1)}h
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                            Working Hours + OT Hours
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>

                                    {row.permission_hours > 0 && (
                                      <Box sx={{ p: 1.75, mb: 2, bgcolor: alpha(COLORS.danger, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.danger, 0.2)}` }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.danger, mb: 0.5 }}>
                                          Permission Hours
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.ink }}>
                                          {row.permission_hours}h (subtracted from working hours)
                                        </Typography>
                                      </Box>
                                    )}

                                    {row.remark && (
                                      <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.primary, 0.06), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.primary, 0.18)}` }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.primary, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <CommentIcon sx={{ fontSize: 16 }} />
                                          Supervisor remark
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.ink }}>
                                          {row.remark}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <AccessTimeIcon sx={{ fontSize: 56, color: alpha(COLORS.muted, 0.3), mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          {searchTerm ? 'No matching records found' : viewMode === 'currentMonth' ? 'No timesheet entries for this month' : 'No timesheet entries yet'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.muted }}>
                          {searchTerm ? 'Try adjusting your search or filters.' : viewMode === 'currentMonth' ? "Click \"Add timesheet\" to log your work for this month." : "Click \"Add timesheet\" to create your first entry."}
                        </Typography>
                        {!todayTimesheetStatus?.exists && (
                          <GradientButton startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mt: 2.5 }}>
                            Add today's timesheet
                          </GradientButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredTimesheets.length > 0 && (
            <Box sx={{ p: 2, bgcolor: COLORS.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, borderTop: `1px solid ${COLORS.border}` }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, fontWeight: 500 }}>
                Showing {filteredTimesheets.length} of {timesheets.length} entries
                {viewMode === 'currentMonth' && ' (Current Month)'}
                {viewMode === 'all' && ' (All Entries)'}
                {selectedActivity !== 'all' && ` in ${selectedActivity}`}
                {selectedWorkMode !== 'all' && ` with ${selectedWorkMode}`}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 18 }} />
                Total Hours: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0).toFixed(1)}h
              </Typography>
            </Box>
          )}
        </Surface>

        {/* Add/Edit dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' } }}>
          <Box sx={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: 'white', p: 3 }}>
            <DialogTitle sx={{ color: 'white', p: 0, fontWeight: 700 }}>
              <Display>{dialogMode === 'add' ? 'Add timesheet entry' : 'Edit timesheet entry'}</Display>
            </DialogTitle>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              {dialogMode === 'add' ? 'Log how you spent today.' : 'Update the details of this entry.'}
            </Typography>
          </Box>

          <Divider />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 }, flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
                DATE & ACTIVITY
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
                <Grid item xs={12} sm={6} minWidth={220}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(newDate) => setFormData((prev) => ({ ...prev, date: newDate }))}
                    disabled={dialogMode === 'edit'}
                    maxDate={new Date()}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } },
                        helperText: "Only current or past dates allowed"
                      } 
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} width={'33%'}>
                  <TextField select fullWidth required label="Activity category" name="activity_category" value={formData.activity_category} onChange={handleActivityChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                    {activityCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <ActivityChip label={category} size="small" category={category} sx={{ mr: 1 }} />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {!isMinimalActivity(formData.activity_category) && (
                  <Grid item xs={12} sm={6} width={'33%'}>
                    <TextField select fullWidth required label="Work mode" name="work_mode" value={formData.work_mode} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                      {workModes.map((mode) => (
                        <MenuItem key={mode} value={mode}>
                          <WorkModeChip label={mode} size="small" mode={mode} sx={{ mr: 1 }} />
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>

              {(formData.activity_category === 'Full Day Leave' || formData.activity_category === 'Sunday / Holiday') && (
                <Alert severity="info" sx={{ borderRadius: 2.5, mb: 2, bgcolor: alpha(COLORS.info, 0.08), color: COLORS.ink, border: `1px solid ${alpha(COLORS.info, 0.25)}` }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    No time tracking required for {formData.activity_category}. Just select the activity and submit.
                  </Typography>
                </Alert>
              )}

              {requiresTimeTracking(formData.activity_category) && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
                    TIME TRACKING
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
                    <Grid item xs={12} sm={6} md={3} width={'23%'}>
                      <TextField fullWidth required type="time" label="Check in" name="check_in" value={formData.check_in} onChange={handleInputChange} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} width={'24%'}>
                      <TextField fullWidth type="time" label="Check out" name="check_out" value={formData.check_out} onChange={handleInputChange} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} width={'24%'}>
                      <TextField fullWidth type="time" label="Lunch in" name="lunch_in" value={formData.lunch_in} onChange={handleInputChange} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} width={'23%'}>
                      <TextField fullWidth type="time" label="Lunch out" name="lunch_out" value={formData.lunch_out} onChange={handleInputChange} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                  </Grid>
                </>
              )}

              {(formData.activity_category === 'Productive Effort' || !isMinimalActivity(formData.activity_category)) && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
                    NOTES & HOURS
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    {formData.activity_category === 'Productive Effort' && (
                      <>
                        <Grid item xs={12} sm={4} width={'100%'}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Permission hours (optional)"
                            name="permission_hours"
                            value={formData.permission_hours}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            InputProps={{ inputProps: { min: 0, max: 8, step: 0.5 }, endAdornment: <Typography variant="body2" sx={{ color: COLORS.muted }}>hours</Typography> }}
                            helperText="Subtracted from working hours"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} width={'100%'}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Overtime hours"
                            name="overtime_hours"
                            value={formData.overtime_hours}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            InputProps={{ inputProps: { min: 0, max: 12, step: 0.5 }, endAdornment: <Typography variant="body2" sx={{ color: COLORS.muted }}>hours</Typography> }}
                            helperText="Additional hours worked beyond regular schedule"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} width={'100%'}>
                          <Box sx={{ p: 2, bgcolor: alpha(COLORS.info, 0.08), borderRadius: '12px', border: `1px solid ${alpha(COLORS.info, 0.2)}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 600 }}>
                              Total Hours Preview
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.info }}>
                              {(
                                calculateWorkingHours(
                                  formData.check_in,
                                  formData.check_out,
                                  formData.lunch_in,
                                  formData.lunch_out,
                                  formData.permission_hours
                                ) + (parseFloat(formData.overtime_hours) || 0)
                              ).toFixed(1)}h
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.muted }}>
                              Working + OT hours
                            </Typography>
                          </Box>
                        </Grid>
                      </>
                    )}

                    {!isMinimalActivity(formData.activity_category) && (
                      <Grid item xs={12} width={'100%'}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Work description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your tasks, achievements, and any challenges faced today…"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

            </DialogContent>

            <Box sx={{ p: 2, bgcolor: COLORS.bg, borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <DialogActions sx={{ p: 0 }}>
                <Button
                  onClick={handleCloseDialog}
                  disabled={saving}
                  variant="outlined"
                  sx={{ px: 3, py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: COLORS.border, color: COLORS.muted, '&:hover': { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) } }}
                >
                  Cancel
                </Button>
                <GradientButton type="submit" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} sx={{ minWidth: 160 }}>
                  {saving ? 'Saving…' : dialogMode === 'add' ? 'Add timesheet' : 'Save changes'}
                </GradientButton>
              </DialogActions>
            </Box>
          </form>
        </Dialog>
      </Shell>
    </LocalizationProvider>
  );
};

export default TimesheetPage;
