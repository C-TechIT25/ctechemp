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
  useTheme,
  alpha,
  Divider,
  Fade,
  Checkbox,
  LinearProgress,
  Select,
  FormControl,
  InputLabel,
  ListItemText,
  Popover,
  GlobalStyles,
  styled,
  Fab,
  useMediaQuery,
  InputAdornment,
  Stack,
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
  Refresh,
  AccessTime as AccessTimeIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  ViewModule as ViewModuleIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  SearchOutlined as Search,
  Timer,
  BarChart,
  ArrowUpward,
  ArrowDownward,
  UnfoldMore,
  Category as CategoryIcon,
  EventBusy,
  EventAvailable,
} from '@mui/icons-material';
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
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

const localizer = momentLocalizer(moment);

// ---------------------------------------------------------------------------
// Design tokens — a calm, focused "workspace" palette. Indigo carries the
// brand and primary actions; status colors stay semantic and consistent
// everywhere (table, calendar, stats, legend) so the eye learns them once.
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
};

const PRIORITY_COLOR = { high: COLORS.danger, medium: COLORS.warning, low: COLORS.success };
const STATUS_COLOR = { pending: COLORS.warning, in_progress: COLORS.info, completed: COLORS.success };

// ---------------------------------------------------------------------------
// Styled primitives
// ---------------------------------------------------------------------------
const Shell = styled(Box)({
  fontFamily: "'Inter', sans-serif",
});

const Display = styled('span')({
  fontFamily: "'Outfit', sans-serif",
});

const Surface = styled(Paper)(({ theme }) => ({
  borderRadius: 20,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.04)',
}));

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

// A pill-shaped segmented control used for view switching / status filters.
const Segmented = ({ value, onChange, options, size = 'medium' }) => (
  <Box
    sx={{
      display: 'inline-flex',
      p: 0.5,
      borderRadius: 14,
      bgcolor: COLORS.bg,
      border: `1px solid ${COLORS.border}`,
      gap: 0.5,
      flexWrap: 'wrap',
    }}
  >
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
            minWidth: 0,
            color: active ? '#fff' : COLORS.muted,
            bgcolor: active ? COLORS.primary : 'transparent',
            boxShadow: active ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
            '&:hover': { bgcolor: active ? COLORS.primaryDark : alpha(COLORS.primary, 0.08) },
          }}
        >
          {opt.label}
          {opt.badge !== undefined && (
            <Box
              component="span"
              sx={{
                ml: 0.75,
                fontSize: '0.7rem',
                fontWeight: 700,
                px: 0.75,
                borderRadius: 8,
                bgcolor: active ? 'rgba(255,255,255,0.25)' : alpha(COLORS.ink, 0.06),
                color: active ? '#fff' : COLORS.muted,
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

// Minimal radial-progress ring — the dashboard's signature visual.
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
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: COLORS.ink, lineHeight: 1 }}>
          <Display>{Math.round(value)}%</Display>
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.muted, fontSize: '0.68rem' }}>
          done
        </Typography>
      </Box>
    </Box>
  );
};

