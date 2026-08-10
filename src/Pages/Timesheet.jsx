import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Menu,
  Radio,
  Checkbox,
  FormControlLabel,
  Divider,
  Pagination,
  GlobalStyles,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
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
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  MoreVert as MoreVertIcon,
  DoneAll as DoneAllIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../Config";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------------------------------------------------------------------------
// Shared design tokens — same palette/type used across Todo, Timesheet,
// Header, Sidebar, Notifications, Profile and User Management. Worth
// lifting into a single `theme/tokens.js` file so all pages stay in lockstep.
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
  violet: "#7C3AED",
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

// Radial progress ring — same signature visual as the rest of the app.
const RadialProgress = ({ value = 0, size = 108, stroke = 11, color = COLORS.primary }) => {
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
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.ink, lineHeight: 1 }}>
          <Display>{Math.round(value)}%</Display>
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.muted, fontSize: '0.62rem' }}>
          approved
        </Typography>
      </Box>
    </Box>
  );
};

const StatTile = ({ label, value, color, icon }) => (
  <Box sx={{ p: 1.75, borderRadius: '14px', bgcolor: alpha(color, 0.06), borderLeft: `3px solid ${color}`, minWidth: 130, flex: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color }}>
        <Display>{value}</Display>
      </Typography>
      <Box sx={{ color, opacity: 0.85, display: 'flex' }}>{icon}</Box>
    </Box>
    <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

// Status (remark) / work-mode color maps — drive chip colors consistently.
const getStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('approved')) return COLORS.success;
  if (s.includes('rejected')) return COLORS.danger;
  if (s.includes('absent')) return COLORS.violet;
  if (s.includes('pending')) return COLORS.warning;
  return COLORS.muted;
};

const getWorkModeColor = (mode) => {
  switch (mode?.toLowerCase()) {
    case 'office': return COLORS.primary;
    case 'remote': return COLORS.success;
    case 'hybrid': return COLORS.warning;
    case 'wfh': return COLORS.info;
    case 'leave': return COLORS.danger;
    default: return COLORS.muted;
  }
};

const StatusChip = styled(Chip)(({ status }) => {
  const color = getStatusColor(status);
  return {
    borderRadius: 8,
    fontWeight: 600,
    backgroundColor: alpha(color, 0.12),
    color,
    border: `1px solid ${alpha(color, 0.3)}`,
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
    border: `1px solid ${alpha(color, 0.3)}`,
    '&:hover': { backgroundColor: alpha(color, 0.18) },
  };
});

const RemarkTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  "& .MuiTooltip-tooltip": {
    backgroundColor: COLORS.primary,
    color: "white",
    fontSize: "0.875rem",
    borderRadius: "8px",
    padding: "10px 12px",
    fontWeight: 500,
    maxWidth: "300px",
    boxShadow: `0 4px 12px ${alpha(COLORS.primary, 0.3)}`,
  },
});

// ==================== UTILITY FUNCTIONS ====================

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
    return dateString.split("T")[0];
  }
};

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  try {
    return timeString.substring(0, 5);
  } catch {
    return timeString;
  }
};

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

const getHoursColor = (hours) => {
  const h = parseFloat(hours) || 0;
  if (h >= 8) return COLORS.success;
  if (h >= 6) return COLORS.warning;
  return COLORS.danger;
};

const getRemarkFirstWord = (remark) => {
  if (!remark) return "Pending";
  const words = remark.trim().split(" ");
  return words[0];
};

