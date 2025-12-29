import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  MenuItem,
  Alert,
  Snackbar,
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
  useTheme,
  alpha,
  Divider,
  Avatar,
  Fade,
  Zoom,
  Tab,
  Tabs,
  Badge,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  ListItemText,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText as MuiListItemText,
  styled,
  Fab,
  useMediaQuery,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  HourglassEmpty as InProgressIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Label as LabelIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  ViewModule as ViewModuleIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  Pending as PendingActions,
  SearchOutlined as Search,
  ExpandMore,
  Groups,
  Description,
  AttachFile,
  CheckCircleOutline,
  Cancel,
  VideoCall,
  Person,
  LocationOn,
  ThumbUp,
  ThumbDown,
  Visibility,
  FilePresent,
  Timer,
  BarChart,
  DateRange,
  People,
  ArrowUpward,
  ArrowDownward,
  DoneAll,
  Home,
  Work,
  Send,
  PlayArrow,
  MeetingRoom
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  format, 
  parseISO, 
  isPast, 
  isToday, 
  isFuture,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Config';
import { API_BASE_URL } from '../Config';

// Setup moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  height: "100%",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 20px rgba(46, 125, 50, 0.15)",
    border: "1px solid rgba(46, 125, 50, 0.2)",
  },
}));

const GradientTypography = styled(Typography)(({ theme }) => ({
  background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 700,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 24px",
  fontWeight: 600,
  "&:hover": {
    background: "linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(46, 125, 50, 0.25)",
  },
}));

const CalendarContainer = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  padding: theme.spacing(3),
  height: "70vh",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
}));

const StyledCalendar = styled(Box)(({ theme }) => ({
  '& .rbc-calendar': {
    fontFamily: theme.typography.fontFamily,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
  },
  '& .rbc-header': {
    background: alpha(theme.palette.success.main, 0.08),
    color: theme.palette.text.primary,
    fontWeight: 'bold',
    padding: '12px 6px',
    borderBottom: `2px solid ${theme.palette.success.main}`,
  },
  '& .rbc-today': {
    background: alpha(theme.palette.warning.main, 0.1),
  },
  '& .rbc-off-range-bg': {
    background: alpha(theme.palette.action.disabled, 0.05),
  },
  '& .rbc-event': {
    borderRadius: '8px',
    border: 'none',
    padding: '4px 8px',
    margin: '2px 0',
    fontSize: '0.85rem',
    minHeight: '24px',
  },
  '& .rbc-selected': {
    background: alpha(theme.palette.success.main, 0.2),
  },
  '& .rbc-toolbar': {
    marginBottom: theme.spacing(3),
    '& button': {
      borderColor: alpha(theme.palette.success.main, 0.3),
      color: theme.palette.success.main,
      textTransform: 'none',
      fontWeight: 500,
      borderRadius: '8px',
      '&:hover': {
        background: alpha(theme.palette.success.main, 0.1),
        borderColor: theme.palette.success.main,
      },
      '&.rbc-active': {
        background: theme.palette.success.main,
        color: 'white',
        borderColor: theme.palette.success.main,
        '&:hover': {
          background: theme.palette.success.dark,
        }
      }
    }
  },
  '& .rbc-month-view': {
    border: 'none',
  },
  '& .rbc-month-row': {
    minHeight: '120px',
  },
  '& .rbc-date-cell': {
    padding: '8px 4px',
    textAlign: 'center',
    '& button': {
      fontWeight: '600',
      color: theme.palette.text.primary,
    }
  },
  '& .rbc-day-bg': {
    border: '1px solid rgba(0, 0, 0, 0.05)',
    '&:hover': {
      backgroundColor: alpha(theme.palette.success.main, 0.02),
    }
  }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: "rgba(46, 125, 50, 0.1)",
  "& .MuiLinearProgress-bar": {
    borderRadius: 5,
    background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
  },
}));