const StatTile = ({ label, value, color, icon }) => (
  <Box
    sx={{
      p: 1.75,
      borderRadius: '14px',
      bgcolor: alpha(color, 0.06),
      borderLeft: `3px solid ${color}`,
      minWidth: 132,
      flex: 1,
    }}
  >
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

const StyledCalendar = styled(Box)(({ theme }) => ({
  '& .rbc-calendar': {
    fontFamily: "'Inter', sans-serif",
    borderRadius: 14,
    overflow: 'hidden',
  },
  '& .rbc-header': {
    background: alpha(COLORS.primary, 0.06),
    color: COLORS.ink,
    fontWeight: 600,
    padding: '10px 6px',
    borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`,
  },
  '& .rbc-today': { background: alpha(COLORS.warning, 0.08) },
  '& .rbc-off-range-bg': { background: alpha(theme.palette.action.disabled, 0.04) },
  '& .rbc-event': {
    borderRadius: 8,
    border: 'none',
    padding: '3px 7px',
    margin: '2px 0',
    fontSize: '0.78rem',
    minHeight: 22,
  },
  '& .rbc-selected': { background: alpha(COLORS.primary, 0.2) },
  '& .rbc-month-view, & .rbc-time-view': { border: `1px solid ${COLORS.border}` },
  '& .rbc-month-row': { minHeight: 110 },
  '& .rbc-date-cell': { padding: '6px 8px', textAlign: 'right' },
  '& .rbc-day-bg': {
    border: '1px solid rgba(0,0,0,0.04)',
    '&:hover': { backgroundColor: alpha(COLORS.primary, 0.025) },
  },
  '& .rbc-agenda-table': { fontSize: '0.85rem' },
}));

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
`;

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
    avg_completion_days: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [editingTodo, setEditingTodo] = useState(null);
  const [empId, setEmpId] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState([]);
  const [filterCategory, setFilterCategory] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [sortConfig, setSortConfig] = useState({ key: 'due_date', direction: 'asc' });

  // Calendar state
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPopover, setEventPopover] = useState({ open: false, anchorEl: null, todo: null });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null,
    category: '',
    tags: '',
  });

  const priorities = [
    { value: 'high', label: 'High', color: 'error' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'low', label: 'Low', color: 'success' },
  ];

  const statuses = [
    { value: 'pending', label: 'Pending', icon: <PendingIcon />, color: 'warning' },
    { value: 'in_progress', label: 'In Progress', icon: <InProgressIcon />, color: 'info' },
    { value: 'completed', label: 'Completed', icon: <CheckCircleIcon />, color: 'success' },
  ];

  const categories = ['Work', 'Personal', 'Project', 'Meeting', 'Learning', 'Health', 'Finance', 'Shopping', 'Other'];

  // Convert todos to calendar events
  const calendarEvents = todos.map((todo) => {
    const startDate = todo.due_date ? parseISO(todo.due_date) : new Date();
    const endDate = todo.due_date ? parseISO(todo.due_date) : new Date();
    const backgroundColor = PRIORITY_COLOR[todo.priority] || COLORS.primary;

    return {
      id: todo.id,
      title: todo.title,
      start: startOfDay(startDate),
      end: endOfDay(endDate),
      allDay: true,
      todo,
      status: todo.status,
      priority: todo.priority,
      style: {
        backgroundColor,
        borderColor: backgroundColor,
        color: 'white',
        opacity: todo.status === 'completed' ? 0.55 : 1,
        borderRadius: '6px',
        padding: '4px 8px',
        margin: '2px 4px',
        fontSize: '0.8rem',
        fontWeight: 500,
        textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
      },
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

        try {
          const response = await fetch(`${API_BASE_URL}todos/get-employee-id/${employeeCode}`);

          if (response.ok) {
            const data = await response.json();
            setEmpId(data.id);
          } else {
            const createResponse = await fetch(`${API_BASE_URL}todos/create-employee`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emp_id: employeeCode,
                employee_name: employeeName,
                email: employeeEmail,
                firebase_uid: user.uid,
              }),
            });

            if (createResponse.ok) {
              const newEmployee = await createResponse.json();
              setEmpId(newEmployee.id);
            } else {
              setEmpId(1);
            }
          }
        } catch (err) {
          console.error('Error in employee lookup:', err);
          setEmpId(1);
        }
      } else {
        setEmpId(1);
      }
    } catch (err) {
      console.error('Failed to fetch from Firestore:', err);
      setEmpId(1);
    }
  };

  // Fetch all todos
  const fetchTodos = async () => {
    if (!empId || empId === '') return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}todos/employee/${empId}`);

      if (response.ok) {
        const data = await response.json();
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
        setStats(data);
      } else {
        setStats(calculateLocalStats());
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats(calculateLocalStats());
    }
  };

  const calculateLocalStats = () => {
    const total = todos.length;
    const completed = todos.filter((t) => t.status === 'completed').length;
    const pending = todos.filter((t) => t.status === 'pending').length;
    const in_progress = todos.filter((t) => t.status === 'in_progress').length;

    const overdue = todos.filter((t) => {
      if (!t.due_date || t.status === 'completed') return false;
      try {
        const dueDate = parseISO(t.due_date);
        return isPast(dueDate) && !isToday(dueDate);
      } catch {
        return false;
      }
    }).length;

    return { total, completed, pending, in_progress, overdue, avg_completion_days: 0 };
  };

  useEffect(() => {
    fetchEmpId();
  }, [user?.uid]);

  useEffect(() => {
    if (empId && empId !== '') fetchTodos();
  }, [empId]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      due_date: null,
      category: '',
      tags: '',
    });
    setEditingTodo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      tags: Array.isArray(todo.tags) ? todo.tags.join(', ') : todo.tags || '',
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
        emp_id: parseInt(empId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        due_date: dueDateStr,
        category: formData.category.trim() || null,
        tags: formData.tags.trim(),
      };

      const url =
        dialogMode === 'edit' && editingTodo ? `${API_BASE_URL}todos/${editingTodo.id}` : `${API_BASE_URL}todos`;
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
      const response = await fetch(`${API_BASE_URL}todos/${id}`, { method: 'DELETE' });

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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
    setEventPopover({ open: true, anchorEl: e.target, todo: event.todo });
    setSelectedEvent(event);
  };

  const handleCloseEventPopover = () => {
    setEventPopover({ open: false, anchorEl: null, todo: null });
    setSelectedEvent(null);
  };

  const handleNavigate = (newDate) => setCurrentDate(newDate);
  const handleViewChange = (newView) => setCalendarView(newView);

  // Custom calendar toolbar — fully wired view switching + quick "Today" jump.
  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1.5}>
      <Box display="flex" alignItems="center" gap={1}>
        <IconButton
          onClick={() => onNavigate('PREV')}
          size="small"
          sx={{
            bgcolor: alpha(COLORS.primary, 0.08),
            color: COLORS.primary,
            '&:hover': { bgcolor: COLORS.primary, color: 'white' },
          }}
        >
          <ChevronLeft />
        </IconButton>

        <Typography sx={{ fontWeight: 700, minWidth: 170, textAlign: 'center', color: COLORS.ink }}>
          <Display>{label}</Display>
        </Typography>

        <IconButton
          onClick={() => onNavigate('NEXT')}
          size="small"
          sx={{
            bgcolor: alpha(COLORS.primary, 0.08),
            color: COLORS.primary,
            '&:hover': { bgcolor: COLORS.primary, color: 'white' },
          }}
        >
          <ChevronRight />
        </IconButton>

        <Tooltip title="Jump to today" arrow>
          <IconButton
            onClick={() => onNavigate('TODAY')}
            size="small"
            sx={{ ml: 0.5, color: COLORS.muted, '&:hover': { color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.08) } }}
          >
            <TodayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Segmented
        size="small"
        value={view}
        onChange={onView}
        options={[
          { value: 'month', label: isMobile ? '' : 'Month', icon: <CalendarMonthIcon fontSize="small" /> },
          { value: 'week', label: isMobile ? '' : 'Week', icon: <ViewWeekIcon fontSize="small" /> },
          { value: 'day', label: isMobile ? '' : 'Day', icon: <ViewDayIcon fontSize="small" /> },
          { value: 'agenda', label: isMobile ? '' : 'Agenda', icon: <ViewAgendaIcon fontSize="small" /> },
        ]}
      />
    </Box>
  );

  const getPriorityProps = (priority) => {
    const p = priorities.find((x) => x.value === priority);
    return { color: p?.color || 'default', label: p?.label || priority };
  };

  const getStatusProps = (status) => {
    const s = statuses.find((x) => x.value === status);
    return { color: s?.color || 'default', label: s?.label || status, icon: s?.icon };
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { label: 'No due date', color: 'default' };
    try {
      const date = parseISO(dueDate);
      if (isPast(date) && !isToday(date)) return { label: 'Overdue', color: 'error' };
      if (isToday(date)) return { label: 'Today', color: 'warning' };
      if (isFuture(date)) {
        const daysDiff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        return { label: `${daysDiff} day${daysDiff !== 1 ? 's' : ''} left`, color: daysDiff <= 3 ? 'warning' : 'success' };
      }
      return { label: format(date, 'MMM d'), color: 'default' };
    } catch {
      return { label: 'Invalid date', color: 'error' };
    }
  };

  // Filter
  const filteredTodos = todos.filter((todo) => {
    if (activeTab !== 'all' && todo.status !== activeTab) return false;
    if (filterPriority.length > 0 && !filterPriority.includes(todo.priority)) return false;
    if (filterCategory.length > 0 && todo.category && !filterCategory.includes(todo.category)) return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        todo.title.toLowerCase().includes(s) ||
        (todo.description && todo.description.toLowerCase().includes(s)) ||
        (todo.category && todo.category.toLowerCase().includes(s)) ||
        (Array.isArray(todo.tags) && todo.tags.some((tag) => tag.toLowerCase().includes(s)))
      );
    }
    return true;
  });

  // Sort (table view) — click a column header to toggle asc/desc.
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const getSortValue = (todo, key) => {
    if (key === 'due_date') return todo.due_date ? new Date(todo.due_date).getTime() : Infinity;
    if (key === 'priority') return PRIORITY_ORDER[todo.priority] ?? 3;
    if (key === 'title') return (todo.title || '').toLowerCase();
    return '';
  };
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const va = getSortValue(a, sortConfig.key);
    const vb = getSortValue(b, sortConfig.key);
    if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
    if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const handleSort = (key) =>
    setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  const SortHeader = ({ children, sortKey, sx }) => (
    <TableCell
      onClick={() => handleSort(sortKey)}
      sx={{
        bgcolor: COLORS.bg,
        fontWeight: 700,
        py: 1.75,
        borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`,
        color: COLORS.ink,
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      <Box display="flex" alignItems="center" gap={0.5}>
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUpward sx={{ fontSize: 14, color: COLORS.primary }} />
          ) : (
            <ArrowDownward sx={{ fontSize: 14, color: COLORS.primary }} />
          )
        ) : (
          <UnfoldMore sx={{ fontSize: 14, color: COLORS.faint }} />
        )}
      </Box>
    </TableCell>
  );

  // Upcoming sidebar list for the calendar view.
  const upcomingTodos = [...todos]
    .filter((t) => t.status !== 'completed' && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  // ------------------------------------------------------------------------
  // Calendar view
  // ------------------------------------------------------------------------
  const renderCalendarView = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={9}>
        <Surface sx={{ p: { xs: 2, sm: 3 }, height: { lg: '74vh' }, minHeight: 560 }}>
          <Box sx={{ height: '100%' }}>
            <StyledCalendar sx={{ height: '100%' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: isMobile ? 480 : '90%' }}
                eventPropGetter={(event) => ({ style: event.style })}
                views={['month', 'week', 'day', 'agenda']}
                view={calendarView}
                onView={handleViewChange}
                date={currentDate}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                components={{ toolbar: CustomToolbar }}
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
                  noEventsInRange: 'Nothing scheduled in this period.',
                }}
              />
            </StyledCalendar>
          </Box>
        </Surface>
      </Grid>

      <Grid item xs={12} lg={3}>
        <Stack spacing={2.5}>
          <Surface sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5, color: COLORS.ink }}>
              <Display>Priority key</Display>
            </Typography>
            <Stack spacing={1}>
              {Object.entries(PRIORITY_COLOR).map(([key, color]) => (
                <Box key={key} display="flex" alignItems="center" gap={1.25}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                  <Typography variant="body2" sx={{ color: COLORS.muted, textTransform: 'capitalize' }}>
                    {key} priority
                  </Typography>
                </Box>
              ))}
              <Box display="flex" alignItems="center" gap={1.25}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: alpha(COLORS.ink, 0.25) }} />
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  Completed (faded)
                </Typography>
              </Box>
            </Stack>
          </Surface>

          <Surface sx={{ p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>
                <Display>Upcoming</Display>
              </Typography>
              <Chip size="small" label={upcomingTodos.length} sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 700 }} />
            </Box>

            {upcomingTodos.length === 0 ? (
              <Box textAlign="center" py={3}>
                <EventAvailable sx={{ fontSize: 36, color: alpha(COLORS.muted, 0.4), mb: 1 }} />
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  Nothing on the horizon.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {upcomingTodos.map((todo) => {
                  const due = getDueDateStatus(todo.due_date);
                  return (
                    <Box
                      key={todo.id}
                      onClick={() => handleOpenEditDialog(todo)}
                      sx={{
                        p: 1.25,
                        borderRadius: 2.5,
                        border: `1px solid ${COLORS.border}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.03) },
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <Box
                          sx={{
                            mt: 0.5,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: PRIORITY_COLOR[todo.priority] || COLORS.primary,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: COLORS.ink }}>
                            {todo.title}
                          </Typography>
                          <Chip
                            label={due.label}
                            size="small"
                            color={due.color}
                            variant="outlined"
                            sx={{ mt: 0.5, height: 20, fontSize: '0.68rem' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Surface>
        </Stack>
      </Grid>
    </Grid>
  );

  // ------------------------------------------------------------------------
  // Table view
  // ------------------------------------------------------------------------
  const renderTableView = () => (
    <Surface sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 620 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <SortHeader sortKey="title" sx={{ width: '38%' }}>
                <TaskIcon sx={{ fontSize: 18, color: COLORS.primary }} /> Task
              </SortHeader>
              <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, py: 1.75, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`, color: COLORS.ink }}>
                Status
              </TableCell>
              <SortHeader sortKey="priority">Priority</SortHeader>
              <SortHeader sortKey="due_date">Due</SortHeader>
              <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, py: 1.75, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`, color: COLORS.ink }}>
                Category
              </TableCell>
              <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, py: 1.75, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`, color: COLORS.ink }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTodos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box textAlign="center">
                    <EventBusy sx={{ fontSize: 56, color: alpha(COLORS.muted, 0.3), mb: 2 }} />
                    <Typography variant="h6" sx={{ color: COLORS.ink, fontWeight: 700 }}>
                      {loading ? 'Loading your tasks…' : 'Nothing here yet'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.muted }}>
                      {searchTerm || filterPriority.length > 0 || filterCategory.length > 0
                        ? 'Try adjusting your filters or search terms.'
                        : 'Add your first task to get moving.'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sortedTodos.map((todo, index) => (
                <Fade in timeout={Math.min(index * 60, 400)} key={todo.id}>
                  <TableRow
                    hover
                    sx={{
                      '&:hover': { bgcolor: alpha(COLORS.primary, 0.03) },
                      opacity: todo.status === 'completed' ? 0.7 : 1,
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: COLORS.ink,
                          textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        {todo.title}
                      </Typography>
                      {todo.description && (
                        <Typography variant="body2" sx={{ color: COLORS.muted, mt: 0.25 }}>
                          {todo.description}
                        </Typography>
                      )}
                      {Array.isArray(todo.tags) && todo.tags.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                          {todo.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                          ))}
                        </Box>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={getStatusProps(todo.status).icon}
                        label={getStatusProps(todo.status).label}
                        color={getStatusProps(todo.status).color}
                        size="small"
                        sx={{ mb: 1, fontWeight: 500 }}
                      />
                      <Box display="flex" gap={0.5}>
                        {statuses.map((status) => (
                          <Tooltip key={status.value} title={`Mark as ${status.label}`} arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleStatusChange(todo.id, status.value)}
                              sx={{
                                bgcolor: todo.status === status.value ? alpha(STATUS_COLOR[status.value], 0.18) : alpha(COLORS.ink, 0.04),
                                color: todo.status === status.value ? STATUS_COLOR[status.value] : COLORS.muted,
                                '&:hover': { bgcolor: alpha(STATUS_COLOR[status.value], 0.12) },
                              }}
                            >
                              {React.cloneElement(status.icon, { fontSize: 'small' })}
                            </IconButton>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip label={getPriorityProps(todo.priority).label} color={getPriorityProps(todo.priority).color} size="small" sx={{ fontWeight: 500 }} />
                    </TableCell>

                    <TableCell>
                      {todo.due_date ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.ink }}>
                            {format(parseISO(todo.due_date), 'MMM d, yyyy')}
                          </Typography>
                          <Chip label={getDueDateStatus(todo.due_date).label} size="small" color={getDueDateStatus(todo.due_date).color} variant="outlined" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.faint, fontStyle: 'italic' }}>
                          No due date
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      {todo.category ? (
                        <Chip label={todo.category} icon={<CategoryIcon />} size="small" variant="outlined" sx={{ borderColor: alpha(COLORS.primary, 0.3), color: COLORS.primary }} />
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.faint, fontStyle: 'italic' }}>
                          Uncategorized
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(todo)}
                            sx={{ bgcolor: alpha(COLORS.primary, 0.08), color: COLORS.primary, '&:hover': { bgcolor: COLORS.primary, color: 'white' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(todo.id)}
                            sx={{ bgcolor: alpha(COLORS.danger, 0.08), color: COLORS.danger, '&:hover': { bgcolor: COLORS.danger, color: 'white' } }}
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
    </Surface>
  );

  if (loading && todos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={{ bgcolor: COLORS.bg }}>
        <Fade in={loading} style={{ transitionDelay: '200ms' }}>
          <Box textAlign="center">
            <CircularProgress size={56} thickness={4} sx={{ color: COLORS.primary, mb: 2 }} />
            <Typography sx={{ fontWeight: 600, color: COLORS.ink }}>
              <Display>Loading your tasks…</Display>
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <GlobalStyles styles={fontImport} />
      <Shell sx={{ flexGrow: 1, px: { xs: 2, sm: 4 }, py: 3, bgcolor: COLORS.bg, minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ display: 'flex', p: 1, borderRadius: '14px', bgcolor: alpha(COLORS.primary, 0.1) }}>
                <TaskIcon sx={{ color: COLORS.primary }} />
              </Box>
              <Display>My Tasks</Display>
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.muted, mt: 0.5 }}>
              Everything you need to do, in one clean view.
            </Typography>
          </Box>

          {!isMobile && (
            <GradientButton startIcon={<AddIcon />} onClick={handleOpenAddDialog} size="large">
              Add task
            </GradientButton>
          )}
        </Box>

        {/* Overview */}
        <Surface sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, flexWrap: 'wrap' }}>
            <RadialProgress value={completionPercentage} color={COLORS.primary} />

            <Box sx={{ minWidth: 180 }}>
              <Typography variant="overline" sx={{ color: COLORS.faint, letterSpacing: 1, fontWeight: 700 }}>
                Overview
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.ink }}>
                <Display>
                  {stats.completed} of {stats.total} tasks done
                </Display>
              </Typography>
             
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
              <StatTile label="In progress" value={stats.in_progress} color={COLORS.info} icon={<Timer fontSize="small" />} />
              <StatTile label="Pending" value={stats.pending} color={COLORS.warning} icon={<PendingIcon fontSize="small" />} />
              <StatTile label="Overdue" value={stats.overdue} color={COLORS.danger} icon={<AccessTimeIcon fontSize="small" />} />
              <StatTile label="Total" value={stats.total} color={COLORS.primary} icon={<DashboardIcon fontSize="small" />} />
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <BarChart sx={{ fontSize: 18, color: COLORS.muted }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
              Progress breakdown
            </Typography>
          </Box>
          <Grid container spacing={2.5}>
            {[
              { key: 'completed', label: 'Completed', color: COLORS.success },
              { key: 'in_progress', label: 'In progress', color: COLORS.info },
              { key: 'pending', label: 'Pending', color: COLORS.warning },
            ].map((row) => (
              <Grid item xs={12} md={4} key={row.key}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
                  <Typography variant="body2" sx={{ color: COLORS.muted }}>
                    {row.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                    {stats[row.key]} ({stats.total > 0 ? Math.round((stats[row.key] / stats.total) * 100) : 0}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.total > 0 ? (stats[row.key] / stats.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(row.color, 0.12),
                    '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 4 },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Surface>

        {/* Toolbar: search + filters + reset */}
        <Surface sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4} minWidth={540}>
              <TextField
                fullWidth
                placeholder="Search tasks, tags, or notes…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: COLORS.muted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: COLORS.bg },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3} minWidth={200}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={filterPriority}
                  label="Priority"
                  onChange={(e) => setFilterPriority(e.target.value)}
                  sx={{ borderRadius: '12px', bgcolor: COLORS.bg }}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Checkbox checked={filterPriority.indexOf(priority.value) > -1} />
                      <Chip label={priority.label} size="small" color={priority.color} sx={{ ml: 1 }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3} minWidth={200}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                  sx={{ borderRadius: '12px', bgcolor: COLORS.bg }}
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

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                startIcon={<Refresh />}
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPriority([]);
                  setFilterCategory([]);
                }}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: COLORS.border,
                  color: COLORS.muted,
                  '&:hover': { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) },
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Surface>

        {/* View switch + status filter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'table', label: 'Table', icon: <ViewModuleIcon fontSize="small" /> },
              { value: 'calendar', label: 'Calendar', icon: <CalendarMonthIcon fontSize="small" /> },
            ]}
          />

          {viewMode === 'table' && (
            <Segmented
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'all', label: 'All', icon: <DashboardIcon fontSize="small" />, badge: todos.length },
                ...statuses.map((s) => ({
                  value: s.value,
                  label: s.label,
                  icon: React.cloneElement(s.icon, { fontSize: 'small' }),
                  badge: todos.filter((t) => t.status === s.value).length,
                })),
              ]}
            />
          )}
        </Box>

        {/* Main content */}
        {viewMode === 'calendar' ? renderCalendarView() : renderTableView()}

        {/* Event Details Popover */}
        <Popover
          open={eventPopover.open}
          anchorEl={eventPopover.anchorEl}
          onClose={handleCloseEventPopover}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{ sx: { width: 400, maxWidth: '90vw', borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)' } }}
        >
          {eventPopover.todo && (
            <>
              <Box sx={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: 'white', p: 3 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  <Display>Task details</Display>
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Due: {eventPopover.todo.due_date ? format(parseISO(eventPopover.todo.due_date), 'EEEE, MMMM d, yyyy') : 'No due date'}
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: COLORS.ink }}>
                  {eventPopover.todo.title}
                </Typography>

                {eventPopover.todo.description && (
                  <Typography variant="body2" sx={{ color: COLORS.muted, mb: 2 }}>
                    {eventPopover.todo.description}
                  </Typography>
                )}

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Chip icon={getStatusProps(eventPopover.todo.status).icon} label={getStatusProps(eventPopover.todo.status).label} color={getStatusProps(eventPopover.todo.status).color} size="medium" sx={{ width: '100%' }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip label={getPriorityProps(eventPopover.todo.priority).label} color={getPriorityProps(eventPopover.todo.priority).color} size="medium" sx={{ width: '100%' }} />
                  </Grid>
                </Grid>

                {eventPopover.todo.category && (
                  <Chip label={eventPopover.todo.category} icon={<CategoryIcon />} variant="outlined" sx={{ mb: 2, borderColor: COLORS.primary, color: COLORS.primary }} />
                )}

                {Array.isArray(eventPopover.todo.tags) && eventPopover.todo.tags.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {eventPopover.todo.tags.map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" variant="outlined" sx={{ borderColor: COLORS.primary, color: COLORS.primary }} />
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
                            bgcolor: eventPopover.todo.status === status.value ? alpha(STATUS_COLOR[status.value], 0.18) : alpha(COLORS.ink, 0.04),
                            color: eventPopover.todo.status === status.value ? STATUS_COLOR[status.value] : COLORS.muted,
                            '&:hover': { bgcolor: alpha(STATUS_COLOR[status.value], 0.12) },
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
                        sx={{ bgcolor: alpha(COLORS.primary, 0.08), color: COLORS.primary, '&:hover': { bgcolor: COLORS.primary, color: 'white' } }}
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
                        sx={{ bgcolor: alpha(COLORS.danger, 0.08), color: COLORS.danger, '&:hover': { bgcolor: COLORS.danger, color: 'white' } }}
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
          PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)' } }}
        >
          <Box sx={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: 'white', p: 3 }}>
            <DialogTitle sx={{ color: 'white', p: 0, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
              <TaskIcon sx={{ mr: 1.5 }} />
              <Display>{dialogMode === 'add' ? 'Add new task' : 'Edit task'}</Display>
            </DialogTitle>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              {dialogMode === 'add' ? 'Create a new task to track your work.' : 'Update the details of this task.'}
            </Typography>
          </Box>

          <Divider />

          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
                BASICS
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
                <Grid item xs={12} width={'100%'}>
                  <TextField
                    fullWidth
                    required
                    label="Task title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    placeholder="Enter a clear and concise title for your task"
                  />
                </Grid>
                <Grid item xs={12} width={'100%'}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    placeholder="Add more details about this task (optional)"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
                SCHEDULE & STATUS
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
                <Grid item xs={12} sm={4} width={'31%'}>
                  <TextField select fullWidth label="Status" name="status" value={formData.status} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                    {statuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Chip label={status.label} size="small" color={status.color} sx={{ mr: 1 }} />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}  width={'31%'}>
                  <TextField select fullWidth label="Priority" name="priority" value={formData.priority} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Chip label={priority.label} size="small" color={priority.color} sx={{ mr: 1 }} />
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}  width={'31%'}>
                  <DatePicker
                    label="Due date"
                    value={formData.due_date}
                    onChange={(newDate) => setFormData((prev) => ({ ...prev, due_date: newDate }))}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' ,width: '100%'} }} />}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
                ORGANIZE
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}  width={'31%'}>
                  <TextField select fullWidth label="Category" name="category" value={formData.category} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}  width={'31%'}>
                  <TextField
                    fullWidth
                    label="Tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    placeholder="work, important, meeting"
                    helperText="Comma separated"
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <Box sx={{ p: 2, bgcolor: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }}>
              <DialogActions sx={{ p: 0 }}>
                <Button
                  onClick={handleCloseDialog}
                  disabled={saving}
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: COLORS.border,
                    color: COLORS.muted,
                    '&:hover': { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) },
                  }}
                >
                  Cancel
                </Button>
                <GradientButton type="submit" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}>
                  {saving ? 'Saving…' : dialogMode === 'add' ? 'Add task' : 'Save changes'}
                </GradientButton>
              </DialogActions>
            </Box>
          </form>
        </Dialog>

        {/* Mobile add button */}
        {isMobile && (
          <Fab
            aria-label="add"
            onClick={handleOpenAddDialog}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              color: 'white',
              boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
              '&:hover': { background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primaryDark} 100%)` },
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Notifications */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Error
            </Typography>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Success
            </Typography>
            {success}
          </Alert>
        </Snackbar>
      </Shell>
    </LocalizationProvider>
  );
};

export default Todo;