// ==================== MAIN COMPONENT ====================

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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Selection states
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedRowForMenu, setSelectedRowForMenu] = useState(null);
  const actionMenuOpen = Boolean(actionMenuAnchorEl);

  // ==================== MEMOIZED COMPUTATIONS ====================

  // Calculate working hours, OT hours, and total hours for each timesheet
  const timesheetsWithCalculatedHours = useMemo(() => {
    return timesheets.map(row => {
      const workingHours = calculateWorkingHours(
        row.check_in,
        row.check_out,
        row.lunch_in,
        row.lunch_out,
        row.permission_hours
      );
      const otHours = parseFloat(row.ot_hours) || 0;
      const totalHours = workingHours + otHours;
      
      return {
        ...row,
        working_hours: workingHours,
        ot_hours: otHours,
        total_hours_calculated: totalHours,
        // Keep original total_hours from API if it exists, otherwise use calculated
        display_total_hours: row.total_hours || totalHours,
      };
    });
  }, [timesheets]);

  const filteredTimesheets = useMemo(() => {
    let result = timesheetsWithCalculatedHours;

    const normalizedSearch = searchTerm.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalizedSearch) {
      result = result.filter((row) =>
        (row.employee_name || "").trim().toLowerCase().replace(/\s+/g, " ").includes(normalizedSearch)
      );
    }

    if (selectedStatus !== "all") {
      result = result.filter((row) => {
        const remarkLower = row.remark?.toLowerCase() || "";
        if (selectedStatus === "approved") return remarkLower.includes("approved");
        if (selectedStatus === "pending") return !remarkLower.includes("approved") && !remarkLower.includes("rejected");
        if (selectedStatus === "rejected") return remarkLower.includes("rejected");
        return true;
      });
    }

    return result;
  }, [timesheetsWithCalculatedHours, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    const totalWorkingHours = timesheets.reduce((sum, row) => sum + (parseFloat(row.working_hours) || 0), 0);
    const totalOTHours = timesheets.reduce((sum, row) => sum + (parseFloat(row.ot_hours) || 0), 0);
    const totalHours = timesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours_calculated) || 0), 0);
    const uniqueEmployees = [...new Set(timesheets.map(row => row.employee_name))].length;
    const pendingApprovals = timesheets.filter(row => !row.remark || row.remark === "").length;
    const approvedTimesheets = timesheets.filter(row => row.remark?.toLowerCase().includes("approved")).length;
    return { totalWorkingHours, totalOTHours, totalHours, uniqueEmployees, pendingApprovals, approvedTimesheets };
  }, [timesheets]);

  const approvedRate = timesheets.length > 0 ? (stats.approvedTimesheets / timesheets.length) * 100 : 0;

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredTimesheets.slice(start, end);
  }, [filteredTimesheets, page, rowsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredTimesheets.length / rowsPerPage);
  }, [filteredTimesheets.length, rowsPerPage]);

  // ==================== API CALLS ====================

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
      const url = `${API_BASE_URL}admin/${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Process data to include calculated hours
      const processedData = data.map(row => {
        const workingHours = calculateWorkingHours(
          row.check_in,
          row.check_out,
          row.lunch_in,
          row.lunch_out,
          row.permission_hours
        );
        const otHours = parseFloat(row.ot_hours) || 0;
        const totalHours = workingHours + otHours;
        
        return {
          ...row,
          working_hours: workingHours,
          ot_hours: otHours,
          total_hours_calculated: totalHours,
          display_total_hours: row.total_hours || totalHours,
        };
      });
      
      setTimesheets(processedData);
      setSelectedRows(new Set());
      setSelectAll(false);
      setPage(1);
      toast.success(`Loaded ${processedData.length} timesheets successfully!`);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to load timesheets. Please try again.");
      toast.error("Failed to load timesheets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, startDate, endDate]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}admin/departments`);
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error("Fetch departments error:", error);
    }
  }, []);

  useEffect(() => {
    fetchTimesheets();
    fetchDepartments();
  }, [fetchTimesheets, fetchDepartments]);

  // ==================== FILTER FUNCTIONS ====================

  const handleApplyFilters = useCallback(() => {
    fetchTimesheets();
    toast.info("Filters applied successfully!");
  }, [fetchTimesheets]);

  const handleClearFilters = useCallback(() => {
    setSelectedDepartment("all");
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    setPage(1);
    fetchTimesheets();
    toast.info("Filters cleared!");
  }, [fetchTimesheets]);

  // ==================== ROW EXPANSION ====================

  const toggleRowExpansion = useCallback((id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  }, []);

  // ==================== DIALOG FUNCTIONS ====================

  const openDetailDialog = useCallback((timesheet) => {
    setSelectedTimesheet(timesheet);
    setDetailDialogOpen(true);
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialogOpen(false);
    setSelectedTimesheet(null);
  }, []);

  const openRemarkDialog = useCallback((timesheet) => {
    setSelectedTimesheet(timesheet);
    setRemarkText(timesheet.remark || "");
    setRemarkDialogOpen(true);
  }, []);

  const closeRemarkDialog = useCallback(() => {
    setRemarkDialogOpen(false);
    setSelectedTimesheet(null);
    setRemarkText("");
  }, []);

  const handleUpdateRemark = useCallback(async () => {
    if (!selectedTimesheet || !remarkText.trim()) return;

    setUpdatingRemark(true);
    try {
      const response = await fetch(`${API_BASE_URL}admin/${selectedTimesheet.id}/remark`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remark: remarkText }),
      });

      if (!response.ok) throw new Error("Failed to update remark");

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
  }, [selectedTimesheet, remarkText, closeRemarkDialog]);

  // ==================== SELECTION FUNCTIONS ====================

  const handleRowSelect = useCallback((id) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = paginatedData.map(row => row.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  }, [selectAll, paginatedData]);

  const handleBulkApprove = useCallback(async () => {
    if (selectedRows.size === 0) {
      toast.warning("Please select at least one timesheet to approve.");
      return;
    }

    setBulkUpdateLoading(true);
    try {
      const approvePromises = Array.from(selectedRows).map(async (id) => {
        const response = await fetch(`${API_BASE_URL}admin/${id}/remark`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ remark: "Approved" }),
        });

        if (!response.ok) throw new Error(`Failed to update timesheet ${id}`);
        return response.json();
      });

      await Promise.all(approvePromises);

      setTimesheets(prev =>
        prev.map(ts =>
          selectedRows.has(ts.id) ? { ...ts, remark: "Approved" } : ts
        )
      );

      toast.success(`${selectedRows.size} timesheet(s) approved successfully!`);
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast.error("Failed to approve some timesheets. Please try again.");
    } finally {
      setBulkUpdateLoading(false);
    }
  }, [selectedRows]);

  // ==================== EXPORT FUNCTIONS ====================

  const handleExportMenuOpen = useCallback((event) => {
    setExportAnchorEl(event.currentTarget);
  }, []);

  const handleExportMenuClose = useCallback(() => {
    setExportAnchorEl(null);
  }, []);

  const handleActionMenuOpen = useCallback((event, timesheet) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedRowForMenu(timesheet);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedRowForMenu(null);
  }, []);

  const handleOpenDetailsFromMenu = useCallback(() => {
    if (selectedRowForMenu) {
      openDetailDialog(selectedRowForMenu);
      handleActionMenuClose();
    }
  }, [selectedRowForMenu, openDetailDialog, handleActionMenuClose]);

  const handleOpenRemarkFromMenu = useCallback(() => {
    if (selectedRowForMenu) {
      openRemarkDialog(selectedRowForMenu);
      handleActionMenuClose();
    }
  }, [selectedRowForMenu, openRemarkDialog, handleActionMenuClose]);

  // ==================== DETAIL PDF EXPORT FOR SELECTED ROWS ====================
  const exportSelectedDetailPDF = useCallback(async () => {
    if (selectedRows.size === 0) {
      toast.warning("Please select at least one timesheet to export.");
      return;
    }

    try {
      toast.info(`Generating detailed PDF for ${selectedRows.size} records...`);

      const selectedData = timesheets.filter(ts => selectedRows.has(ts.id));

      if (selectedData.length === 0) {
        toast.warning("No data found for selected records.");
        return;
      }

      const formatDateLocal = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
          return dateString;
        }
      };

      const formatTimeLocal = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString.substring(0, 5);
      };

      const calculateWorkDurationLocal = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '0h 0m';
        try {
          const [inHour, inMin] = checkIn.split(':').map(Number);
          const [outHour, outMin] = checkOut.split(':').map(Number);

          const inMinutes = inHour * 60 + inMin;
          const outMinutes = outHour * 60 + outMin;

          const diffMinutes = outMinutes - inMinutes;
          if (diffMinutes < 0) return '0h 0m';

          const hours = Math.floor(diffMinutes / 60);
          const minutes = diffMinutes % 60;
          return `${hours}h ${minutes}m`;
        } catch {
          return '0h 0m';
        }
      };

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const PDF_COLORS = {
        primary: [79, 70, 229],
        text: [30, 27, 46],
        lightText: [107, 114, 128],
        border: [229, 231, 235],
        white: [255, 255, 255],
        success: [16, 185, 129],
        warning: [245, 158, 11],
        error: [239, 68, 68],
        violet: [124, 58, 237],
        orange: [249, 115, 22],
        rowAlt: [246, 247, 251],
      };

      const MARGIN = { top: 12, right: 12, bottom: 20, left: 12 };
      const LINE_HEIGHT = 4.5;

      let currentY = MARGIN.top;

      // ===== HEADER =====
      doc.setFontSize(20);
      doc.setTextColor(...PDF_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('C-Tech Engineering', MARGIN.left, currentY);

      currentY += 6;
      doc.setFontSize(11);
      doc.setTextColor(...PDF_COLORS.text);
      doc.setFont('helvetica', 'normal');
      doc.text('Employee Timesheet - Detailed Report', MARGIN.left, currentY);

      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.lightText);
      const reportDate = format(new Date(), 'dd MMM yyyy, HH:mm');
      doc.text(`Generated: ${reportDate}`, pageWidth - MARGIN.right, currentY - 6, { align: 'right' });
      doc.text(`Total Records: ${selectedData.length}`, pageWidth - MARGIN.right, currentY, { align: 'right' });

      currentY += 8;

      doc.setDrawColor(...PDF_COLORS.primary);
      doc.setLineWidth(0.5);
      doc.line(MARGIN.left, currentY, pageWidth - MARGIN.right, currentY);
      currentY += 6;

      // ===== SUMMARY STATISTICS =====
      const totalWorkingHoursSel = selectedData.reduce((sum, row) => sum + (parseFloat(row.working_hours) || 0), 0);
      const totalOTHoursSel = selectedData.reduce((sum, row) => sum + (parseFloat(row.ot_hours) || 0), 0);
      const totalHoursSel = selectedData.reduce((sum, row) => sum + (parseFloat(row.total_hours_calculated) || 0), 0);
      const uniqueEmployeesSel = [...new Set(selectedData.map(row => row.employee_name))].length;
      const pendingCount = selectedData.filter(row => !row.remark || row.remark === "").length;
      const approvedCount = selectedData.filter(row => row.remark && row.remark.toLowerCase().includes("approved")).length;

      const summaryStats = [
        { label: 'Employees', value: uniqueEmployeesSel.toString(), color: PDF_COLORS.primary },
        { label: 'Working Hours', value: totalWorkingHoursSel.toFixed(1) + 'h', color: PDF_COLORS.primary },
        { label: 'OT Hours', value: totalOTHoursSel.toFixed(1) + 'h', color: PDF_COLORS.orange },
        { label: 'Total Hours', value: totalHoursSel.toFixed(1) + 'h', color: PDF_COLORS.success },
        { label: 'Pending', value: pendingCount.toString(), color: PDF_COLORS.warning },
        { label: 'Approved', value: approvedCount.toString(), color: PDF_COLORS.success },
      ];

      const statBoxWidth = (pageWidth - MARGIN.left - MARGIN.right - 10) / 6;
      const statBoxHeight = 14;
      const statBoxY = currentY;

      summaryStats.forEach((stat, index) => {
        const boxX = MARGIN.left + (index * (statBoxWidth + 2));

        doc.setFillColor(...PDF_COLORS.white);
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.3);
        doc.rect(boxX, statBoxY, statBoxWidth, statBoxHeight, 'FD');

        doc.setDrawColor(...stat.color);
        doc.setLineWidth(0.8);
        doc.line(boxX, statBoxY, boxX, statBoxY + statBoxHeight);

        doc.setFontSize(6);
        doc.setTextColor(...PDF_COLORS.lightText);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, boxX + 2, statBoxY + 3.5);

        doc.setFontSize(9);
        doc.setTextColor(...stat.color);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, boxX + 2, statBoxY + 9.5);
      });

      currentY = statBoxY + statBoxHeight + 10;

      // ===== PROCESS EACH TIMESHEET =====
      selectedData.forEach((timesheet, index) => {
        if (currentY > pageHeight - 65) {
          doc.addPage();
          currentY = MARGIN.top;
        }

        doc.setFontSize(10);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(`Record ${index + 1} of ${selectedData.length}`, MARGIN.left, currentY);
        currentY += 3;

        doc.setDrawColor(...PDF_COLORS.primary);
        doc.setLineWidth(0.3);
        doc.line(MARGIN.left, currentY, pageWidth - MARGIN.right, currentY);
        currentY += 5;

        doc.setFontSize(9);
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Information', MARGIN.left, currentY);
        currentY += 4;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');

        const empFields = [
          ['Name:', timesheet.employee_name || 'N/A'],
          ['ID:', timesheet.emp_id || 'N/A'],
          ['Department:', timesheet.department || 'N/A'],
          ['Designation:', timesheet.designation || 'N/A'],
          ['Date:', formatDateLocal(timesheet.date)],
          ['Day:', timesheet.day || 'N/A'],
        ];

        empFields.forEach(([label, value], idx) => {
          const col1X = MARGIN.left;
          const col2X = MARGIN.left + 95;
          const x = idx % 2 === 0 ? col1X : col2X;
          const y = currentY + (Math.floor(idx / 2) * LINE_HEIGHT);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...PDF_COLORS.lightText);
          doc.text(label, x, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...PDF_COLORS.text);
          doc.text(value, x + 22, y);
        });

        currentY += 13;

        doc.setFontSize(9);
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Work Information', MARGIN.left, currentY);
        currentY += 4;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');

        const workFields = [
          ['Activity:', timesheet.activity_category || 'N/A'],
          ['Work Mode:', timesheet.work_mode || 'N/A'],
          ['Working Hours:', `${(timesheet.working_hours || 0).toFixed(1)}h`],
          ['OT Hours:', `${(timesheet.ot_hours || 0).toFixed(1)}h`],
          ['Total Hours:', `${(timesheet.total_hours_calculated || 0).toFixed(1)}h`],
          ['Permission Hours:', `${timesheet.permission_hours || '0.0'}h`],
        ];

        workFields.forEach(([label, value], idx) => {
          const col1X = MARGIN.left;
          const col2X = MARGIN.left + 95;
          const x = idx % 2 === 0 ? col1X : col2X;
          const y = currentY + (Math.floor(idx / 2) * LINE_HEIGHT);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...PDF_COLORS.lightText);
          doc.text(label, x, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...PDF_COLORS.text);
          doc.text(value, x + 28, y);
        });

        currentY += 13;

        if (timesheet.description && timesheet.description.trim()) {
          if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = MARGIN.top;
          }

          doc.setFontSize(8);
          doc.setTextColor(...PDF_COLORS.text);
          doc.setFont('helvetica', 'bold');
          doc.text('Description:', MARGIN.left, currentY);
          currentY += 3;

          const descLines = doc.splitTextToSize(
            timesheet.description,
            pageWidth - MARGIN.left - MARGIN.right - 4
          );
          const descHeight = descLines.length * 3.2 + 3;

          doc.setDrawColor(...PDF_COLORS.border);
          doc.setFillColor(...PDF_COLORS.rowAlt);
          doc.setLineWidth(0.2);
          doc.rect(
            MARGIN.left,
            currentY - 1,
            pageWidth - MARGIN.left - MARGIN.right,
            descHeight + 2,
            'FD'
          );

          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...PDF_COLORS.text);
          doc.text(descLines, MARGIN.left + 2, currentY + 2);

          currentY += descHeight + 5;
        }

        if (currentY > pageHeight - 35) {
          doc.addPage();
          currentY = MARGIN.top;
        }

        doc.setFontSize(9);
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Time Tracking', MARGIN.left, currentY);
        currentY += 4;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');

        const timeFields = [
          { label: 'Check In:', value: formatTimeLocal(timesheet.check_in), color: PDF_COLORS.success },
          { label: 'Check Out:', value: formatTimeLocal(timesheet.check_out), color: PDF_COLORS.error },
          { label: 'Lunch In:', value: formatTimeLocal(timesheet.lunch_in), color: PDF_COLORS.warning },
          { label: 'Lunch Out:', value: formatTimeLocal(timesheet.lunch_out), color: PDF_COLORS.violet },
        ];

        timeFields.forEach(({ label, value, color }, idx) => {
          const col1X = MARGIN.left;
          const col2X = MARGIN.left + 95;
          const x = idx % 2 === 0 ? col1X : col2X;
          const y = currentY + (Math.floor(idx / 2) * LINE_HEIGHT);

          doc.setDrawColor(...PDF_COLORS.border);
          doc.setFillColor(...PDF_COLORS.white);
          doc.setLineWidth(0.2);
          doc.rect(x, y - 2.5, 50, 5.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...PDF_COLORS.lightText);
          doc.text(label, x + 1.5, y + 0.5);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...color);
          doc.text(value, x + 26, y + 0.5);
        });

        currentY += 13;

        const workDuration = calculateWorkDurationLocal(timesheet.check_in, timesheet.check_out);

        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Work Duration:', MARGIN.left, currentY);

        doc.setFontSize(9);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(workDuration, MARGIN.left + 32, currentY);

        currentY += 5;

        const remark = timesheet.remark || 'Pending Review';
        const statusColor = remark.toLowerCase().includes('approved') ? PDF_COLORS.success :
                           remark.toLowerCase().includes('rejected') ? PDF_COLORS.error :
                           PDF_COLORS.warning;

        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Status:', MARGIN.left, currentY);

        doc.setFontSize(8);
        doc.setTextColor(...statusColor);
        doc.setFont('helvetica', 'bold');
        doc.text(remark, MARGIN.left + 15, currentY);

        currentY += 8;

        if (index < selectedData.length - 1) {
          doc.setDrawColor(...PDF_COLORS.border);
          doc.setLineWidth(0.2);
          doc.setLineDashPattern([2, 2]);
          doc.line(MARGIN.left, currentY, pageWidth - MARGIN.right, currentY);
          doc.setLineDashPattern([]);
          currentY += 5;
        }
      });

      // ===== FOOTER =====
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...PDF_COLORS.lightText);
        doc.setFont('helvetica', 'normal');

        doc.line(
          MARGIN.left,
          pageHeight - MARGIN.bottom + 2,
          pageWidth - MARGIN.right,
          pageHeight - MARGIN.bottom + 2
        );

        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - MARGIN.bottom + 6,
          { align: 'center' }
        );

        doc.text(
          `C-Tech Engineering Employee Management System`,
          pageWidth / 2,
          pageHeight - MARGIN.bottom + 10,
          { align: 'center' }
        );
      }

      const fileName = `Timesheet_Details_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      doc.save(fileName);

      toast.success(`Detailed PDF generated with ${selectedData.length} records!`);
      setSelectedRows(new Set());
      setSelectAll(false);

    } catch (error) {
      console.error("Detail PDF export error:", error);
      toast.error("Failed to generate detailed PDF. Please try again.");
    }
  }, [selectedRows, timesheets]);

  // ==================== EXCEL EXPORT ====================

  const exportToExcel = useCallback(() => {
    handleExportMenuClose();

    try {
      const exportData = filteredTimesheets.map(row => ({
        'Date': formatDate(row.date),
        'Day': row.day,
        'Employee ID': row.emp_id,
        'Employee Name': row.employee_name,
        'Department': row.department,
        'Designation': row.designation,
        'Activity Category': row.activity_category,
        'Work Mode': row.work_mode,
        'Description': row.description || '',
        'Permission Hours': row.permission_hours || 0,
        'Working Hours': (row.working_hours || 0).toFixed(1),
        'OT Hours': (row.ot_hours || 0).toFixed(1),
        'Total Hours': (row.total_hours_calculated || 0).toFixed(1),
        'Check In': formatTime(row.check_in),
        'Check Out': formatTime(row.check_out),
        'Lunch In': formatTime(row.lunch_in),
        'Lunch Out': formatTime(row.lunch_out),
        'Work Duration': calculateWorkDuration(row.check_in, row.check_out),
        'Remark': row.remark || 'Pending',
        'Created At': row.created_at ? formatDate(row.created_at) : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const columnWidths = [
        { wch: 12 }, { wch: 8 },  { wch: 12 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 15 },
        { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      ];

      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheets");

      const fileName = `timesheets_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Exported ${exportData.length} records to Excel successfully!`);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export to Excel. Please try again.");
    }
  }, [filteredTimesheets, handleExportMenuClose]);

  // ==================== PDF EXPORT ====================

  const exportToPDF = useCallback(() => {
    handleExportMenuClose();

    try {
      toast.info('Generating PDF report...');

      const totalWorkingHoursAll = filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.working_hours) || 0), 0);
      const totalOTHoursAll = filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.ot_hours) || 0), 0);
      const totalHoursAll = filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours_calculated) || 0), 0);
      const uniqueEmployeesAll = [...new Set(filteredTimesheets.map(row => row.employee_name))].length;
      const pendingApprovalsAll = filteredTimesheets.filter(row => !row.remark || row.remark === "").length;
      const approvedTimesheetsAll = filteredTimesheets.filter(row => row.remark?.toLowerCase().includes("approved")).length;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const MARGIN = { top: 12, right: 12, bottom: 15, left: 12 };
      const CONTENT_WIDTH = pageWidth - MARGIN.left - MARGIN.right;

      const PDF_COLORS = {
        primary: [79, 70, 229],
        text: [30, 27, 46],
        lightText: [107, 114, 128],
        border: [229, 231, 235],
        rowAlt: [246, 247, 251],
        white: [255, 255, 255],
        pending: [245, 158, 11],
        approved: [16, 185, 129],
        orange: [249, 115, 22],
      };

      let currentY = MARGIN.top;

      doc.setFontSize(20);
      doc.setTextColor(...PDF_COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('C-Tech Employee Time Sheet Report', MARGIN.left, currentY);

      doc.setFontSize(10);
      doc.setTextColor(...PDF_COLORS.lightText);
      doc.setFont('helvetica', 'normal');
      doc.text('Comprehensive payroll and attendance analysis', MARGIN.left, currentY + 6);

      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.lightText);
      const reportDate = format(new Date(), 'dd MMM yyyy, HH:mm');
      doc.text(`Generated: ${reportDate}`, pageWidth - MARGIN.right, currentY, { align: 'right' });
      doc.text(`Total Records: ${filteredTimesheets.length}`, pageWidth - MARGIN.right, currentY + 6, { align: 'right' });

      currentY += 15;

      const summaryStats = [
        { label: 'Employees', value: uniqueEmployeesAll.toString(), borderColor: PDF_COLORS.primary },
        { label: 'Working Hours', value: totalWorkingHoursAll.toFixed(1) + 'h', borderColor: PDF_COLORS.primary },
        { label: 'OT Hours', value: totalOTHoursAll.toFixed(1) + 'h', borderColor: PDF_COLORS.orange },
        { label: 'Total Hours', value: totalHoursAll.toFixed(1) + 'h', borderColor: PDF_COLORS.approved },
        { label: 'Pending', value: pendingApprovalsAll.toString(), borderColor: PDF_COLORS.pending },
        { label: 'Approved', value: approvedTimesheetsAll.toString(), borderColor: PDF_COLORS.approved },
      ];

      const statBoxWidth = CONTENT_WIDTH / 6 - 1.5;
      const statBoxHeight = 18;
      const statBoxY = currentY;

      summaryStats.forEach((stat, index) => {
        const boxX = MARGIN.left + (index * (statBoxWidth + 2));

        doc.setFillColor(...PDF_COLORS.white);
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.3);
        doc.rect(boxX, statBoxY, statBoxWidth, statBoxHeight, 'FD');

        doc.setDrawColor(...stat.borderColor);
        doc.setLineWidth(0.8);
        doc.line(boxX, statBoxY, boxX, statBoxY + statBoxHeight);

        doc.setFontSize(7);
        doc.setTextColor(...PDF_COLORS.lightText);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, boxX + 2, statBoxY + 4);

        doc.setFontSize(11);
        doc.setTextColor(...stat.borderColor);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, boxX + 2, statBoxY + 12);
      });

      currentY = statBoxY + statBoxHeight + 8;

      const tableData = filteredTimesheets.map(row => [
        formatDate(row.date),
        row.employee_name || 'N/A',
        row.department || 'N/A',
        row.designation || 'N/A',
        row.work_mode || 'N/A',
        (row.working_hours || 0).toFixed(1),
        (row.ot_hours || 0).toFixed(1),
        (row.total_hours_calculated || 0).toFixed(1),
        row.remark || 'Pending',
        formatTime(row.check_in) || 'N/A',
        formatTime(row.check_out) || 'N/A'
      ]);

      autoTable(doc, {
        head: [['Date', 'Employee', 'Department', 'Designation', 'Work Mode', 'Working Hrs', 'OT Hrs', 'Total Hrs', 'Remark', 'Check In', 'Check Out']],
        body: tableData,
        startY: currentY,
        theme: 'grid',

        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'left' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'center' },
          8: { halign: 'left' },
          9: { halign: 'center' },
          10: { halign: 'center' }
        },

        headStyles: {
          fillColor: PDF_COLORS.primary,
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          cellPadding: 2.5,
          halign: 'center',
          valign: 'middle',
          lineColor: PDF_COLORS.primary,
          lineWidth: 0.1
        },

        bodyStyles: {
          fontSize: 7,
          textColor: PDF_COLORS.text,
          cellPadding: 2,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.1,
          valign: 'middle'
        },

        alternateRowStyles: {
          fillColor: PDF_COLORS.rowAlt,
          textColor: PDF_COLORS.text,
          cellPadding: 2,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.1,
          valign: 'middle'
        },

        didParseCell: function (data) {
          if (data.column.index === 8) {
            const cellText = data.cell.text[0];
            if (cellText === 'Pending') {
              data.cell.textColor = PDF_COLORS.pending;
              data.cell.fontStyle = 'normal';
            } else if (cellText.toLowerCase().includes('approved')) {
              data.cell.textColor = PDF_COLORS.approved;
              data.cell.fontStyle = 'bold';
            }
          }
        },

        margin: {
          left: MARGIN.left,
          right: MARGIN.right,
          bottom: MARGIN.bottom
        },

        rowPageBreak: 'avoid',

        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(...PDF_COLORS.lightText);
          doc.setFont('helvetica', 'normal');

          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - MARGIN.bottom + 4,
            { align: 'center' }
          );
        }
      });

      const fileName = `C-Tech_Timesheet_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`;
      doc.save(fileName);

      toast.success(`PDF report generated with ${filteredTimesheets.length} records!`);

    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF report. Please try again.");
    }
  }, [filteredTimesheets, handleExportMenuClose]);

  // ==================== PAGINATION ====================

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
    setExpandedRows([]);
    const tableContainer = document.querySelector('.MuiTableContainer-root');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  }, []);

  // ==================== RENDER ====================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <GlobalStyles styles={fontImport} />
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

      <Shell sx={{ px: { xs: 2, md: 4 }, py: 3, bgcolor: COLORS.bg, minHeight: "100vh" }}>
        {/* Header Section */}
        <Surface sx={{ p: { xs: 2, md: 3.5 }, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: COLORS.ink }}>
                <Display>Timesheet management</Display>
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted, mt: 0.5 }}>
                Monitor and approve employee work logs.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {selectedRows.size > 0 && (
                <>
                  <Tooltip title={`Approve ${selectedRows.size} selected timesheet(s)`}>
                    <Button
                      variant="contained"
                      startIcon={<DoneAllIcon />}
                      onClick={handleBulkApprove}
                      disabled={bulkUpdateLoading}
                      sx={{
                        bgcolor: COLORS.success,
                        "&:hover": { bgcolor: "#0E9F73" },
                        borderRadius: "10px",
                        px: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: { xs: "auto", md: 200 },
                      }}
                    >
                      {bulkUpdateLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        `Approve (${selectedRows.size})`
                      )}
                    </Button>
                  </Tooltip>

                  <Tooltip title={`Export ${selectedRows.size} selected records`}>
                    <Button
                      variant="contained"
                      startIcon={<PdfIcon />}
                      onClick={exportSelectedDetailPDF}
                      sx={{
                        bgcolor: COLORS.danger,
                        "&:hover": { bgcolor: "#DC2626" },
                        borderRadius: "10px",
                        px: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: { xs: "auto", md: 200 },
                      }}
                    >
                      Detail PDF ({selectedRows.size})
                    </Button>
                  </Tooltip>
                </>
              )}

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportMenuOpen}
                sx={{
                  borderColor: COLORS.border,
                  color: COLORS.muted,
                  borderRadius: "10px",
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  "&:hover": { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) }
                }}
              >
                Export
              </Button>

              <Menu
                anchorEl={exportAnchorEl}
                open={exportMenuOpen}
                onClose={handleExportMenuClose}
                PaperProps={{ sx: { borderRadius: "14px", mt: 1, minWidth: 220 } }}
              >
                <MenuItem onClick={exportToExcel} sx={{ py: 1.5 }}>
                  <ExcelIcon sx={{ mr: 2, color: COLORS.success }} />
                  <Typography>Excel</Typography>
                </MenuItem>
                <MenuItem onClick={exportToPDF} sx={{ py: 1.5 }}>
                  <PdfIcon sx={{ mr: 2, color: COLORS.danger }} />
                  <Typography>PDF report</Typography>
                </MenuItem>
                <MenuItem onClick={exportSelectedDetailPDF} sx={{ py: 1.5 }}>
                  <DescriptionIcon sx={{ mr: 2, color: COLORS.violet }} />
                  <Typography>Detail PDF (selected)</Typography>
                </MenuItem>
              </Menu>

              <Menu
                anchorEl={actionMenuAnchorEl}
                open={actionMenuOpen}
                onClose={handleActionMenuClose}
                PaperProps={{ sx: { borderRadius: "14px", mt: 1, minWidth: 200 } }}
              >
                <MenuItem onClick={handleOpenDetailsFromMenu} sx={{ py: 1.5 }}>
                  <InfoIcon sx={{ mr: 2, color: COLORS.primary }} />
                  <Typography>View details</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleOpenRemarkFromMenu} sx={{ py: 1.5 }}>
                  <CommentIcon sx={{ mr: 2, color: COLORS.success }} />
                  <Typography>Add/edit remark</Typography>
                </MenuItem>
              </Menu>

              <Tooltip title="Toggle filters">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    bgcolor: showFilters ? alpha(COLORS.primary, 0.12) : COLORS.bg,
                    color: showFilters ? COLORS.primary : COLORS.muted,
                    border: `1px solid ${COLORS.border}`,
                    "&:hover": { bgcolor: alpha(COLORS.primary, 0.12), color: COLORS.primary }
                  }}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh data">
                <IconButton
                  onClick={fetchTimesheets}
                  sx={{ bgcolor: COLORS.bg, color: COLORS.muted, border: `1px solid ${COLORS.border}`, "&:hover": { bgcolor: alpha(COLORS.primary, 0.12), color: COLORS.primary } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {selectedRows.size > 0 && (
            <Alert
              severity="info"
              sx={{ mb: 3, borderRadius: "12px", border: `1px solid ${alpha(COLORS.primary, 0.25)}`, bgcolor: alpha(COLORS.primary, 0.05) }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setSelectedRows(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear
                </Button>
              }
            >
              <Typography variant="body2">
                <strong>{selectedRows.size} timesheet(s)</strong> selected
                <Button
                  variant="text"
                  size="small"
                  startIcon={<PdfIcon />}
                  onClick={exportSelectedDetailPDF}
                  sx={{ ml: 2, color: COLORS.danger, fontWeight: 600, textTransform: 'none' }}
                >
                  Export detail PDF
                </Button>
              </Typography>
            </Alert>
          )}

          {/* Overview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, flexWrap: 'wrap', mb: 3 }}>
            <RadialProgress value={approvedRate} color={COLORS.primary} />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
              <StatTile label="Total employees" value={stats.uniqueEmployees} color={COLORS.primary} icon={<Groups fontSize="small" />} />
              <StatTile label="Total entries" value={timesheets.length} color={COLORS.info} icon={<CalendarMonth fontSize="small" />} />
              <StatTile label="Working Hours" value={`${stats.totalWorkingHours.toFixed(1)}h`} color={COLORS.primary} icon={<AccessTimeIcon fontSize="small" />} />
              <StatTile label="OT Hours" value={`${stats.totalOTHours.toFixed(1)}h`} color={COLORS.orange} icon={<AccessTimeIcon fontSize="small" />} />
              <StatTile label="Total Hours" value={`${stats.totalHours.toFixed(1)}h`} color={COLORS.success} icon={<TrendingUp fontSize="small" />} />
              <StatTile label="Pending approval" value={stats.pendingApprovals} color={stats.pendingApprovals > 0 ? COLORS.warning : COLORS.success} icon={<Warning fontSize="small" />} />
            </Box>
          </Box>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: COLORS.muted, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: "12px", bgcolor: COLORS.bg }
            }}
          />

          {/* Filter Section */}
          <Collapse in={showFilters}>
            <Divider sx={{ my: 2.5 }} />
            <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ fontSize: 18, color: COLORS.primary }} />
              Filter timesheets
            </Typography>

            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={2.4} minWidth={180}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select value={selectedDepartment} label="Department" onChange={(e) => setSelectedDepartment(e.target.value)} sx={{ borderRadius: "10px", bgcolor: COLORS.bg }}>
                    <MenuItem value="all">All departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2.4} minWidth={180}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={selectedStatus} label="Status" onChange={(e) => setSelectedStatus(e.target.value)} sx={{ borderRadius: "10px", bgcolor: COLORS.bg }}>
                    <MenuItem value="all">All status</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2.4} minWidth={170}>
                <DatePicker
                  label="Start date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { size: "small", fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: "10px", bgcolor: COLORS.bg } } } }}
                />
              </Grid>

              <Grid item xs={12} md={2.4} minWidth={170}>
                <DatePicker
                  label="End date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { size: "small", fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: "10px", bgcolor: COLORS.bg } } } }}
                />
              </Grid>

              <Grid item xs={12} md={2.4} minWidth={200}>
                <Stack direction="row" spacing={1}>
                  <GradientButton onClick={handleApplyFilters} size="small" startIcon={<FilterIcon />} fullWidth>
                    Apply
                  </GradientButton>

                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    size="small"
                    fullWidth
                    sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: "10px", textTransform: 'none', fontWeight: 600, "&:hover": { borderColor: COLORS.primary, color: COLORS.primary } }}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Collapse>
        </Surface>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: "12px", border: `1px solid ${alpha(COLORS.danger, 0.25)}` }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
            <CircularProgress size={56} sx={{ color: COLORS.primary }} />
          </Box>
        ) : (
          <Surface sx={{ overflow: 'hidden' }}>
            {/* Selection Toolbar */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ p: 2, bgcolor: COLORS.bg, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                        sx={{ color: COLORS.faint, '&.Mui-checked': { color: COLORS.primary }, '&.MuiCheckbox-indeterminate': { color: COLORS.primary } }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: COLORS.ink, fontWeight: 600 }}>
                        {selectAll ? "Deselect all" : "Select all"}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" sx={{ color: COLORS.muted, display: { xs: "none", sm: "block" } }}>
                    {selectedRows.size} of {filteredTimesheets.length} selected
                  </Typography>
                </Box>

                {selectedRows.size > 0 && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<DoneAllIcon />}
                      onClick={handleBulkApprove}
                      disabled={bulkUpdateLoading}
                      size="small"
                      sx={{ bgcolor: COLORS.success, "&:hover": { bgcolor: "#0E9F73" }, borderRadius: "8px", px: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {bulkUpdateLoading ? <CircularProgress size={16} color="inherit" /> : `Approve (${selectedRows.size})`}
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<PdfIcon />}
                      onClick={exportSelectedDetailPDF}
                      size="small"
                      sx={{ bgcolor: COLORS.danger, "&:hover": { bgcolor: "#DC2626" }, borderRadius: "8px", px: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Detail PDF
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Table */}
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, width: 60, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Select</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, width: 50, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }} />
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 120, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Date/Day</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 150, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Employee</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 120, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Department</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 120, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Activity</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 100, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Work mode</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 60, textAlign: "center", borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Working Hrs</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 60, textAlign: "center", borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>OT Hrs</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 60, textAlign: "center", borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Total Hrs</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, minWidth: 80, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Remark</TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, width: 60, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row) => {
                      const expanded = expandedRows.includes(row.id);
                      const workingHours = row.working_hours || 0;
                      const otHours = row.ot_hours || 0;
                      const totalHours = row.total_hours_calculated || 0;
                      
                      return (
                        <React.Fragment key={row.id}>
                          <TableRow
                            hover
                            sx={{
                              '&:hover': { bgcolor: alpha(COLORS.primary, 0.03) },
                              borderBottom: expanded ? 'none' : `1px solid ${COLORS.border}`,
                              bgcolor: selectedRows.has(row.id) ? alpha(COLORS.primary, 0.06) : 'inherit'
                            }}
                          >
                            <TableCell sx={{ width: 60 }}>
                              <Radio
                                checked={selectedRows.has(row.id)}
                                onChange={() => handleRowSelect(row.id)}
                                value={row.id}
                                name="timesheet-radio"
                                size="small"
                                sx={{ color: COLORS.faint, '&.Mui-checked': { color: COLORS.primary } }}
                              />
                            </TableCell>

                            <TableCell sx={{ width: 50 }}>
                              <IconButton
                                size="small"
                                onClick={() => toggleRowExpansion(row.id)}
                                sx={{ color: COLORS.muted, "&:hover": { bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary } }}
                              >
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </TableCell>

                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                                  {formatDate(row.date)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                  {row.day}
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontSize: "0.875rem", fontWeight: "bold" }}>
                                  {row.employee_name?.charAt(0) || "U"}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink, display: { xs: "none", md: "block" } }}>
                                    {row.employee_name || "N/A"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                    {row.emp_id || "N/A"}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Chip label={row.department || "N/A"} size="small" sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 600, borderRadius: "6px" }} />
                            </TableCell>

                            <TableCell>
                              <Tooltip title={row.description || "No description"} arrow>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                                  {row.activity_category || "N/A"}
                                </Typography>
                              </Tooltip>
                            </TableCell>

                            <TableCell>
                              <WorkModeChip label={row.work_mode || "N/A"} size="small" mode={row.work_mode} />
                            </TableCell>

                            <TableCell sx={{ textAlign: "center" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getHoursColor(workingHours), mr: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: getHoursColor(workingHours) }}>
                                  {workingHours.toFixed(1)}h
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell sx={{ textAlign: "center" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: otHours > 0 ? COLORS.orange : COLORS.faint, mr: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: otHours > 0 ? COLORS.orange : COLORS.faint }}>
                                  {otHours.toFixed(1)}h
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell sx={{ textAlign: "center" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getHoursColor(totalHours), mr: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: getHoursColor(totalHours) }}>
                                  {totalHours.toFixed(1)}h
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <RemarkTooltip title={row.remark || "Pending"} arrow placement="top">
                                <StatusChip label={getRemarkFirstWord(row.remark)} size="small" status={row.remark} sx={{ cursor: "pointer" }} />
                              </RemarkTooltip>
                            </TableCell>

                            <TableCell>
                              <Tooltip title="More options">
                                <IconButton
                                  size="small"
                                  onClick={(event) => handleActionMenuOpen(event, row)}
                                  sx={{ color: COLORS.muted, "&:hover": { bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary } }}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row */}
                          {expanded && (
                            <TableRow>
                              <TableCell colSpan={12} sx={{ p: 0 }}>
                                <Box sx={{ p: 3, bgcolor: COLORS.bg }}>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                      <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <AccessTimeIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                                        Time tracking
                                      </Typography>
                                      <Grid container spacing={2}>
                                        {[
                                          { icon: <LoginIcon />, label: "Check in", value: formatTime(row.check_in), color: COLORS.success },
                                          { icon: <LogoutIcon />, label: "Check out", value: formatTime(row.check_out), color: COLORS.danger },
                                          { icon: <LunchDiningIcon />, label: "Lunch in", value: formatTime(row.lunch_in), color: COLORS.warning },
                                          { icon: <LunchDiningIcon />, label: "Lunch out", value: formatTime(row.lunch_out), color: COLORS.violet }
                                        ].map((item, index) => (
                                          <Grid item xs={6} key={index}>
                                            <Box sx={{ p: 1.75, bgcolor: alpha(item.color, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(item.color, 0.18)}` }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                                                {React.cloneElement(item.icon, { sx: { mr: 1, fontSize: 18, color: item.color } })}
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.ink }}>{item.label}</Typography>
                                              </Box>
                                              <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>
                                                {item.value}
                                              </Typography>
                                            </Box>
                                          </Grid>
                                        ))}
                                      </Grid>

                                      <Box sx={{ p: 1.75, mt: 2, bgcolor: alpha(COLORS.primary, 0.06), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.primary, 0.18)}` }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.primary, display: 'block' }}>
                                          Work duration (Check-in to Check-out)
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary }}>
                                          {calculateWorkDuration(row.check_in, row.check_out)}
                                        </Typography>
                                      </Box>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                      <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <InfoIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                                        Hours Breakdown
                                      </Typography>

                                      {row.description && (
                                        <Box sx={{ p: 1.75, mb: 2, bgcolor: alpha(COLORS.warning, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.warning, 0.2)}` }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.warning, display: 'block', mb: 0.5 }}>
                                            Description
                                          </Typography>
                                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: COLORS.ink }}>
                                            {row.description}
                                          </Typography>
                                        </Box>
                                      )}

                                      <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={4}>
                                          <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.info, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.info, 0.2)}` }}>
                                            <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 0.5 }}>
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
                                        <Grid item xs={4}>
                                          <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.orange, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.orange, 0.2)}` }}>
                                            <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 0.5 }}>
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
                                        <Grid item xs={4}>
                                          <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.success, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.success, 0.2)}` }}>
                                            <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 0.5 }}>
                                              Total Hours
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.success }}>
                                              {totalHours.toFixed(1)}h
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: COLORS.muted }}>
                                              Working + OT
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>

                                      {row.permission_hours > 0 && (
                                        <Box sx={{ p: 1.75, mb: 2, bgcolor: alpha(COLORS.danger, 0.07), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.danger, 0.2)}` }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.danger, display: 'block', mb: 0.5 }}>
                                            Permission Hours
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: COLORS.ink }}>
                                            {row.permission_hours}h (subtracted from working hours)
                                          </Typography>
                                        </Box>
                                      )}

                                      {row.remark && (
                                        <Box sx={{ p: 1.75, bgcolor: alpha(COLORS.primary, 0.06), borderRadius: 2.5, border: `1px solid ${alpha(COLORS.primary, 0.18)}` }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.primary, display: 'block', mb: 0.5 }}>
                                            Status
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: COLORS.ink }}>
                                            {row.remark}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Grid>
                                  </Grid>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <SearchIcon sx={{ fontSize: 56, color: alpha(COLORS.muted, 0.3), mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ink }}>
                            {searchTerm ? "No matching records found" : "No timesheet records"}
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.muted }}>
                            {searchTerm ? "Try adjusting your search." : "Data will appear here once available."}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ p: 2, bgcolor: COLORS.bg, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 2 }}>
                <Typography variant="body2" sx={{ color: COLORS.muted, fontWeight: 500 }}>
                  Showing {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, filteredTimesheets.length)} of {filteredTimesheets.length} records
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      sx={{ borderRadius: "8px", bgcolor: COLORS.surface, '& .MuiSelect-select': { py: 0.5 } }}
                    >
                      {[5, 10, 25, 50, 100].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    size="medium"
                    showFirstButton
                    showLastButton
                    sx={{ '& .Mui-selected': { bgcolor: `${COLORS.primary} !important`, color: 'white' } }}
                  />
                </Box>
              </Box>
            )}

            {/* Footer */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ p: 2, bgcolor: COLORS.surface, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.info, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: "1.1rem" }} />
                    Working: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.working_hours) || 0), 0).toFixed(1)}h
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.orange, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: "1.1rem" }} />
                    OT: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.ot_hours) || 0), 0).toFixed(1)}h
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.success, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: "1.1rem" }} />
                    Total: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours_calculated) || 0), 0).toFixed(1)}h
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: COLORS.muted }}>
                  {filteredTimesheets.length} records displayed
                </Typography>
              </Box>
            )}
          </Surface>
        )}

        {/* DETAIL DIALOG */}
        <Dialog
          open={detailDialogOpen}
          onClose={closeDetailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: "20px", overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)' } }}
        >
          {selectedTimesheet && (
            <>
              <Box sx={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: 'white', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1.25, fontSize: "1.5rem" }} />
                  <Box>
                    <DialogTitle sx={{ p: 0, fontWeight: 700 }}>
                      <Display>Timesheet details</Display>
                    </DialogTitle>
                    <Typography variant="caption">
                      {selectedTimesheet.employee_name} • {formatDate(selectedTimesheet.date)}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={closeDetailDialog} sx={{ color: 'white' }} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              <DialogContent dividers sx={{ p: 3, bgcolor: COLORS.bg }}>
                <Grid container spacing={3}>
                  {/* Employee Section */}
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Employee information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {[
                        { label: 'Employee name', value: selectedTimesheet.employee_name },
                        { label: 'Employee ID', value: selectedTimesheet.emp_id },
                        { label: 'Department', value: selectedTimesheet.department },
                        { label: 'Designation', value: selectedTimesheet.designation },
                      ].map((f, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Box sx={{ p: 2, bgcolor: COLORS.surface, borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 0.5 }}>{f.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{f.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  {/* Work Section */}
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', mb: 1 }}>
                      <WorkIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Work information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: COLORS.surface, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 0.5 }}>Activity category</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{selectedTimesheet.activity_category}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: COLORS.surface, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 0.5 }}>Work mode</Typography>
                          <WorkModeChip label={selectedTimesheet.work_mode} size="small" mode={selectedTimesheet.work_mode} />
                        </Box>
                      </Grid>
                      {selectedTimesheet.description && (
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: alpha(COLORS.warning, 0.08), borderRadius: 2, border: `1px solid ${alpha(COLORS.warning, 0.2)}` }}>
                            <Typography variant="caption" sx={{ color: COLORS.warning, display: "block", mb: 1, fontWeight: 700 }}>Description</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: COLORS.ink }}>{selectedTimesheet.description}</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>

                  {/* Time Tracking Section */}
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Time tracking
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {[
                        { label: "Check in", value: formatTime(selectedTimesheet.check_in), color: COLORS.success },
                        { label: "Lunch in", value: formatTime(selectedTimesheet.lunch_in), color: COLORS.warning },
                        { label: "Lunch out", value: formatTime(selectedTimesheet.lunch_out), color: COLORS.violet },
                        { label: "Check out", value: formatTime(selectedTimesheet.check_out), color: COLORS.danger }
                      ].map((item, index) => (
                        <Grid item xs={6} sm={3} key={index}>
                          <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(item.color, 0.08), borderRadius: 2, border: `1px solid ${alpha(item.color, 0.2)}` }}>
                            <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 1 }}>{item.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>{item.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(COLORS.primary, 0.08), borderRadius: 2, border: `1px solid ${alpha(COLORS.primary, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 1, fontWeight: 700 }}>Work duration</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary }}>
                            {calculateWorkDuration(selectedTimesheet.check_in, selectedTimesheet.check_out)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Hours Section */}
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Hours summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(COLORS.info, 0.08), borderRadius: 2, border: `1px solid ${alpha(COLORS.info, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 1 }}>Working Hours</Typography>
                          <Typography variant="h5" sx={{ color: COLORS.info, fontWeight: 700 }}>
                            {(selectedTimesheet.working_hours || 0).toFixed(1)}h
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(COLORS.orange, 0.08), borderRadius: 2, border: `1px solid ${alpha(COLORS.orange, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 1 }}>OT Hours</Typography>
                          <Typography variant="h5" sx={{ color: COLORS.orange, fontWeight: 700 }}>
                            {(selectedTimesheet.ot_hours || 0).toFixed(1)}h
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: alpha(COLORS.success, 0.08), borderRadius: 2, border: `1px solid ${alpha(COLORS.success, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 1 }}>Total Hours</Typography>
                          <Typography variant="h5" sx={{ color: COLORS.success, fontWeight: 700 }}>
                            {(selectedTimesheet.total_hours_calculated || 0).toFixed(1)}h
                          </Typography>
                        </Box>
                      </Grid>
                      {selectedTimesheet.permission_hours > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: alpha(COLORS.danger, 0.08), borderRadius: 2, border: `1px solid ${alpha(COLORS.danger, 0.2)}` }}>
                            <Typography variant="caption" sx={{ color: COLORS.danger, display: "block", mb: 1, fontWeight: 700 }}>Permission Hours</Typography>
                            <Typography variant="body2" sx={{ color: COLORS.ink }}>{selectedTimesheet.permission_hours}h (subtracted from working hours)</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>

                  {/* Remarks Section */}
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 700, color: COLORS.primary, display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CommentIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Approval status
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: "wrap" }}>
                      <Box sx={{ p: 2.5, flex: 1, minWidth: 200, bgcolor: alpha(getStatusColor(selectedTimesheet.remark), 0.08), borderRadius: 2, border: `1px solid ${alpha(getStatusColor(selectedTimesheet.remark), 0.2)}` }}>
                        <Typography variant="caption" sx={{ color: COLORS.muted, display: "block", mb: 1, fontWeight: 700 }}>Current status</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: getStatusColor(selectedTimesheet.remark) }}>
                          {selectedTimesheet.remark || "Pending review"}
                        </Typography>
                      </Box>
                      <GradientButton
                        startIcon={<CommentIcon />}
                        onClick={() => {
                          closeDetailDialog();
                          openRemarkDialog(selectedTimesheet);
                        }}
                      >
                        {selectedTimesheet.remark ? "Edit" : "Add"}
                      </GradientButton>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 2, bgcolor: COLORS.bg }}>
                <Button
                  onClick={closeDetailDialog}
                  variant="outlined"
                  sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: "10px", textTransform: 'none', fontWeight: 600, "&:hover": { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) } }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* REMARK DIALOG */}
        <Dialog
          open={remarkDialogOpen}
          onClose={closeRemarkDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: "20px", overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)' } }}
        >
          <Box sx={{ background: `linear-gradient(135deg, ${COLORS.success} 0%, #0E9F73 100%)`, color: 'white', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CommentIcon sx={{ mr: 1 }} />
              <DialogTitle sx={{ p: 0, fontWeight: 700 }}>
                <Display>{selectedTimesheet?.remark ? "Update approval status" : "Add approval status"}</Display>
              </DialogTitle>
            </Box>
            <IconButton onClick={closeRemarkDialog} sx={{ color: 'white' }} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent dividers sx={{ p: 3, bgcolor: COLORS.bg }}>
            {selectedTimesheet && (
              <Box>
                {/* Employee Info */}
                <Box sx={{ p: 2, mb: 3, bgcolor: COLORS.surface, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(COLORS.success, 0.12), color: COLORS.success, width: 44, height: 44 }}>
                      {selectedTimesheet.employee_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{selectedTimesheet.employee_name}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.muted }}>{formatDate(selectedTimesheet.date)} ({selectedTimesheet.day})</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Text Field */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Approval status / remark"
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter approval status (e.g., Approved, Rejected, Pending Review, etc.)"
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: COLORS.surface } }}
                  helperText="Select a suggestion or write your own remark"
                />

                {/* Suggestions */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['Approved', 'Rejected', 'Pending Review', 'Absent', 'Late', 'Half Day'].map((suggestion) => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      size="small"
                      onClick={() => setRemarkText(suggestion)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: remarkText === suggestion ? alpha(COLORS.success, 0.2) : alpha(COLORS.success, 0.1),
                        color: COLORS.success,
                        fontWeight: 600,
                        "&:hover": { bgcolor: alpha(COLORS.success, 0.2) }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: COLORS.bg }}>
            <Button
              onClick={closeRemarkDialog}
              variant="outlined"
              disabled={updatingRemark}
              sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: "10px", textTransform: 'none', fontWeight: 600, "&:hover": { borderColor: COLORS.success, color: COLORS.success, bgcolor: alpha(COLORS.success, 0.05) } }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRemark}
              disabled={updatingRemark || !remarkText.trim()}
              variant="contained"
              startIcon={updatingRemark ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
              sx={{
                background: `linear-gradient(135deg, ${COLORS.success} 0%, #0E9F73 100%)`,
                color: 'white',
                borderRadius: "10px",
                textTransform: 'none',
                fontWeight: 600,
                "&:hover": { boxShadow: `0 6px 18px ${alpha(COLORS.success, 0.4)}` }
              }}
            >
              {updatingRemark ? "Updating…" : "Update status"}
            </Button>
          </DialogActions>
        </Dialog>
      </Shell>
    </LocalizationProvider>
  );
}