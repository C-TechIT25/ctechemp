import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  alpha,
  styled,
  Avatar,
  Badge,
  Card,
  CardContent,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LunchDining as LunchDiningIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Info as InfoIcon,
  Comment as CommentIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  CheckCircle,
  Warning,
  TrendingUp,
  Groups,
  CalendarMonth,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styled Components
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

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(46, 125, 50, 0.1)",
  boxShadow: "0 8px 32px rgba(46, 125, 50, 0.08)",
}));

const StatCard = styled(Card)(({ theme, color }) => ({
  borderRadius: "12px",
  height: "100%",
  background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
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
  
  return {
    borderRadius: "8px",
    fontWeight: 600,
    backgroundColor: `${getColor(status)}20`,
    color: getColor(status),
    border: `1px solid ${getColor(status)}40`,
    "&:hover": {
      backgroundColor: `${getColor(status)}30`,
    }
  };
});

const WorkModeChip = styled(Chip)(({ theme, mode }) => {
  const getColor = (mode) => {
    const modeLower = mode?.toLowerCase();
    switch (modeLower) {
      case "office": return "#1976D2";
      case "remote": return "#2E7D32";
      case "hybrid": return "#ED6C02";
      case "wfh": return "#7B1FA2";
      case "leave": return "#D32F2F";
      default: return "#757575";
    }
  };
  
  return {
    borderRadius: "8px",
    fontWeight: 600,
    backgroundColor: `${getColor(mode)}20`,
    color: getColor(mode),
    border: `1px solid ${getColor(mode)}40`,
    "&:hover": {
      backgroundColor: `${getColor(mode)}30`,
    }
  };
});

export default function Timesheet() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [updatingRemark, setUpdatingRemark] = useState(false);
  
  // Filter states
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (selectedDepartment !== "all") {
        params.append("department", selectedDepartment);
      }
      
      if (startDate) {
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      }
      
      if (endDate) {
        params.append("endDate", format(endDate, "yyyy-MM-dd"));
      }
      
      const queryString = params.toString();
      const url = `http://localhost:8085/admin/${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTimesheets(data);
      toast.success(`Loaded ${data.length} timesheets successfully!`);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to load timesheets. Please try again.");
      toast.error("Failed to load timesheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:8085/admin/departments");
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error("Fetch departments error:", error);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    fetchDepartments();
  }, []);

  // Format date to show only date (remove time)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString.split("T")[0]; // Fallback to simple split
    }
  };

  // Format time (HH:MM:SS to HH:MM)
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      return timeString.substring(0, 5); // Extract HH:MM
    } catch {
      return timeString;
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Open detail dialog
  const openDetailDialog = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setDetailDialogOpen(true);
  };

  // Close detail dialog
  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedTimesheet(null);
  };

  // Open remark dialog
  const openRemarkDialog = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setRemarkText(timesheet.remark || "Approved");
    setRemarkDialogOpen(true);
  };

  // Close remark dialog
  const closeRemarkDialog = () => {
    setRemarkDialogOpen(false);
    setSelectedTimesheet(null);
    setRemarkText("");
  };

  // Update remark
  const handleUpdateRemark = async () => {
    if (!selectedTimesheet || !remarkText.trim()) return;
    
    setUpdatingRemark(true);
    try {
      const response = await fetch(`http://localhost:8085/admin/${selectedTimesheet.id}/remark`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remark: remarkText }),
      });
      
      if (!response.ok) throw new Error("Failed to update remark");
      
      // Update local state
      setTimesheets(prev =>
        prev.map(ts =>
          ts.id === selectedTimesheet.id
            ? { ...ts, remark: remarkText }
            : ts
        )
      );
      
      toast.success("Remark updated successfully!");
      closeRemarkDialog();
    } catch (error) {
      console.error("Update remark error:", error);
      toast.error("Failed to update remark. Please try again.");
    } finally {
      setUpdatingRemark(false);
    }
  };

  // Filter timesheets based on search term
  const filteredTimesheets = timesheets.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      row.employee_name?.toLowerCase().includes(searchLower) ||
      row.department?.toLowerCase().includes(searchLower) ||
      row.designation?.toLowerCase().includes(searchLower) ||
      row.activity_category?.toLowerCase().includes(searchLower) ||
      row.work_mode?.toLowerCase().includes(searchLower) ||
      row.description?.toLowerCase().includes(searchLower) ||
      row.remark?.toLowerCase().includes(searchLower)
    );
  });

  // Apply filters
  const handleApplyFilters = () => {
    fetchTimesheets();
    toast.info("Filters applied successfully!");
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedDepartment("all");
    setStartDate(null);
    setEndDate(null);
    fetchTimesheets();
    toast.info("Filters cleared!");
  };

  // Function to get color based on hours
  const getHoursColor = (hours) => {
    const h = parseFloat(hours) || 0;
    if (h >= 8) return "#2e7d32";
    if (h >= 6) return "#ed6c02";
    return "#d32f2f";
  };

  // Function to calculate work duration
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

  // Stats for header
  const totalHours = timesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0);
  const uniqueEmployees = [...new Set(timesheets.map(row => row.employee_name))].length;
  const pendingApprovals = timesheets.filter(row => !row.remark || row.remark === "").length;
  const approvedTimesheets = timesheets.filter(row => row.remark?.toLowerCase().includes("approved")).length;

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
      
      <Box sx={{ flexGrow: 1, px: 4, py: 3 }}>
        {/* Header Section */}
        <StyledPaper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <GradientTypography variant="h4">
                Timesheet Management
              </GradientTypography>
              <Typography variant="body2" color="text.secondary">
                Monitor and approve employee work logs
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
                  color="success"
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
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#2E7D32">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {uniqueEmployees}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <Groups />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Employees
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#2196F3">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {timesheets.length}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <CalendarMonth />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Entries
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#4CAF50">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {totalHours.toFixed(1)}
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
              <StatCard color={pendingApprovals > 0 ? "#FF9800" : "#2E7D32"}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {pendingApprovals}
                    </Typography>
                    
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Approval
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
          </Grid>

          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by employee, department, activity, description..."
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

          {/* Filter Section */}
          <Collapse in={showFilters}>
            <StyledPaper sx={{ p: 3, mt: 3, bgcolor: "rgba(46, 125, 50, 0.02)" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filter Timesheets
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "success.main" }}>Department</InputLabel>
                    <Select
                      value={selectedDepartment}
                      label="Department"
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.05)",
                        border: "1px solid rgba(46, 125, 50, 0.1)"
                      }}
                    >
                      <MenuItem value="all">All Departments</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
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
                
                <Grid item xs={12} md={3}>
                  <Stack direction="row" spacing={1}>
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
              
              {selectedDepartment !== "all" && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
                  Filtering by: Department = {selectedDepartment}
                  {startDate && endDate && `, Date Range: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`}
                </Typography>
              )}
            </StyledPaper>
          </Collapse>
        </StyledPaper>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              borderRadius: "12px",
              border: "1px solid rgba(244, 67, 54, 0.2)"
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
            <CircularProgress size={60} color="success" />
          </Box>
        ) : (
          <StyledPaper>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: "rgba(46, 125, 50, 0.08)",
                    borderBottom: "2px solid #2E7D32"
                  }}>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold", width: 60 }}></TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Date/Day</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Department</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Designation</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Activity</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Work Mode</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Hours</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Remark</TableCell>
                    <TableCell sx={{ color: "#2E7D32", fontWeight: "bold", width: 180 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredTimesheets.length > 0 ? (
                    filteredTimesheets.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow 
                          hover
                          sx={{ 
                            '&:nth-of-type(even)': { bgcolor: 'rgba(46, 125, 50, 0.02)' },
                            '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.05)' },
                            borderBottom: expandedRows.includes(row.id) ? 'none' : '1px solid rgba(0, 0, 0, 0.08)'
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
                              {expandedRows.includes(row.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium" color="#2E7D32">
                                {formatDate(row.date)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.day}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32,
                                  bgcolor: "rgba(46, 125, 50, 0.1)",
                                  color: "#2E7D32",
                                  fontSize: "0.875rem",
                                  fontWeight: "bold"
                                }}
                              >
                                {row.employee_name?.charAt(0) || "U"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {row.employee_name || "N/A"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {row.emp_id || "N/A"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Chip 
                              label={row.department || "N/A"} 
                              size="small" 
                              sx={{ 
                                bgcolor: "rgba(46, 125, 50, 0.1)", 
                                color: "#2E7D32",
                                fontWeight: "medium",
                                borderRadius: "6px"
                              }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {row.designation || "N/A"}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title={row.description || "No description"} arrow>
                              <Typography variant="body2" color="text.primary" fontWeight="medium">
                                {row.activity_category || "N/A"}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          
                          <TableCell>
                            <WorkModeChip
                              label={row.work_mode || "N/A"}
                              size="small"
                              mode={row.work_mode}
                            />
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
                              <Tooltip title="View details">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<InfoIcon />}
                                  onClick={() => openDetailDialog(row)}
                                  sx={{ 
                                    borderRadius: "8px",
                                    borderColor: "rgba(46, 125, 50, 0.3)",
                                    color: "#2E7D32",
                                    "&:hover": {
                                      borderColor: "#2E7D32",
                                      bgcolor: "rgba(46, 125, 50, 0.05)"
                                    }
                                  }}
                                >
                                  Details
                                </Button>
                              </Tooltip>
                              
                              <Tooltip title="Add/Edit remark">
                                <GradientButton
                                  size="small"
                                  startIcon={<CommentIcon />}
                                  onClick={() => openRemarkDialog(row)}
                                  sx={{ borderRadius: "8px", px: 2 }}
                                >
                                  Remark
                                </GradientButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Row Details */}
                        <TableRow>
                          <TableCell colSpan={10} sx={{ p: 0 }}>
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
                                      Details & Remarks
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
                                    
                                    <Paper elevation={0} sx={{ 
                                      p: 2, 
                                      bgcolor: row.remark ? `${getHoursColor(row.remark)}10` : 'rgba(117, 117, 117, 0.1)', 
                                      borderRadius: 2,
                                      border: `1px solid ${row.remark ? `${getHoursColor(row.remark)}20` : 'rgba(117, 117, 117, 0.2)'}`
                                    }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" fontWeight="bold" color={row.remark ? getHoursColor(row.remark) : "#757575"}>
                                          Remarks
                                        </Typography>
                                        <Button
                                          size="small"
                                          startIcon={<CommentIcon />}
                                          onClick={() => openRemarkDialog(row)}
                                          sx={{ 
                                            color: "#2E7D32",
                                            "&:hover": {
                                              bgcolor: "rgba(46, 125, 50, 0.1)"
                                            }
                                          }}
                                        >
                                          {row.remark ? "Edit Remark" : "Add Remark"}
                                        </Button>
                                      </Box>
                                      <Typography variant="body2">
                                        {row.remark || "No remarks yet. Click 'Add Remark' to add one."}
                                      </Typography>
                                    </Paper>
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
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <SearchIcon sx={{ fontSize: 64, color: "rgba(46, 125, 50, 0.3)", mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            {searchTerm ? "No matching records found" : "No timesheet records"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? "Try adjusting your search" : "Data will appear here once available"}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Footer with summary */}
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
                  Showing {filteredTimesheets.length} of {timesheets.length} records
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Total hours: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0).toFixed(1)}h
                </Typography>
              </Box>
            )}
          </StyledPaper>
        )}

        {/* Detail Dialog */}
        <Dialog 
          open={detailDialogOpen} 
          onClose={closeDetailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: 'hidden',
            }
          }}
        >
          {selectedTimesheet && (
            <>
              <DialogTitle sx={{ 
                bgcolor: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
                color: 'white',
                py: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center',color:'#2E7D32',fontWeight:'bold' }}>
                  <PersonIcon sx={{ mr: 1,color:'#2E7D32' }} />
                  Timesheet Details
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                      Employee Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Employee Name</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTimesheet.employee_name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTimesheet.emp_id}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Department</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTimesheet.department}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Designation</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTimesheet.designation}</Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                      Date & Day Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography variant="body1" fontWeight="bold">{formatDate(selectedTimesheet.date)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Day</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTimesheet.day}</Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                      Work Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Activity Category</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTimesheet.activity_category}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Work Mode</Typography>
                        <WorkModeChip
                          label={selectedTimesheet.work_mode}
                          size="medium"
                          mode={selectedTimesheet.work_mode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Description</Typography>
                        <Paper elevation={0} sx={{ p: 2, mt: 1, bgcolor: 'rgba(46, 125, 50, 0.05)', borderRadius: 1 }}>
                          <Typography variant="body1">{selectedTimesheet.description || "No description"}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                      Time Tracking
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: "Check In", value: formatTime(selectedTimesheet.check_in), color: "#2E7D32" },
                        { label: "Lunch In", value: formatTime(selectedTimesheet.lunch_in), color: "#FF9800" },
                        { label: "Lunch Out", value: formatTime(selectedTimesheet.lunch_out), color: "#7B1FA2" },
                        { label: "Check Out", value: formatTime(selectedTimesheet.check_out), color: "#F44336" }
                      ].map((item, index) => (
                        <Grid item xs={3} key={index}>
                          <Paper elevation={0} sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            bgcolor: `${item.color}10`,
                            borderRadius: 2
                          }}>
                            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                            <Typography variant="h6" fontWeight="bold" color={item.color}>
                              {item.value}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                      Hours Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">Permission Hours</Typography>
                          <Typography variant="h4" color="#F44336">{selectedTimesheet.permission_hours || "0.0"}h</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(46, 125, 50, 0.1)',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">Total Hours</Typography>
                          <Typography variant="h4" color="#2E7D32" fontWeight="bold">
                            {selectedTimesheet.total_hours || "0.0"}h
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                      Remarks
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Paper elevation={0} sx={{ 
                        p: 2, 
                        flex: 1, 
                        bgcolor: selectedTimesheet.remark ? `${getHoursColor(selectedTimesheet.remark)}10` : 'rgba(117, 117, 117, 0.1)', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedTimesheet.remark || "No remarks"}
                        </Typography>
                      </Paper>
                      <GradientButton
                        startIcon={<CommentIcon />}
                        onClick={() => {
                          closeDetailDialog();
                          openRemarkDialog(selectedTimesheet);
                        }}
                      >
                        {selectedTimesheet.remark ? "Edit Remark" : "Add Remark"}
                      </GradientButton>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button 
                  onClick={closeDetailDialog} 
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
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Remark Dialog */}
        <Dialog 
          open={remarkDialogOpen} 
          onClose={closeRemarkDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: 'hidden',
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
            color: 'white',
            py: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CommentIcon sx={{ mr: 1 }} />
              {selectedTimesheet?.remark ? "Update Remark" : "Add Remark"}
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedTimesheet && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: "rgba(46, 125, 50, 0.1)", color: "#2E7D32" }}>
                    {selectedTimesheet.employee_name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedTimesheet.employee_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(selectedTimesheet.date)} ({selectedTimesheet.day})
                    </Typography>
                  </Box>
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Remark"
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter your remark (e.g., Approved, Rejected, Pending Review, etc.)"
                  sx={{ mt: 2 }}
                  helperText="Common remarks: Approved, Rejected, Pending Review, Absent, Late"
                  InputProps={{
                    sx: {
                      borderRadius: "8px",
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
                    }
                  }}
                />
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['Approved', 'Rejected', 'Pending Review', 'Absent', 'Late', 'Half Day'].map((suggestion) => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      size="small"
                      onClick={() => setRemarkText(suggestion)}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: "rgba(46, 125, 50, 0.1)",
                        color: "#2E7D32",
                        "&:hover": {
                          bgcolor: "rgba(46, 125, 50, 0.2)"
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={closeRemarkDialog} 
              variant="outlined" 
              disabled={updatingRemark}
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
              onClick={handleUpdateRemark} 
              disabled={updatingRemark || !remarkText.trim()}
              startIcon={updatingRemark ? <CircularProgress size={20} color="inherit" /> : <CommentIcon />}
              sx={{ borderRadius: "8px" }}
            >
              {updatingRemark ? "Updating..." : "Update Remark"}
            </GradientButton>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}