const Todo = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    in_progress: 0,
    overdue: 0,
    avg_completion_days: 0
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [editingTodo, setEditingTodo] = useState(null);
  const [empId, setEmpId] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState([]);
  const [filterCategory, setFilterCategory] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  
  // Calendar state
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPopover, setEventPopover] = useState({
    open: false,
    anchorEl: null,
    todo: null
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null,
    category: '',
    tags: ''
  });

  // Priority options
  const priorities = [
    { value: 'high', label: 'High', color: 'error' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'low', label: 'Low', color: 'success' }
  ];

  // Status options
  const statuses = [
    { value: 'pending', label: 'Pending', icon: <PendingIcon />, color: 'warning' },
    { value: 'in_progress', label: 'In Progress', icon: <InProgressIcon />, color: 'info' },
    { value: 'completed', label: 'Completed', icon: <CheckCircleIcon />, color: 'success' }
  ];

  // Category options
  const categories = [
    'Work',
    'Personal',
    'Project',
    'Meeting',
    'Learning',
    'Health',
    'Finance',
    'Shopping',
    'Other'
  ];

  // Convert todos to calendar events
  const calendarEvents = todos.map(todo => {
    const startDate = todo.due_date ? parseISO(todo.due_date) : new Date();
    const endDate = todo.due_date ? parseISO(todo.due_date) : new Date();
    
    // Get color based on priority
    let backgroundColor;
    switch (todo.priority) {
      case 'high':
        backgroundColor = '#F44336'; // Red
        break;
      case 'medium':
        backgroundColor = '#FF9800'; // Orange
        break;
      case 'low':
        backgroundColor = '#4CAF50'; // Green
        break;
      default:
        backgroundColor = '#2196F3'; // Blue
    }

    return {
      id: todo.id,
      title: todo.title,
      start: startOfDay(startDate),
      end: endOfDay(endDate),
      allDay: true,
      todo: todo,
      status: todo.status,
      priority: todo.priority,
      style: {
        backgroundColor,
        borderColor: backgroundColor,
        color: 'white',
        opacity: todo.status === 'completed' ? 0.7 : 1,
        borderRadius: '6px',
        padding: '4px 8px',
        margin: '2px 4px',
        fontSize: '0.8rem',
        fontWeight: '500',
      }
    };
  });

  // Fetch employee numeric ID from database
  const fetchEmpId = async () => {
    if (!user?.uid) {
      console.log('No user found');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const userData = snap.data();
        const employeeCode = userData.empId || `EMP${user.uid.substring(0, 6)}`;
        const employeeName = userData.displayName || userData.name || 'New User';
        const employeeEmail = userData.email || `${employeeCode}@company.com`;
        
        console.log('Fetching employee ID for:', employeeCode);
        
        // Step 1: Try to get existing employee ID
        try {
          const response = await fetch(`${API_BASE_URL}todos/get-employee-id/${employeeCode}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Found existing employee ID:', data.id);
            setEmpId(data.id);
          } else {
            // Step 2: Create new employee if not exists
            console.log('Creating new employee...');
            const createResponse = await fetch(`${API_BASE_URL}todos/create-employee`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                emp_id: employeeCode,
                employee_name: employeeName,
                email: employeeEmail,
                firebase_uid: user.uid
              })
            });
            
            if (createResponse.ok) {
              const newEmployee = await createResponse.json();
              console.log('Created new employee with ID:', newEmployee.id);
              setEmpId(newEmployee.id);
            } else {
              console.error('Failed to create employee');
              setEmpId(1); // Fallback to default ID
            }
          }
        } catch (err) {
          console.error('Error in employee lookup:', err);
          setEmpId(1); // Fallback to default ID
        }
      } else {
        console.log('No user data found in Firestore');
        setEmpId(1); // Fallback to default ID
      }
    } catch (err) {
      console.error('Failed to fetch from Firestore:', err);
      setEmpId(1); // Final fallback
    }
  };

  // Fetch all todos
  const fetchTodos = async () => {
    if (!empId || empId === '') {
      console.log('No empId available yet');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching todos for empId:', empId);
      const response = await fetch(`${API_BASE_URL}todos/employee/${empId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched todos:', data.length);
        setTodos(data);
        fetchStats();
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch todos:', errorText);
        setError('Failed to fetch todos');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    if (!empId || empId === '') return;
    
    try {
      const response = await fetch(`${API_BASE_URL}todos/employee/${empId}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched stats:', data);
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
        // Calculate from local todos
        const localStats = calculateLocalStats();
        setStats(localStats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      const localStats = calculateLocalStats();
      setStats(localStats);
    }
  };

  // Calculate stats from local todos
  const calculateLocalStats = () => {
    const total = todos.length;
    const completed = todos.filter(t => t.status === 'completed').length;
    const pending = todos.filter(t => t.status === 'pending').length;
    const in_progress = todos.filter(t => t.status === 'in_progress').length;
    
    const overdue = todos.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      try {
        const dueDate = parseISO(t.due_date);
        return isPast(dueDate) && !isToday(dueDate);
      } catch {
        return false;
      }
    }).length;
    
    return {
      total,
      completed,
      pending,
      in_progress,
      overdue,
      avg_completion_days: 0
    };
  };

  useEffect(() => {
    console.log('User changed, fetching empId');
    fetchEmpId();
  }, [user?.uid]);

  useEffect(() => {
    if (empId && empId !== '') {
      console.log('empId updated, fetching todos:', empId);
      fetchTodos();
    }
  }, [empId]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: null,
      category: '',
      tags: ''
    });
    setEditingTodo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (todo) => {
    setDialogMode('edit');
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      status: todo.status,
      priority: todo.priority,
      due_date: todo.due_date ? new Date(todo.due_date) : null,
      category: todo.category || '',
      tags: Array.isArray(todo.tags) ? todo.tags.join(', ') : (todo.tags || '')
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!empId) {
      setError('Employee ID not found. Please refresh the page.');
      return;
    }

    setSaving(true);
    try {
      const dueDateStr = formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null;
      
      const payload = {
        emp_id: parseInt(empId), // Ensure it's a number
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        due_date: dueDateStr,
        category: formData.category.trim() || null,
        tags: formData.tags.trim()
      };

      console.log('Submitting todo:', payload);

      const url = dialogMode === 'edit' && editingTodo
        ? `${API_BASE_URL}todos/${editingTodo.id}`
        : `${API_BASE_URL}todos`;
      
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
        setSuccess(dialogMode === 'edit' ? 'Todo updated successfully!' : 'Todo added successfully!');
        handleCloseDialog();
        fetchTodos();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save todo');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}todos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Todo deleted successfully!');
        fetchTodos();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete todo');
      }
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}todos/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccess('Status updated successfully!');
        fetchTodos();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  // Calendar event handlers
  const handleSelectEvent = (event, e) => {
    setEventPopover({
      open: true,
      anchorEl: e.target,
      todo: event.todo
    });
    setSelectedEvent(event);
  };

  const handleCloseEventPopover = () => {
    setEventPopover({
      open: false,
      anchorEl: null,
      todo: null
    });
    setSelectedEvent(null);
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView) => {
    setCalendarView(newView);
  };

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center" 
      mb={3}
      flexWrap="wrap"
      gap={2}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton 
          onClick={() => onNavigate('PREV')}
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            '&:hover': {
              bgcolor: theme.palette.success.main,
              color: 'white'
            }
          }}
        >
          <ChevronLeft />
        </IconButton>
        
        <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ minWidth: 200, textAlign: 'center' }}>
          {label}
        </Typography>
        
        <IconButton 
          onClick={() => onNavigate('NEXT')}
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            '&:hover': {
              bgcolor: theme.palette.success.main,
              color: 'white'
            }
          }}
        >
          <ChevronRight />
        </IconButton>
        
     
      </Box>
      
      <Box display="flex" gap={1}>
        <Button
          variant={calendarView === 'month' ? 'contained' : 'outlined'}
          startIcon={<CalendarMonthIcon />}
          onClick={() => onView('month')}
          size={isMobile ? "small" : "medium"}
          sx={{
            bgcolor: calendarView === 'month' ? theme.palette.success.main : 'transparent',
            borderColor: calendarView === 'month' ? 'transparent' : theme.palette.success.main,
            color: calendarView === 'month' ? 'white' : theme.palette.success.main,
            '&:hover': {
              bgcolor: calendarView === 'month' ? theme.palette.success.dark : alpha(theme.palette.success.main, 0.1)
            }
          }}
        >
          Month
        </Button>
        
        
        
    
        
      
      </Box>
    </Box>
  );

  // Get priority chip props
  const getPriorityProps = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return {
      color: priorityObj?.color || 'default',
      label: priorityObj?.label || priority
    };
  };

  // Get status chip props
  const getStatusProps = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return {
      color: statusObj?.color || 'default',
      label: statusObj?.label || status,
      icon: statusObj?.icon
    };
  };

  // Get due date status
  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { label: 'No due date', color: 'default' };
    
    try {
      const date = parseISO(dueDate);
      if (isPast(date) && !isToday(date)) {
        return { label: 'Overdue', color: 'error' };
      } else if (isToday(date)) {
        return { label: 'Today', color: 'warning' };
      } else if (isFuture(date)) {
        const daysDiff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        return { 
          label: `${daysDiff} day${daysDiff !== 1 ? 's' : ''} left`, 
          color: daysDiff <= 3 ? 'warning' : 'success' 
        };
      }
      return { label: format(date, 'MMM d'), color: 'default' };
    } catch {
      return { label: 'Invalid date', color: 'error' };
    }
  };

  // Filter todos based on active tab and filters
  const filteredTodos = todos.filter(todo => {
    // Filter by tab
    if (activeTab !== 'all' && todo.status !== activeTab) {
      return false;
    }
    
    // Filter by priority
    if (filterPriority.length > 0 && !filterPriority.includes(todo.priority)) {
      return false;
    }
    
    // Filter by category
    if (filterCategory.length > 0 && todo.category && !filterCategory.includes(todo.category)) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        todo.title.toLowerCase().includes(searchLower) ||
        (todo.description && todo.description.toLowerCase().includes(searchLower)) ||
        (todo.category && todo.category.toLowerCase().includes(searchLower)) ||
        (Array.isArray(todo.tags) && todo.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    return true;
  });

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const renderCalendarView = () => (
    <CalendarContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <GradientTypography variant="h6">
          <CalendarIcon
            sx={{
              mr: 1,
              verticalAlign: "middle",
              color: "rgba(46, 125, 50, 0.8)",
            }}
          />
          Calendar View
        </GradientTypography>
      </Box>
      <Box sx={{ height: "90%" }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          eventPropGetter={(event) => ({
            style: event.style
          })}
          views={["month", "week", "day", "agenda"]}
          defaultView={calendarView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          components={{
            toolbar: CustomToolbar
          }}
          messages={{
            today: 'Today',
            previous: 'Previous',
            next: 'Next',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Time',
            event: 'Event',
            noEventsInRange: 'No tasks scheduled for this period.'
          }}
        />
      </Box>
    </CalendarContainer>
  );

  const renderTableView = () => (
    <Paper 
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}
    >
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 'bold',
                py: 2,
                borderBottom: `2px solid ${theme.palette.success.main}`,
                width: '40%'
              }}>
                <Box display="flex" alignItems="center">
                  <TaskIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.success.main }} />
                  Task Details
                </Box>
              </TableCell>
              <TableCell sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 'bold',
                py: 2,
                borderBottom: `2px solid ${theme.palette.success.main}`
              }}>
                Status
              </TableCell>
              <TableCell sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 'bold',
                py: 2,
                borderBottom: `2px solid ${theme.palette.success.main}`
              }}>
                Priority
              </TableCell>
              <TableCell sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 'bold',
                py: 2,
                borderBottom: `2px solid ${theme.palette.success.main}`
              }}>
                Due Date
              </TableCell>
              <TableCell sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 'bold',
                py: 2,
                borderBottom: `2px solid ${theme.palette.success.main}`
              }}>
                Category
              </TableCell>
              <TableCell sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 'bold',
                py: 2,
                borderBottom: `2px solid ${theme.palette.success.main}`
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTodos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box textAlign="center">
                    <TaskIcon 
                      sx={{ 
                        fontSize: 64, 
                        color: alpha(theme.palette.text.secondary, 0.3),
                        mb: 2 
                      }} 
                    />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {loading ? 'Loading todos...' : 'No todos found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || filterPriority.length > 0 || filterCategory.length > 0 
                        ? 'Try adjusting your filters or search terms' 
                        : 'Click "Add Todo" to create your first task'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTodos.map((todo, index) => (
                <Fade in={true} timeout={index * 100} key={todo.id}>
                  <TableRow 
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.04)
                      },
                      '&:nth-of-type(even)': {
                        bgcolor: alpha(theme.palette.action.hover, 0.02)
                      }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          {todo.title}
                        </Typography>
                        {todo.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {todo.description}
                          </Typography>
                        )}
                        {Array.isArray(todo.tags) && todo.tags.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                            {todo.tags.map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 20
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          icon={getStatusProps(todo.status).icon}
                          label={getStatusProps(todo.status).label}
                          color={getStatusProps(todo.status).color}
                          size="small"
                          sx={{ mb: 1, fontWeight: 500 }}
                        />
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {statuses.map((status) => (
                            <Tooltip key={status.value} title={`Mark as ${status.label}`} arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(todo.id, status.value)}
                                sx={{
                                  bgcolor: todo.status === status.value 
                                    ? alpha(theme.palette[status.color].main, 0.2)
                                    : alpha(theme.palette.action.hover, 0.1),
                                  color: todo.status === status.value 
                                    ? theme.palette[status.color].main
                                    : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette[status.color].main, 0.1)
                                  }
                                }}
                              >
                                {React.cloneElement(status.icon, { fontSize: 'small' })}
                              </IconButton>
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getPriorityProps(todo.priority).label}
                        color={getPriorityProps(todo.priority).color}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {todo.due_date ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {format(parseISO(todo.due_date), 'MMM d, yyyy')}
                          </Typography>
                          <Chip
                            label={getDueDateStatus(todo.due_date).label}
                            size="small"
                            color={getDueDateStatus(todo.due_date).color}
                            variant="outlined"
                            sx={{ mt: 0.5, fontSize: '0.7rem' }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          No due date
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {todo.category ? (
                        <Chip
                          label={todo.category}
                          icon={<CategoryIcon />}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            color: theme.palette.primary.main
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Uncategorized
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit" arrow>
                          <IconButton 
                            size="small" 
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                bgcolor: theme.palette.primary.main,
                                color: 'white'
                              }
                            }}
                            onClick={() => handleOpenEditDialog(todo)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete" arrow>
                          <IconButton 
                            size="small" 
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              '&:hover': {
                                bgcolor: theme.palette.error.main,
                                color: 'white'
                              }
                            }}
                            onClick={() => handleDelete(todo.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </Fade>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  if (loading && todos.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`
        }}
      >
        <Fade in={loading} style={{ transitionDelay: '200ms' }}>
          <Box textAlign="center">
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{ 
                color: theme.palette.success.main,
                mb: 2 
              }}
            />
            <Typography 
              variant="h6" 
              color="success.main"
              sx={{ fontWeight: 500 }}
            >
              Loading Todos...
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, px: 4, py: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 700, display: "flex", alignItems: "center" }}
            >
              <TaskIcon sx={{ mr: 2, color: "rgba(46, 125, 50, 0.7)" }} />
              <GradientTypography variant="h4">
                Todo Management
              </GradientTypography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track your tasks efficiently
            </Typography>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4} minWidth={"250px"}>
            <StyledCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{ color: "#2E7D32", fontWeight: 700 }}
                    >
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </Box>
                  <DashboardIcon sx={{ fontSize: 40, color: "#2E7D32" }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Employee ID: {empId || 'Loading...'}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4} minWidth={"250px"}>
            <StyledCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{ color: "#4CAF50", fontWeight: 700 }}
                    >
                      {stats.completed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                  <CheckCircleOutline sx={{ fontSize: 40, color: "#4CAF50" }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {completionPercentage.toFixed(0)}% done
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4} minWidth={"250px"}>
            <StyledCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{ color: "#2196F3", fontWeight: 700 }}
                    >
                      {stats.in_progress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                  <Timer sx={{ fontSize: 40, color: "#2196F3" }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                      Active tasks
                    </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4} minWidth={"250px"}>
            <StyledCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{ color: "#FF9800", fontWeight: 700 }}
                    >
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                  <PendingActions sx={{ fontSize: 40, color: "#FF9800" }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Waiting to start
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4} minWidth={"250px"}>
            <StyledCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{ color: "#F44336", fontWeight: 700 }}
                    >
                      {stats.overdue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </Box>
                  <AccessTimeIcon sx={{ fontSize: 40, color: "#F44336" }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Past due date
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Progress Overview */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 },
            mb: 4, 
            borderRadius: 3,
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold" color="success.main">
            <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
            Progress Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1, fontSize: 18 }} />
                <Typography variant="body2">Completed</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {stats.completed} ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
                </Typography>
              </Box>
              <ProgressBar 
                variant="determinate" 
                value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <InProgressIcon sx={{ color: theme.palette.info.main, mr: 1, fontSize: 18 }} />
                <Typography variant="body2">In Progress</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {stats.in_progress} ({stats.total > 0 ? Math.round((stats.in_progress / stats.total) * 100) : 0}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.in_progress / stats.total) * 100 : 0}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.info.main
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" mb={1}>
                <PendingIcon sx={{ color: theme.palette.warning.main, mr: 1, fontSize: 18 }} />
                <Typography variant="body2">Pending</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ ml: 'auto' }}>
                  {stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.warning.main
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Search and Filter */}
        <StyledCard>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}minWidth={'250px'}>
                <TextField
                  fullWidth
                  placeholder="Search tasks by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "#2E7D32" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "10px",p:1 },
                  }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={3}minWidth={'250px'}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    multiple
                    value={filterPriority}
                    label="Priority"
                    onChange={(e) => setFilterPriority(e.target.value)}
                    sx={{ borderRadius: "10px",p:1 }}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Checkbox checked={filterPriority.indexOf(priority.value) > -1} />
                        <Chip 
                          label={priority.label} 
                          size="small" 
                          color={priority.color}
                          sx={{ ml: 1 }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}minWidth={'250px'}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    multiple
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => setFilterCategory(e.target.value)}
                    sx={{ borderRadius: "10px",p:1}}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <Checkbox checked={filterCategory.indexOf(category) > -1} />
                        <ListItemText primary={category} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
                >
                  <Button
                    startIcon={<RefreshIcon />}
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterPriority([]);
                      setFilterCategory([]);
                    }}
                    sx={{
                      borderColor: "#2E7D32",
                      color: "#2E7D32",
                      borderRadius: "10px",
                      p:1,
                      "&:hover": {
                        borderColor: "#388E3C",
                        backgroundColor: "rgba(46, 125, 50, 0.05)",
                      },
                    }}
                  >
                    Reset Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>

        {/* View Mode Toggle */}
        <Box sx={{ mb: 3, mt: 3 }}>
          <Paper 
            elevation={0}
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden'
            }}
          >
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ 
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.05)
              }}
            >
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {viewMode === 'calendar' ? 'Calendar View' : 'Table View'}
              </Typography>
              
              <Box display="flex" gap={1}>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  startIcon={<ViewModuleIcon />}
                  onClick={() => setViewMode('table')}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    minWidth: isMobile ? 120 : 140,
                    bgcolor: viewMode === 'table' ? theme.palette.success.main : 'transparent',
                    borderColor: viewMode === 'table' ? 'transparent' : theme.palette.success.main,
                    color: viewMode === 'table' ? 'white' : theme.palette.success.main,
                    '&:hover': {
                      bgcolor: viewMode === 'table' ? theme.palette.success.dark : alpha(theme.palette.success.main, 0.1)
                    }
                  }}
                >
                  View Table
                </Button>
                
                <Button
                  variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => setViewMode('calendar')}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    minWidth: isMobile ? 120 : 140,
                    bgcolor: viewMode === 'calendar' ? theme.palette.info.main : 'transparent',
                    borderColor: viewMode === 'calendar' ? 'transparent' : theme.palette.info.main,
                    color: viewMode === 'calendar' ? 'white' : theme.palette.info.main,
                    '&:hover': {
                      bgcolor: viewMode === 'calendar' ? theme.palette.info.dark : alpha(theme.palette.info.main, 0.1)
                    }
                  }}
                >
                  View Calendar
                </Button>
              </Box>
            </Box>

            {/* Status Tabs - Only for table view */}
            {viewMode === 'table' && (
              <Box sx={{ px: 3, pb: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      minWidth: 'auto',
                      px: 1.5
                    }
                  }}
                >
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center">
                        <DashboardIcon sx={{ mr: 0.5, fontSize: 18 }} />
                        All
                        <Badge 
                          badgeContent={todos.length} 
                          color="success" 
                          sx={{ ml: 2 }} 
                          size="small"
                        />
                      </Box>
                    } 
                    value="all" 
                  />
                  {statuses.map((status) => (
                    <Tab 
                      key={status.value}
                      label={
                        <Box display="flex" alignItems="center">
                          {React.cloneElement(status.icon, { sx: { fontSize: 18, mr: 0.5 } })}
                          <span>{status.label}</span>
                          <Badge 
                            badgeContent={todos.filter(t => t.status === status.value).length} 
                            color={status.color} 
                            sx={{ ml: 2 }} 
                            size="small"
                          />
                        </Box>
                      } 
                      value={status.value} 
                    />
                  ))}
                </Tabs>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Main Content - Calendar or Table */}
        {viewMode === 'calendar' ? renderCalendarView() : renderTableView()}

        {/* Event Details Popover */}
        <Popover
          open={eventPopover.open}
          anchorEl={eventPopover.anchorEl}
          onClose={handleCloseEventPopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              width: 400,
              maxWidth: '90vw',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }
          }}
        >
          {eventPopover.todo && (
            <>
              <Box
                sx={{
                  background: `linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)`,
                  color: 'white',
                  p: 3
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Task Details
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Due: {eventPopover.todo.due_date ? format(parseISO(eventPopover.todo.due_date), 'EEEE, MMMM d, yyyy') : 'No due date'}
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {eventPopover.todo.title}
                </Typography>
                
                {eventPopover.todo.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {eventPopover.todo.description}
                  </Typography>
                )}
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Chip
                      icon={getStatusProps(eventPopover.todo.status).icon}
                      label={getStatusProps(eventPopover.todo.status).label}
                      color={getStatusProps(eventPopover.todo.status).color}
                      size="medium"
                      sx={{ width: '100%', justifyContent: 'center' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      label={getPriorityProps(eventPopover.todo.priority).label}
                      color={getPriorityProps(eventPopover.todo.priority).color}
                      size="medium"
                      sx={{ width: '100%', justifyContent: 'center' }}
                    />
                  </Grid>
                </Grid>
                
                {eventPopover.todo.category && (
                  <Chip
                    label={eventPopover.todo.category}
                    icon={<CategoryIcon />}
                    variant="outlined"
                    sx={{ mb: 2, borderColor: '#2E7D32', color: '#2E7D32' }}
                  />
                )}
                
                {Array.isArray(eventPopover.todo.tags) && eventPopover.todo.tags.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {eventPopover.todo.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#2E7D32', color: '#2E7D32' }}
                      />
                    ))}
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Box display="flex" gap={0.5}>
                    {statuses.map((status) => (
                      <Tooltip key={status.value} title={`Mark as ${status.label}`} arrow>
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleStatusChange(eventPopover.todo.id, status.value);
                            handleCloseEventPopover();
                          }}
                          sx={{
                            bgcolor: eventPopover.todo.status === status.value 
                              ? alpha(theme.palette[status.color].main, 0.2)
                              : alpha(theme.palette.action.hover, 0.1),
                            color: eventPopover.todo.status === status.value 
                              ? theme.palette[status.color].main
                              : theme.palette.text.secondary,
                            '&:hover': {
                              bgcolor: alpha(theme.palette[status.color].main, 0.1)
                            }
                          }}
                        >
                          {React.cloneElement(status.icon, { fontSize: 'small' })}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                  
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Edit" arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleOpenEditDialog(eventPopover.todo);
                          handleCloseEventPopover();
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: theme.palette.primary.main,
                            color: 'white'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete" arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleDelete(eventPopover.todo.id);
                          handleCloseEventPopover();
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          '&:hover': {
                            bgcolor: theme.palette.error.main,
                            color: 'white'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Popover>

        {/* Add/Edit Todo Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }
          }}
        >
          {/* Dialog Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)`,
              color: 'white',
              p: 3
            }}
          >
            <DialogTitle sx={{ 
              color: 'white', 
              p: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <TaskIcon sx={{ mr: 2 }} />
              {dialogMode === 'add' ? 'Add New Todo' : 'Edit Todo'}
            </DialogTitle>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              {dialogMode === 'add' 
                ? 'Create a new task to track your work' 
                : 'Update your existing task details'}
            </Typography>
          </Box>

          <Divider />

          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12}minWidth={'250px'}>
                  <TextField
                    fullWidth
                    required
                    label="Task Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "10px"
                      }
                    }}
                    placeholder="Enter a clear and concise title for your task"
                  />
                </Grid>

             

                <Grid item xs={12} sm={6}minWidth={'250px'}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "10px"
                      }
                    }}
                  >
                    {statuses.map((status) => (
                      <MenuItem 
                        key={status.value} 
                        value={status.value}
                      >
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={status.label}
                            size="small"
                            color={status.color}
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}minWidth={'250px'}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "10px"
                      }
                    }}
                  >
                    {priorities.map((priority) => (
                      <MenuItem 
                        key={priority.value} 
                        value={priority.value}
                      >
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={priority.label}
                            size="small"
                            color={priority.color}
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}minWidth={'250px'}>
                  <DatePicker
                    label="Due Date"
                    value={formData.due_date}
                    onChange={(newDate) => setFormData(prev => ({ ...prev, due_date: newDate }))}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        size="medium"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "10px"
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}minWidth={'250px'}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "10px"
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem 
                        key={category} 
                        value={category}
                      >
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}minWidth={'250px'}>
                  <TextField
                    fullWidth
                    label="Tags (comma separated)"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "10px"
                      }
                    }}
                    placeholder="work, important, meeting, etc."
                    helperText="Enter tags separated by commas"
                  />
                </Grid>

                   <Grid item xs={12}minWidth={'800px'}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    size="medium"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "10px"
                      }
                    }}
                    placeholder="Add more details about this task (optional)"
                  />
                </Grid>
              </Grid>
            </DialogContent>

            {/* Dialog Footer */}
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.grey[50], 0.5),
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <DialogActions sx={{ p: 0 }}>
                <Button 
                  onClick={handleCloseDialog} 
                  disabled={saving}
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    borderWidth: 2,
                    borderColor: "#2E7D32",
                    color: "#2E7D32",
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: "#388E3C",
                      backgroundColor: "rgba(46, 125, 50, 0.05)",
                    }
                  }}
                >
                  Cancel
                </Button>
                <GradientButton
                  type="submit"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : dialogMode === 'add' ? 'Add Todo' : 'Update Todo'}
                </GradientButton>
              </DialogActions>
            </Box>
          </form>
        </Dialog>

        {/* Add Todo Floating Button for mobile */}
        {isMobile && (
          <Fab
            color="success"
            aria-label="add"
            onClick={handleOpenAddDialog}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)'
              }
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Add Todo Button for desktop */}
        {!isMobile && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <GradientButton
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              size="large"
              sx={{
                px: 6,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Add New Todo
            </GradientButton>
          </Box>
        )}

        {/* Notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert 
            severity="error" 
            onClose={() => setError('')}
            sx={{ 
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "rgba(244, 67, 54, 0.2)",
            }}
          >
            <Typography variant="subtitle2" fontWeight="medium">
              Error
            </Typography>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert 
            severity="success" 
            onClose={() => setSuccess('')}
            sx={{ 
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "rgba(76, 175, 80, 0.2)",
            }}
          >
            <Typography variant="subtitle2" fontWeight="medium">
              Success
            </Typography>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Todo;