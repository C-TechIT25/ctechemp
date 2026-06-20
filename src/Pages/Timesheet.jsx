import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  Card,
  CardContent,
  Menu,
  Radio,
  Checkbox,
  FormControlLabel,
  Divider,
  Pagination,
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

// ==================== STYLED COMPONENTS ====================

const GradientTypography = styled(Typography)(({ theme }) => ({
  background: "linear-gradient(135deg, #2196F3 0%, #044f8bff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 700,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #2196F3 0%, #064d88ff 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 24px",
  fontWeight: 600,
  "&:hover": {
    background: "linear-gradient(135deg, #2196F3 0%, #064d88ff 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(33, 150, 243, 0.25)",
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(33, 150, 243, 0.1)",
  boxShadow: "0 8px 32px rgba(33, 150, 243, 0.08)",
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
  },
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
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

const RemarkTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  "& .MuiTooltip-tooltip": {
    backgroundColor: "#2196F3",
    color: "white",
    fontSize: "0.875rem",
    borderRadius: "8px",
    padding: "10px 12px",
    fontWeight: 500,
    maxWidth: "300px",
    boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
  },
}));

// ==================== UTILITY FUNCTIONS (Memoized) ====================

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

const getHoursColor = (hours) => {
  const h = parseFloat(hours) || 0;
  if (h >= 8) return "#2e7d32";
  if (h >= 6) return "#ed6c02";
  return "#d32f2f";
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

  // Memoized filtered timesheets
  const filteredTimesheets = useMemo(() => {
    let result = timesheets;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        row.employee_name?.toLowerCase().includes(searchLower) ||
        row.department?.toLowerCase().includes(searchLower) ||
        row.designation?.toLowerCase().includes(searchLower) ||
        row.activity_category?.toLowerCase().includes(searchLower) ||
        row.work_mode?.toLowerCase().includes(searchLower) ||
        row.description?.toLowerCase().includes(searchLower) ||
        row.remark?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
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
  }, [timesheets, searchTerm, selectedStatus]);

  // Memoized statistics
  const stats = useMemo(() => {
    const totalHours = timesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0);
    const uniqueEmployees = [...new Set(timesheets.map(row => row.employee_name))].length;
    const pendingApprovals = timesheets.filter(row => !row.remark || row.remark === "").length;
    const approvedTimesheets = timesheets.filter(row => row.remark?.toLowerCase().includes("approved")).length;
    return { totalHours, uniqueEmployees, pendingApprovals, approvedTimesheets };
  }, [timesheets]);

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredTimesheets.slice(start, end);
  }, [filteredTimesheets, page, rowsPerPage]);

  // Memoized total pages
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
      setTimesheets(data);
      setSelectedRows(new Set());
      setSelectAll(false);
      setPage(1);
      toast.success(`Loaded ${data.length} timesheets successfully!`);
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
    
    // Get the selected timesheets
    const selectedData = timesheets.filter(ts => selectedRows.has(ts.id));
    
    if (selectedData.length === 0) {
      toast.warning("No data found for selected records.");
      return;
    }

    // ===== UTILITY FUNCTIONS =====
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return format(new Date(dateString), 'dd MMM yyyy');
      } catch {
        return dateString;
      }
    };

    const formatTime = (timeString) => {
      if (!timeString) return 'N/A';
      return timeString.substring(0, 5); // HH:MM format
    };

    const calculateWorkDuration = (checkIn, checkOut) => {
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
    
    // ===== COLORS (All RGB Arrays) =====
    const COLORS = {
      primary: [37, 99, 235],        // Bright blue
      text: [45, 45, 45],            // Dark gray
      lightText: [107, 114, 128],    // Medium gray
      border: [229, 231, 235],       // Light gray
      white: [255, 255, 255],
      success: [34, 197, 94],        // Green
      warning: [249, 115, 22],       // Orange
      error: [239, 68, 68],          // Red
      purple: [123, 31, 162],        // Purple
      rowAlt: [249, 250, 251],       // Very light gray
    };
    
    const MARGIN = { top: 12, right: 12, bottom: 20, left: 12 };
    const SECTION_SPACING = 6;
    const LINE_HEIGHT = 4.5;
    
    let currentY = MARGIN.top;
    
    // ===== HEADER =====
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('C-Tech Engineering', MARGIN.left, currentY);
    
    currentY += 6;
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text('Employee Timesheet - Detailed Report', MARGIN.left, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.lightText);
    const reportDate = format(new Date(), 'dd MMM yyyy, HH:mm');
    doc.text(`Generated: ${reportDate}`, pageWidth - MARGIN.right, currentY - 6, { align: 'right' });
    doc.text(`Total Records: ${selectedData.length}`, pageWidth - MARGIN.right, currentY, { align: 'right' });
    
    currentY += 8;
    
    // Decorative line
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN.left, currentY, pageWidth - MARGIN.right, currentY);
    currentY += 6;
    
    // ===== SUMMARY STATISTICS =====
    const totalHours = selectedData.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0);
    const uniqueEmployees = [...new Set(selectedData.map(row => row.employee_name))].length;
    const pendingCount = selectedData.filter(row => !row.remark || row.remark === "").length;
    const approvedCount = selectedData.filter(row => row.remark && row.remark.toLowerCase().includes("approved")).length;
    
    const stats = [
      { label: 'Employees', value: uniqueEmployees.toString(), color: COLORS.primary },
      { label: 'Total Hours', value: totalHours.toFixed(1) + 'h', color: COLORS.primary },
      { label: 'Pending', value: pendingCount.toString(), color: COLORS.warning },
      { label: 'Approved', value: approvedCount.toString(), color: COLORS.success },
    ];
    
    const statBoxWidth = (pageWidth - MARGIN.left - MARGIN.right - 8) / 4;
    const statBoxHeight = 14;
    const statBoxY = currentY;
    
    stats.forEach((stat, index) => {
      const boxX = MARGIN.left + (index * (statBoxWidth + 2));
      
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.rect(boxX, statBoxY, statBoxWidth, statBoxHeight, 'FD');
      
      doc.setDrawColor(...stat.color);
      doc.setLineWidth(0.8);
      doc.line(boxX, statBoxY, boxX, statBoxY + statBoxHeight);
      
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.lightText);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, boxX + 2, statBoxY + 3.5);
      
      doc.setFontSize(10);
      doc.setTextColor(...stat.color);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, boxX + 2, statBoxY + 9.5);
    });
    
    currentY = statBoxY + statBoxHeight + 10;
    
    // ===== PROCESS EACH TIMESHEET =====
    selectedData.forEach((timesheet, index) => {
      // Check if we need a new page (more aggressive)
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = MARGIN.top;
      }
      
      // Section header
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(`Record ${index + 1} of ${selectedData.length}`, MARGIN.left, currentY);
      currentY += 3;
      
      doc.setDrawColor(...COLORS.primary);
      doc.setLineWidth(0.3);
      doc.line(MARGIN.left, currentY, pageWidth - MARGIN.right, currentY);
      currentY += 5;
      
      // ===== EMPLOYEE INFORMATION =====
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
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
        ['Date:', formatDate(timesheet.date)],
        ['Day:', timesheet.day || 'N/A'],
      ];
      
      empFields.forEach(([label, value], idx) => {
        const col1X = MARGIN.left;
        const col2X = MARGIN.left + 95;
        const x = idx % 2 === 0 ? col1X : col2X;
        const y = currentY + (Math.floor(idx / 2) * LINE_HEIGHT);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.lightText);
        doc.text(label, x, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(value, x + 22, y);
      });
      
      currentY += 13;
      
      // ===== WORK INFORMATION =====
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Information', MARGIN.left, currentY);
      currentY += 4;
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      
      const workFields = [
        ['Activity:', timesheet.activity_category || 'N/A'],
        ['Work Mode:', timesheet.work_mode || 'N/A'],
        ['Total Hours:', `${timesheet.total_hours || '0.0'}h`],
        ['Permission Hours:', `${timesheet.permission_hours || '0.0'}h`],
      ];
      
      workFields.forEach(([label, value], idx) => {
        const col1X = MARGIN.left;
        const col2X = MARGIN.left + 95;
        const x = idx % 2 === 0 ? col1X : col2X;
        const y = currentY + (Math.floor(idx / 2) * LINE_HEIGHT);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.lightText);
        doc.text(label, x, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(value, x + 28, y);
      });
      
      currentY += 13;
      
      // ===== DESCRIPTION (if exists) =====
      if (timesheet.description && timesheet.description.trim()) {
        // Check page break
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = MARGIN.top;
        }
        
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'bold');
        doc.text('Description:', MARGIN.left, currentY);
        currentY += 3;
        
        const descLines = doc.splitTextToSize(
          timesheet.description, 
          pageWidth - MARGIN.left - MARGIN.right - 4
        );
        const descHeight = descLines.length * 3.2 + 3;
        
        doc.setDrawColor(...COLORS.border);
        doc.setFillColor(...COLORS.rowAlt);
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
        doc.setTextColor(...COLORS.text);
        doc.text(descLines, MARGIN.left + 2, currentY + 2);
        
        currentY += descHeight + 5;
      }
      
      // ===== TIME TRACKING =====
      // Check page break before time tracking
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = MARGIN.top;
      }
      
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('Time Tracking', MARGIN.left, currentY);
      currentY += 4;
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      
      const timeFields = [
        { label: 'Check In:', value: formatTime(timesheet.check_in), color: COLORS.success },
        { label: 'Check Out:', value: formatTime(timesheet.check_out), color: COLORS.error },
        { label: 'Lunch In:', value: formatTime(timesheet.lunch_in), color: COLORS.warning },
        { label: 'Lunch Out:', value: formatTime(timesheet.lunch_out), color: COLORS.purple },
      ];
      
      timeFields.forEach(({ label, value, color }, idx) => {
        const col1X = MARGIN.left;
        const col2X = MARGIN.left + 95;
        const x = idx % 2 === 0 ? col1X : col2X;
        const y = currentY + (Math.floor(idx / 2) * LINE_HEIGHT);
        
        doc.setDrawColor(...COLORS.border);
        doc.setFillColor(...COLORS.white);
        doc.setLineWidth(0.2);
        doc.rect(x, y - 2.5, 50, 5.5, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.lightText);
        doc.text(label, x + 1.5, y + 0.5);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        doc.text(value, x + 26, y + 0.5);
      });
      
      currentY += 13;
      
      // ===== WORK DURATION & STATUS =====
      const workDuration = calculateWorkDuration(timesheet.check_in, timesheet.check_out);
      
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Duration:', MARGIN.left, currentY);
      
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(workDuration, MARGIN.left + 32, currentY);
      
      currentY += 5;
      
      // Approval Status
      const remark = timesheet.remark || 'Pending Review';
      const statusColor = remark.toLowerCase().includes('approved') ? COLORS.success :
                         remark.toLowerCase().includes('rejected') ? COLORS.error :
                         COLORS.warning;
      
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', MARGIN.left, currentY);
      
      doc.setFontSize(8);
      doc.setTextColor(...statusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(remark, MARGIN.left + 15, currentY);
      
      currentY += 8;
      
      // Separator between records
      if (index < selectedData.length - 1) {
        doc.setDrawColor(...COLORS.border);
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
      doc.setTextColor(...COLORS.lightText);
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
    
    // ===== SAVE =====
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
        'Total Hours': row.total_hours || 0,
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
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 20 }, { wch: 15 },
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
      
      const totalHours = filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0);
      const uniqueEmployees = [...new Set(filteredTimesheets.map(row => row.employee_name))].length;
      const pendingApprovals = filteredTimesheets.filter(row => !row.remark || row.remark === "").length;
      const approvedTimesheets = filteredTimesheets.filter(row => row.remark?.toLowerCase().includes("approved")).length;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const MARGIN = { top: 12, right: 12, bottom: 15, left: 12 };
      const CONTENT_WIDTH = pageWidth - MARGIN.left - MARGIN.right;
      
      const COLORS = {
        primary: [37, 99, 235],
        text: [45, 45, 45],
        lightText: [107, 114, 128],
        border: [229, 231, 235],
        rowAlt: [249, 250, 251],
        white: [255, 255, 255],
        pending: [249, 115, 22],
        approved: [34, 197, 94],
      };
      
      let currentY = MARGIN.top;
      
      // Main title
      doc.setFontSize(20);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('C-Tech Employee Time Sheet Report', MARGIN.left, currentY);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.lightText);
      doc.setFont('helvetica', 'normal');
      doc.text('Comprehensive payroll and attendance analysis', MARGIN.left, currentY + 6);
      
      // Header metadata (right aligned)
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.lightText);
      const reportDate = format(new Date(), 'dd MMM yyyy, HH:mm');
      doc.text(`Generated: ${reportDate}`, pageWidth - MARGIN.right, currentY, { align: 'right' });
      doc.text(`Total Records: ${filteredTimesheets.length}`, pageWidth - MARGIN.right, currentY + 6, { align: 'right' });
      
      currentY += 15;
      
      // Summary Statistics
      const stats = [
        { label: 'Employees', value: uniqueEmployees.toString(), borderColor: COLORS.primary },
        { label: 'Total Hours', value: totalHours.toFixed(1) + 'h', borderColor: COLORS.primary },
        { label: 'Pending Approval', value: pendingApprovals.toString(), borderColor: COLORS.pending },
        { label: 'Approved', value: approvedTimesheets.toString(), borderColor: COLORS.approved },
      ];
      
      const statBoxWidth = CONTENT_WIDTH / 4 - 1.5;
      const statBoxHeight = 18;
      const statBoxY = currentY;
      
      stats.forEach((stat, index) => {
        const boxX = MARGIN.left + (index * (statBoxWidth + 2));
        
        doc.setFillColor(...COLORS.white);
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.rect(boxX, statBoxY, statBoxWidth, statBoxHeight, 'FD');
        
        doc.setDrawColor(...stat.borderColor);
        doc.setLineWidth(0.8);
        doc.line(boxX, statBoxY, boxX, statBoxY + statBoxHeight);
        
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.lightText);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, boxX + 3, statBoxY + 4);
        
        doc.setFontSize(13);
        doc.setTextColor(...stat.borderColor);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, boxX + 3, statBoxY + 12);
      });
      
      currentY = statBoxY + statBoxHeight + 8;
      
      // Table
      const tableData = filteredTimesheets.map(row => [
        formatDate(row.date),
        row.employee_name || 'N/A',
        row.department || 'N/A',
        row.designation || 'N/A',
        row.work_mode || 'N/A',
        row.total_hours || '0.0',
        row.remark || 'Pending',
        formatTime(row.check_in) || 'N/A',
        formatTime(row.check_out) || 'N/A'
      ]);
      
      autoTable(doc, {
        head: [['Date', 'Employee', 'Department', 'Designation', 'Work Mode', 'Hours', 'Remark', 'Check In', 'Check Out']],
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
          6: { halign: 'left' },
          7: { halign: 'center' },
          8: { halign: 'center' }
        },
        
        headStyles: {
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 2.5,
          halign: 'center',
          valign: 'middle',
          lineColor: COLORS.primary,
          lineWidth: 0.1
        },
        
        bodyStyles: {
          fontSize: 8,
          textColor: COLORS.text,
          cellPadding: 2,
          lineColor: COLORS.border,
          lineWidth: 0.1,
          valign: 'middle'
        },
        
        alternateRowStyles: {
          fillColor: COLORS.rowAlt,
          textColor: COLORS.text,
          cellPadding: 2,
          lineColor: COLORS.border,
          lineWidth: 0.1,
          valign: 'middle'
        },
        
        didParseCell: function (data) {
          if (data.column.index === 6) {
            const cellText = data.cell.text[0];
            if (cellText === 'Pending') {
              data.cell.textColor = COLORS.pending;
              data.cell.fontStyle = 'normal';
            } else if (cellText.toLowerCase().includes('approved')) {
              data.cell.textColor = COLORS.approved;
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
          doc.setTextColor(...COLORS.lightText);
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
      
      <Box sx={{ flexGrow: 1, px: { xs: 2, md: 4 }, py: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
        {/* Header Section */}
        <StyledPaper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          {/* Title Bar */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <GradientTypography variant="h4" sx={{ mb: 1 }}>
                Timesheet Management
              </GradientTypography>
              <Typography variant="body2" color="text.secondary">
                Monitor and approve employee work logs
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
                        bgcolor: "#2E7D32",
                        "&:hover": { bgcolor: "#1B5E20" },
                        borderRadius: "10px",
                        px: 2,
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
                        bgcolor: "#F44336",
                        "&:hover": { bgcolor: "#D32F2F" },
                        borderRadius: "10px",
                        px: 2,
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
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportMenuOpen}
                sx={{
                  bgcolor: "#2196F3",
                  "&:hover": { bgcolor: "#065697ff" },
                  borderRadius: "10px",
                  px: 2,
                  fontWeight: 600,
                }}
              >
                Export
              </Button>
              
              <Menu
                anchorEl={exportAnchorEl}
                open={exportMenuOpen}
                onClose={handleExportMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: "12px",
                    mt: 1,
                    minWidth: 200,
                    boxShadow: "0 8px 32px rgba(33, 150, 243, 0.15)",
                  }
                }}
              >
                <MenuItem onClick={exportToExcel} sx={{ py: 1.5 }}>
                  <ExcelIcon sx={{ mr: 2, color: "#2E7D32" }} />
                  <Typography>Excel</Typography>
                </MenuItem>
                <MenuItem onClick={exportToPDF} sx={{ py: 1.5 }}>
                  <PdfIcon sx={{ mr: 2, color: "#F44336" }} />
                  <Typography>PDF Report</Typography>
                </MenuItem>
                <MenuItem onClick={exportSelectedDetailPDF} sx={{ py: 1.5 }}>
                  <DescriptionIcon sx={{ mr: 2, color: "#7B1FA2" }} />
                  <Typography>Detail PDF (Selected)</Typography>
                </MenuItem>
              </Menu>

              <Menu
                anchorEl={actionMenuAnchorEl}
                open={actionMenuOpen}
                onClose={handleActionMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: "12px",
                    mt: 1,
                    minWidth: 200,
                    boxShadow: "0 8px 32px rgba(33, 150, 243, 0.15)",
                  }
                }}
              >
                <MenuItem onClick={handleOpenDetailsFromMenu} sx={{ py: 1.5 }}>
                  <InfoIcon sx={{ mr: 2, color: "#2196F3" }} />
                  <Typography>View Details</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleOpenRemarkFromMenu} sx={{ py: 1.5 }}>
                  <CommentIcon sx={{ mr: 2, color: "#2E7D32" }} />
                  <Typography>Add/Edit Remark</Typography>
                </MenuItem>
              </Menu>
              
              <Tooltip title="Toggle filters">
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? "success" : "default"}
                  sx={{ 
                    bgcolor: showFilters ? "rgba(33, 150, 243, 0.1)" : "transparent",
                    border: "1px solid rgba(33, 150, 243, 0.2)",
                    "&:hover": {
                      bgcolor: "rgba(33, 150, 243, 0.15)"
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
                    bgcolor: "rgba(33, 150, 243, 0.1)",
                    border: "1px solid rgba(33, 150, 243, 0.2)",
                    "&:hover": {
                      bgcolor: "rgba(33, 150, 243, 0.2)"
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {selectedRows.size > 0 && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                borderRadius: "12px",
                border: "1px solid rgba(33, 150, 243, 0.2)",
                bgcolor: "rgba(33, 150, 243, 0.05)"
              }}
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
                {selectedRows.size > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<PdfIcon />}
                    onClick={exportSelectedDetailPDF}
                    sx={{ ml: 2, color: "#F44336", fontWeight: 600 }}
                  >
                    Export Detail PDF
                  </Button>
                )}
              </Typography>
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard color="#0b5491ff">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Total Employees
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {stats.uniqueEmployees}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <Groups />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard color="#2196F3">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Total Entries
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {timesheets.length}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <CalendarMonth />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard color="#4CAF50">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Total Hours
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {stats.totalHours.toFixed(1)}h
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard color={stats.pendingApprovals > 0 ? "#FF9800" : "#2E7D32"}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Pending Approval
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {stats.pendingApprovals}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <Warning />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
          </Grid>

          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by employee, department, activity..."
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
                bgcolor: "rgba(33, 150, 243, 0.05)",
                border: "1px solid rgba(33, 150, 243, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  border: "1px solid rgba(33, 150, 243, 0.2)",
                  bgcolor: "rgba(33, 150, 243, 0.08)",
                },
              }
            }}
          />

          {/* Filter Section */}
          <Collapse in={showFilters}>
            <StyledPaper sx={{ p: 3, mt: 3, bgcolor: "rgba(33, 150, 243, 0.02)" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2196F3" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <FilterIcon sx={{ mr: 1 }} />
                Filter Timesheets
              </Typography>
              
              <Grid container spacing={2} alignItems="flex-end" sx={{ mt: 1 }}>
                <Grid item xs={12} md={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Department</InputLabel>
                    <Select
                      value={selectedDepartment}
                      label="Department"
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(33, 150, 243, 0.05)",
                        border: "1px solid rgba(33, 150, 243, 0.1)",
                        "&:hover": {
                          border: "1px solid rgba(33, 150, 243, 0.2)",
                        }
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
                
                <Grid item xs={12} md={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      label="Status"
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(33, 150, 243, 0.05)",
                        border: "1px solid rgba(33, 150, 243, 0.1)",
                        "&:hover": {
                          border: "1px solid rgba(33, 150, 243, 0.2)",
                        }
                      }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2.4}>
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
                            bgcolor: "rgba(33, 150, 243, 0.05)",
                            border: "1px solid rgba(33, 150, 243, 0.1)",
                            "&:hover": {
                              border: "1px solid rgba(33, 150, 243, 0.2)",
                            }
                          }
                        }
                      } 
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2.4}>
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
                            bgcolor: "rgba(33, 150, 243, 0.05)",
                            border: "1px solid rgba(33, 150, 243, 0.1)",
                            "&:hover": {
                              border: "1px solid rgba(33, 150, 243, 0.2)",
                            }
                          }
                        }
                      } 
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2.4}>
                  <Stack direction={{ xs: "row", md: "row" }} spacing={1}>
                    <GradientButton
                      onClick={handleApplyFilters}
                      size="small"
                      startIcon={<FilterIcon />}
                      fullWidth
                      sx={{ px: 2 }}
                    >
                      Apply
                    </GradientButton>
                    
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                      size="small"
                      fullWidth
                      sx={{ 
                        borderColor: "rgba(33, 150, 243, 0.3)",
                        color: "#2196F3",
                        borderRadius: "8px",
                        "&:hover": {
                          borderColor: "#2196F3",
                          bgcolor: "rgba(33, 150, 243, 0.05)"
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
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
            {/* Selection Toolbar */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: "rgba(33, 150, 243, 0.08)", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(33, 150, 243, 0.1)",
                flexWrap: "wrap",
                gap: 1
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={
                          selectedRows.size > 0 && 
                          selectedRows.size < paginatedData.length
                        }
                        color="success"
                      />
                    }
                    label={
                      <Typography variant="body2" color="#2196F3" fontWeight="medium">
                        {selectAll ? "Deselect All" : "Select All"}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" color="#2196F3" sx={{ display: { xs: "none", sm: "block" } }}>
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
                      sx={{
                        bgcolor: "#2E7D32",
                        "&:hover": { bgcolor: "#1B5E20" },
                        borderRadius: "8px",
                        px: 2,
                        fontWeight: 600,
                      }}
                    >
                      {bulkUpdateLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        `Approve (${selectedRows.size})`
                      )}
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<PdfIcon />}
                      onClick={exportSelectedDetailPDF}
                      size="small"
                      sx={{
                        bgcolor: "#F44336",
                        "&:hover": { bgcolor: "#D32F2F" },
                        borderRadius: "8px",
                        px: 2,
                        fontWeight: 600,
                      }}
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
                  <TableRow sx={{ bgcolor: "#2196F3" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold", width: 60 }}>
                      Select
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", width: 50 }}></TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 120 }}>Date/Day</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 150 }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 120 }}>Department</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 120 }}>Activity</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 100 }}>Work Mode</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 80, textAlign: "center" }}>Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 80 }}>Remark</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold", width: 60 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow 
                          hover
                          sx={{ 
                            '&:nth-of-type(even)': { bgcolor: 'rgba(33, 150, 243, 0.02)' },
                            '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.05)' },
                            borderBottom: expandedRows.includes(row.id) ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                            bgcolor: selectedRows.has(row.id) ? 'rgba(33, 150, 243, 0.1)' : 'inherit'
                          }}
                        >
                          <TableCell sx={{ width: 60 }}>
                            <Radio
                              checked={selectedRows.has(row.id)}
                              onChange={() => handleRowSelect(row.id)}
                              value={row.id}
                              name="timesheet-radio"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          
                          <TableCell sx={{ width: 50 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(row.id)}
                              sx={{ 
                                color: "#2196F3",
                                "&:hover": {
                                  bgcolor: "rgba(33, 150, 243, 0.1)"
                                }
                              }}
                            >
                              {expandedRows.includes(row.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="600" color="#2196F3">
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
                                  width: 36, 
                                  height: 36,
                                  bgcolor: "rgba(33, 150, 243, 0.1)",
                                  color: "#2196F3",
                                  fontSize: "0.875rem",
                                  fontWeight: "bold"
                                }}
                              >
                                {row.employee_name?.charAt(0) || "U"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="600" sx={{ display: { xs: "none", md: "block" } }}>
                                  {row.employee_name || "N/A"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {row.emp_id || "N/A"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Chip 
                              label={row.department || "N/A"} 
                              size="small" 
                              sx={{ 
                                bgcolor: "rgba(33, 150, 243, 0.1)", 
                                color: "#2196F3",
                                fontWeight: "600",
                                borderRadius: "6px"
                              }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title={row.description || "No description"} arrow>
                              <Typography variant="body2" fontWeight="600">
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
                          
                          <TableCell sx={{ textAlign: "center" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                            <RemarkTooltip 
                              title={row.remark || "Pending"} 
                              arrow
                              placement="top"
                            >
                              <StatusChip
                                label={getRemarkFirstWord(row.remark)}
                                size="small"
                                status={row.remark}
                                sx={{ cursor: "pointer" }}
                              />
                            </RemarkTooltip>
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title="More options">
                              <IconButton
                                size="small"
                                onClick={(event) => handleActionMenuOpen(event, row)}
                                sx={{
                                  color: "#2196F3",
                                  "&:hover": {
                                    bgcolor: "rgba(33, 150, 243, 0.1)"
                                  }
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Row */}
                        {expandedRows.includes(row.id) && (
                          <TableRow>
                            <TableCell colSpan={10} sx={{ p: 0 }}>
                              <Box sx={{ p: 3, bgcolor: 'rgba(33, 150, 243, 0.02)' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', mb: 2 }}>
                                      <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: "1.2rem" }} />
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
                                            borderRadius: 1,
                                            border: `1px solid ${item.color}20`
                                          }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                              {React.cloneElement(item.icon, { sx: { mr: 1, color: item.color, fontSize: "1.2rem" } })}
                                              <Typography variant="caption" fontWeight="bold">{item.label}</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="bold" color={item.color}>
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
                                      borderRadius: 1,
                                      border: "1px solid rgba(33, 150, 243, 0.2)"
                                    }}>
                                      <Typography variant="caption" fontWeight="bold" color="#2196F3" gutterBottom sx={{ display: "block" }}>
                                        Work Duration
                                      </Typography>
                                      <Typography variant="h6" fontWeight="bold" color="#2196F3">
                                        {calculateWorkDuration(row.check_in, row.check_out)}
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', mb: 2 }}>
                                      <InfoIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: "1.2rem" }} />
                                      Details
                                    </Typography>
                                    
                                    {row.description && (
                                      <Paper elevation={0} sx={{ 
                                        p: 2, 
                                        mb: 2, 
                                        bgcolor: 'rgba(255, 152, 0, 0.1)', 
                                        borderRadius: 1,
                                        border: "1px solid rgba(255, 152, 0, 0.2)"
                                      }}>
                                        <Typography variant="caption" fontWeight="bold" color="#FF9800" gutterBottom sx={{ display: "block" }}>
                                          Description
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                          {row.description}
                                        </Typography>
                                      </Paper>
                                    )}
                                    
                                    <Grid container spacing={2}>
                                      <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ 
                                          p: 2, 
                                          bgcolor: 'rgba(244, 67, 54, 0.1)', 
                                          borderRadius: 1,
                                          border: "1px solid rgba(244, 67, 54, 0.2)"
                                        }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                            Permission Hours
                                          </Typography>
                                          <Typography variant="body2" color="#F44336" fontWeight="bold">
                                            {row.permission_hours || "0.0"}h
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ 
                                          p: 2, 
                                          bgcolor: 'rgba(46, 125, 50, 0.1)', 
                                          borderRadius: 1,
                                          border: "1px solid rgba(46, 125, 50, 0.2)"
                                        }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                            Total Hours
                                          </Typography>
                                          <Typography variant="body2" fontWeight="bold" color="#2E7D32">
                                            {row.total_hours || "0.0"}h
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <SearchIcon sx={{ fontSize: 64, color: "rgba(33, 150, 243, 0.3)", mb: 2 }} />
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
            
            {/* Pagination */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: "rgba(33, 150, 243, 0.08)", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(33, 150, 243, 0.1)",
                flexWrap: "wrap",
                gap: 2
              }}>
                <Typography variant="body2" color="#2196F3" fontWeight="medium">
                  Showing {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, filteredTimesheets.length)} of {filteredTimesheets.length} records
                </Typography>
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      sx={{
                        borderRadius: "8px",
                        bgcolor: "white",
                        '& .MuiSelect-select': { py: 0.5 }
                      }}
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
                    color="primary"
                    size="medium"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </Box>
            )}
            
            {/* Footer */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: "rgba(33, 150, 243, 0.05)", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(33, 150, 243, 0.05)",
                flexWrap: "wrap",
                gap: 2
              }}>
                <Typography variant="body2" fontWeight="bold" color="#2196F3" sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingUp sx={{ mr: 1, fontSize: "1.2rem" }} />
                  Total hours: {filteredTimesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0).toFixed(1)}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredTimesheets.length} records displayed
                </Typography>
              </Box>
            )}
          </StyledPaper>
        )}

        {/* DETAIL DIALOG */}
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
                background: "linear-gradient(135deg, #2196F3 0%, #064d88ff 100%)",
                color: 'white',
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, fontSize: "1.5rem" }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Timesheet Details
                    </Typography>
                    <Typography variant="caption">
                      {selectedTimesheet.employee_name} • {formatDate(selectedTimesheet.date)}
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  onClick={closeDetailDialog} 
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent dividers sx={{ p: 3, bgcolor: "#f8f9fa" }}>
                <Grid container spacing={3}>
                  {/* Employee Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Employee Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Employee Name
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedTimesheet.employee_name}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Employee ID
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedTimesheet.emp_id}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Department
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedTimesheet.department}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Designation
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedTimesheet.designation}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Work Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', display: 'flex', alignItems: 'center' }}>
                      <WorkIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Work Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Activity Category
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedTimesheet.activity_category}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Work Mode
                          </Typography>
                          <WorkModeChip
                            label={selectedTimesheet.work_mode}
                            size="small"
                            mode={selectedTimesheet.work_mode}
                          />
                        </Paper>
                      </Grid>
                      {selectedTimesheet.description && (
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(255, 152, 0, 0.1)', 
                            borderRadius: 1, 
                            border: "1px solid rgba(255, 152, 0, 0.2)"
                          }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: "bold" }}>
                              Description
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {selectedTimesheet.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>

                  {/* Time Tracking Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Time Tracking
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {[
                        { label: "Check In", value: formatTime(selectedTimesheet.check_in), color: "#2E7D32" },
                        { label: "Lunch In", value: formatTime(selectedTimesheet.lunch_in), color: "#FF9800" },
                        { label: "Lunch Out", value: formatTime(selectedTimesheet.lunch_out), color: "#7B1FA2" },
                        { label: "Check Out", value: formatTime(selectedTimesheet.check_out), color: "#F44336" }
                      ].map((item, index) => (
                        <Grid item xs={6} sm={3} key={index}>
                          <Paper elevation={0} sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            bgcolor: `${item.color}10`,
                            borderRadius: 1,
                            border: `1px solid ${item.color}20`
                          }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                              {item.label}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color={item.color}>
                              {item.value}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          borderRadius: 1,
                          border: "1px solid rgba(33, 150, 243, 0.2)"
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: "bold" }}>
                            Work Duration
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="#2196F3">
                            {calculateWorkDuration(selectedTimesheet.check_in, selectedTimesheet.check_out)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Hours Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Hours Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          borderRadius: 1,
                          border: "1px solid rgba(244, 67, 54, 0.2)"
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Permission Hours
                          </Typography>
                          <Typography variant="h5" color="#F44336" fontWeight="bold">
                            {selectedTimesheet.permission_hours || "0.0"}h
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(46, 125, 50, 0.1)',
                          borderRadius: 1,
                          border: "1px solid rgba(46, 125, 50, 0.2)"
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Total Hours
                          </Typography>
                          <Typography variant="h5" color="#2E7D32" fontWeight="bold">
                            {selectedTimesheet.total_hours || "0.0"}h
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Remarks Section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#2196F3', display: 'flex', alignItems: 'center' }}>
                      <CommentIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                      Approval Status
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: "wrap" }}>
                      <Paper elevation={0} sx={{ 
                        p: 2.5, 
                        flex: 1,
                        minWidth: 200,
                        bgcolor: selectedTimesheet.remark ? `${getHoursColor(selectedTimesheet.remark)}10` : 'rgba(117, 117, 117, 0.1)', 
                        borderRadius: 1,
                        border: `1px solid ${selectedTimesheet.remark ? `${getHoursColor(selectedTimesheet.remark)}20` : 'rgba(117, 117, 117, 0.2)'}`
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: "bold" }}>
                          Current Status
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: selectedTimesheet.remark ? getHoursColor(selectedTimesheet.remark) : "#757575" }}>
                          {selectedTimesheet.remark || "Pending Review"}
                        </Typography>
                      </Paper>
                      <Button
                        variant="contained"
                        startIcon={<CommentIcon />}
                        onClick={() => {
                          closeDetailDialog();
                          openRemarkDialog(selectedTimesheet);
                        }}
                        sx={{
                          background: "linear-gradient(135deg, #2196F3 0%, #064d88ff 100%)",
                          color: 'white',
                          fontWeight: 600,
                          borderRadius: "8px",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                          }
                        }}
                      >
                        {selectedTimesheet.remark ? "Edit" : "Add"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 2, bgcolor: "#f8f9fa" }}>
                <Button 
                  onClick={closeDetailDialog} 
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(33, 150, 243, 0.3)",
                    color: "#2196F3",
                    borderRadius: "8px",
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "#2196F3",
                      bgcolor: "rgba(33, 150, 243, 0.05)"
                    }
                  }}
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
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: 'hidden',
            }
          }}
        >
          <DialogTitle sx={{ 
            background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
            color: 'white',
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CommentIcon sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {selectedTimesheet?.remark ? "Update Approval Status" : "Add Approval Status"}
              </Typography>
            </Box>
            <IconButton 
              onClick={closeRemarkDialog} 
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3, bgcolor: "#f8f9fa" }}>
            {selectedTimesheet && (
              <Box>
                {/* Employee Info */}
                <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'white', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: "rgba(46, 125, 50, 0.1)", color: "#2E7D32", width: 44, height: 44 }}>
                      {selectedTimesheet.employee_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {selectedTimesheet.employee_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(selectedTimesheet.date)} ({selectedTimesheet.day})
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
                
                {/* Text Field */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Approval Status / Remark"
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter approval status (e.g., Approved, Rejected, Pending Review, etc.)"
                  sx={{ mb: 2 }}
                  helperText="Select a suggestion or write your own remark"
                  InputProps={{
                    sx: {
                      borderRadius: "8px",
                      bgcolor: "white",
                      border: "1px solid rgba(46, 125, 50, 0.2)",
                      "&:hover": {
                        border: "1px solid rgba(46, 125, 50, 0.3)",
                      }
                    }
                  }}
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
                        bgcolor: remarkText === suggestion ? "rgba(46, 125, 50, 0.2)" : "rgba(46, 125, 50, 0.1)",
                        color: "#2E7D32",
                        fontWeight: 600,
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

          <DialogActions sx={{ p: 2, bgcolor: "#f8f9fa" }}>
            <Button 
              onClick={closeRemarkDialog} 
              variant="outlined" 
              disabled={updatingRemark}
              sx={{
                borderColor: "rgba(46, 125, 50, 0.3)",
                color: "#2E7D32",
                borderRadius: "8px",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#2E7D32",
                  bgcolor: "rgba(46, 125, 50, 0.05)"
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRemark} 
              disabled={updatingRemark || !remarkText.trim()}
              variant="contained"
              startIcon={updatingRemark ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
              sx={{
                background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
                color: 'white',
                borderRadius: "8px",
                fontWeight: 600,
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
                }
              }}
            >
              {updatingRemark ? "Updating..." : "Update Status"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}