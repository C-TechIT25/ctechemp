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
  Badge
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
  LunchDining as LunchDiningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
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
  lightGreen: "#66BB6A",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  gradient: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
  lightGradient: "linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)"
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
    if (catLower?.includes("productive")) return "#2E7D32";
    if (catLower?.includes("idle")) return "#FF9800";
    if (catLower?.includes("leave")) return "#F44336";
    if (catLower?.includes("permission")) return "#2196F3";
    if (catLower?.includes("sunday") || catLower?.includes("holiday")) return "#9C27B0";
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
    if (modeLower?.includes("office")) return "#1976D2";
    if (modeLower?.includes("home")) return "#2E7D32";
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

  const { user } = useAuth();

  // Activity categories
  const activityCategories = [
    'Productive Effort',
    'Idle - System Issue',
    'Idle - Power Issue',
    'Full Day Leave',
    'Permission',
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

  useEffect(() => {
    fetchEmpId();
  }, [user?.uid]);

  useEffect(() => {
    if (empId) {
      fetchTimesheets();
    }
  }, [empId]);

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
      work_mode: timesheet.work_mode,
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
    
    if (!formData.activity_category || !formData.work_mode) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    // Validation for time fields based on activity category
    if (formData.activity_category === 'Productive Effort' || 
        formData.activity_category === 'Idle - System Issue' || 
        formData.activity_category === 'Idle - Power Issue') {
      if (!formData.check_in) {
        showToast('Check-in time is required for this activity category', 'error');
        return;
      }
    }

    if (formData.activity_category === 'Permission' && !formData.permission_hours) {
      showToast('Permission hours are required for Permission category', 'error');
      return;
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
        work_mode: formData.work_mode,
        description: formData.description,
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
    return time.substring(0, 5); // Remove seconds if present
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
                  color: greenTheme.primary,
                  mb: 2 
                }}
              />
              <Typography 
                variant="h6" 
                color={greenTheme.primary}
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
            </Box>
            
            <Box sx={{ display: "flex", gap: 1 }}>
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
                  onClick={fetchTimesheets} 
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
              <StatCard color={stats.pendingApprovals > 0 ? "#FF9800" : "#2E7D32"}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.pendingApprovals}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <TrendingUp  />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Approval
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
              <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filter Timesheets
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "success.main" }}>Activity Category</InputLabel>
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
                    <InputLabel sx={{ color: "success.main" }}>Work Mode</InputLabel>
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
                        color: "success.main",
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
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
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
                  color: "#2E7D32",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  border: "2px solid rgba(46, 125, 50, 0.2)"
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" color="#2E7D32">
                  {user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Employee ID: {empId} • {timesheets.length} timesheet entries
                </Typography>
              </Box>
              <Chip
                label={stats.avgHours.toFixed(1) + "h average"}
                color="success"
                variant="outlined"
                icon={<TimerIcon />}
              />
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
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold", width: 60 }}></TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Date/Day</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Activity</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Work Mode</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Description</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Hours</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold", width: 180 }}>Actions</TableCell>
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
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(row.id)}
                            sx={{ 
                              color: "#2E7D32",
                              "&:hover": {
                                bgcolor: "rgba(46, 125, 50, 0.1)"
                              }
                            }}
                          >
                            {expandedRows.includes(row.id) ? <ArrowUpwardIcon /> : <InfoIcon />}
                          </IconButton>
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium" color="#2E7D32">
                              {format(parseISO(row.date), 'dd/MM/yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.day}
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
                                  color: "#2E7D32",
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
                                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#2E7D32' }}>
                                    <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Time Tracking
                                  </Typography>
                                  <Grid container spacing={2}>
                                    {[
                                      { icon: <LoginIcon />, label: "Check In", value: formatTime(row.check_in), color: "#2E7D32" },
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
                                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#2E7D32' }}>
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
                                        <Typography variant="h6" fontWeight="bold" color="#2E7D32">
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
                                      <Typography variant="body2" fontWeight="bold" color="#2E7D32" gutterBottom>
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
              <Typography variant="body2" color="success.main" fontWeight="medium">
                Showing {filteredTimesheets.length} of {timesheets.length} entries
                {selectedActivity !== "all" && ` in ${selectedActivity}`}
                {selectedWorkMode !== "all" && ` with ${selectedWorkMode}`}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total hours: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0).toFixed(1)}h
              </Typography>
            </Box>
          )}
        </StyledPaper>

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
                <Grid item xs={12} sm={6}minWidth={'200px'}>
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

                <Grid item xs={12} sm={6}maxWidth={'250px'}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Activity Category *"
                    name="activity_category"
                    value={formData.activity_category}
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
                    {activityCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <ActivityChip label={category} size="small" category={category} sx={{ mr: 1 }} />
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}maxWidth={'250px'}>
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

                {formData.activity_category === 'Permission' && (
                  <Grid item xs={12} sm={6}minWidth={'250px'}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Permission Hours *"
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
                    />
                  </Grid>
                )}

                

                {(formData.activity_category === 'Productive Effort' || 
                  formData.activity_category === 'Idle - System Issue' || 
                  formData.activity_category === 'Idle - Power Issue') && (
                  <>
<Grid sx={{display:'flex',gap:5}}>                    <Grid item xs={12}>
                      <Divider sx={{ my: 0}}>
                        <Chip 
                          label="Time Tracking" 
                          icon={<TimerIcon />}
                          sx={{ 
                            bgcolor: "rgba(46, 125, 50, 0.1)",
                            color: "#2E7D32",
                            fontWeight: 'medium'
                          }}
                        />
                      </Divider>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
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

                    <Grid item xs={12} sm={6} md={3}>
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
                    </Grid>

                  </>
                )}


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
                        No time tracking required for {formData.activity_category}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12}minWidth={'800px'}>
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