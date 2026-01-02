import React, { useEffect, useState, useRef } from "react";
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
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../Config";

// Import for export functionality
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Styled Components
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
    boxShadow: "0 6px 12px rgba(46, 122, 125, 0.25)",
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

  // Selection states
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  // Refs for table capture
  const tableRef = useRef(null);

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
      const url = `${API_BASE_URL}admin/${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTimesheets(data);
      setSelectedRows(new Set()); // Clear selections when data refreshes
      setSelectAll(false);
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
      const response = await fetch(`${API_BASE_URL}admin/departments`);
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

  // Truncate text for table display
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
      const response = await fetch(`${API_BASE_URL}admin/${selectedTimesheet.id}/remark`, {
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

  // Selection handlers
  const handleRowSelect = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = filteredTimesheets.map(row => row.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkApprove = async () => {
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
      
      // Update local state
      setTimesheets(prev =>
        prev.map(ts =>
          selectedRows.has(ts.id) ? { ...ts, remark: "Approved" } : ts
        )
      );
      
      toast.success(`${selectedRows.size} timesheet(s) approved successfully!`);
      setSelectedRows(new Set()); // Clear selections
      setSelectAll(false);
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast.error("Failed to approve some timesheets. Please try again.");
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  // Export functions
  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const exportToExcel = () => {
    handleExportMenuClose();
    
    try {
      // Prepare data for Excel - ALL FIELDS INCLUDED
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

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns based on content
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 8 },  // Day
        { wch: 12 }, // Employee ID
        { wch: 20 }, // Employee Name
        { wch: 15 }, // Department
        { wch: 15 }, // Designation
        { wch: 15 }, // Activity Category
        { wch: 10 }, // Work Mode
        { wch: 40 }, // Description - Wider for full text
        { wch: 15 }, // Permission Hours
        { wch: 12 }, // Total Hours
        { wch: 10 }, // Check In
        { wch: 10 }, // Check Out
        { wch: 10 }, // Lunch In
        { wch: 10 }, // Lunch Out
        { wch: 15 }, // Work Duration
        { wch: 20 }, // Remark - Wider for remark text
        { wch: 15 }, // Created At
      ];
      
      // Adjust width for description column based on actual content
      const maxDescLength = exportData.reduce((max, row) => 
        Math.max(max, row['Description']?.length || 0), 0
      );
      columnWidths[8].wch = Math.min(Math.max(maxDescLength, 20), 50); // Min 20, Max 50
      
      // Adjust width for remark column
      const maxRemarkLength = exportData.reduce((max, row) => 
        Math.max(max, row['Remark']?.length || 0), 0
      );
      columnWidths[16].wch = Math.min(Math.max(maxRemarkLength, 15), 30); // Min 15, Max 30
      
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheets");

      // Generate file name with current date
      const fileName = `timesheets_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Exported ${exportData.length} records to Excel successfully!`);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export to Excel. Please try again.");
    }
  };

  const exportToPDF = async () => {
    handleExportMenuClose();
    
    try {
      toast.info('Generating PDF report...');
      
      // Calculate stats
      const totalHours = timesheets.reduce((sum, row) => sum + (parseFloat(row.total_hours) || 0), 0);
      const uniqueEmployees = [...new Set(timesheets.map(row => row.employee_name))].length;
      const pendingApprovals = timesheets.filter(row => !row.remark || row.remark === "").length;
      const approvedTimesheets = timesheets.filter(row => row.remark?.toLowerCase().includes("approved")).length;
      
      // Create PDF document with A4 size
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Reduced margins for more content space
      const LEFT_MARGIN = 10;
      const RIGHT_MARGIN = 15;
      const TOP_MARGIN = 10;
      const BOTTOM_MARGIN = 15;
      
      // Color constant for consistency
      const PRIMARY_COLOR = [57, 148, 238]; // #1389e9ff in RGB
      
      // ==================== HEADER SECTION ====================
      doc.setFontSize(20);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('C-Tech Employee Time Sheet Report', pageWidth / 2, TOP_MARGIN + 5, { align: 'center' });
      
      // Main Divider
      doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.setLineWidth(0.3);
      doc.line(LEFT_MARGIN, TOP_MARGIN + 12, pageWidth - RIGHT_MARGIN, TOP_MARGIN + 12);
      
      // ==================== REPORT INFO SECTION ====================
      let currentY = TOP_MARGIN + 20;
      
      // Report metadata
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      // Left column
      doc.text('Generated:', LEFT_MARGIN, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${format(new Date(), 'dd/MM/yyyy HH:mm')}`, LEFT_MARGIN + 25, currentY);
      doc.setFont('helvetica', 'normal');
      
      // Right column
      doc.text('Total Records:', pageWidth - RIGHT_MARGIN - 50, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${filteredTimesheets.length}`, pageWidth - RIGHT_MARGIN - 20, currentY);
      doc.setFont('helvetica', 'normal');
      
      currentY += 5;
      
      // Filter info
      doc.text('Filters Applied:', LEFT_MARGIN, currentY);
      doc.setFont('helvetica', 'bold');
      let filterText = selectedDepartment === 'all' ? 'All Departments' : selectedDepartment;
      if (startDate && endDate) {
        filterText += ` | ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
      }
      doc.text(filterText, LEFT_MARGIN + 35, currentY);
      
      currentY += 8;
      
      // ==================== STATISTICS BOX ====================
      doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.setLineWidth(0.2);
      doc.rect(LEFT_MARGIN, currentY, pageWidth - LEFT_MARGIN - 10, 8);
      
      const stats = [
        { label: 'Employees', value: uniqueEmployees, unit: '' },
        { label: 'Total Hours', value: totalHours.toFixed(1), unit: 'h' },
        { label: 'Pending', value: pendingApprovals, unit: '' },
        { label: 'Approved', value: approvedTimesheets, unit: '' },
        { label: 'Approval Rate', value: timesheets.length > 0 ? ((approvedTimesheets / timesheets.length) * 100).toFixed(1) : '0.0', unit: '%' },
      ];
      
      const statWidth = (pageWidth - LEFT_MARGIN - RIGHT_MARGIN) / 5;
      const statY = currentY + 5;
      
      stats.forEach((stat, index) => {
        const x = LEFT_MARGIN + (index * statWidth);
        
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, x + 3, statY - 1);
        
        doc.setFontSize(9);
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${stat.value}${stat.unit}`, x + 3, statY + 2);
        doc.setFont('helvetica', 'normal');
      });
      
      currentY += 12;
      
      // Table divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(LEFT_MARGIN, currentY, pageWidth - 10, currentY);
      
      currentY += 3;
      
      // ==================== TABLE DATA ====================
      // Prepare table data with ALL columns including description and permission hours
      const tableData = filteredTimesheets.map(row => [
        formatDate(row.date),
        row.employee_name || 'N/A',
        row.department || 'N/A',
        row.designation || 'N/A',
        row.activity_category || 'N/A',
        row.work_mode || 'N/A',
        row.permission_hours || '0.0',
        row.total_hours || '0.0',
        row.description ? truncateText(row.description, 60) : 'N/A', // Limited to 60 chars for table
        row.remark || 'Pending',
        formatTime(row.check_in) || 'N/A',
        formatTime(row.check_out) || 'N/A'
      ]);
      
      // Column widths with reduced margins
      const availableWidth = pageWidth - LEFT_MARGIN - RIGHT_MARGIN;
      const columnStyles = {
        0: { cellWidth: availableWidth * 0.08, halign: 'center' },  // Date
        1: { cellWidth: availableWidth * 0.12, halign: 'left' },    // Employee Name
        2: { cellWidth: availableWidth * 0.10, halign: 'left' },    // Department
        3: { cellWidth: availableWidth * 0.10, halign: 'left' },    // Designation
        4: { cellWidth: availableWidth * 0.08, halign: 'left' },    // Activity
        5: { cellWidth: availableWidth * 0.08, halign: 'center' },  // Work Mode
        6: { cellWidth: availableWidth * 0.06, halign: 'center' },  // Permission Hours
        7: { cellWidth: availableWidth * 0.06, halign: 'center' },  // Total Hours
        8: { cellWidth: availableWidth * 0.16, halign: 'left', fontStyle: 'normal', lineHeight: 1.2 },  // Description (wider)
        9: { cellWidth: availableWidth * 0.08, halign: 'center' },  // Remark
        10: { cellWidth: availableWidth * 0.06, halign: 'center' }, // Check In
        11: { cellWidth: availableWidth * 0.06, halign: 'center' }, // Check Out
      };
      
      autoTable(doc, {
        head: [
          ['Date', 'Employee', 'Department', 'Designation', 'Activity', 'Work Mode', 'Perm Hrs', 'Total Hrs', 'Description', 'Remark', 'Check In', 'Check Out']
        ],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 6,
          cellPadding: 1,
          lineColor: [200, 200, 200],
          lineWidth: 0.05,
          valign: 'middle',
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: PRIMARY_COLOR,
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
          lineWidth: 0.1,
        },
        bodyStyles: {
          fontSize: 6,
          textColor: [0, 0, 0],
          cellPadding: { top: 1, bottom: 1, left: 0.5, right: 0.5 },
          lineWidth: 0.05,
          lineHeight: 1.2,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        margin: { 
          left: LEFT_MARGIN,
          right: RIGHT_MARGIN,
          top: currentY,
          bottom: BOTTOM_MARGIN
        },
        tableWidth: 'auto',
        columnStyles: columnStyles,
        // Handle text overflow in description column
        didParseCell: function(data) {
          if (data.column.index === 8 && data.cell.raw) { // Description column
            if (data.cell.raw.length > 60) {
              // Split long text into multiple lines
              const lines = doc.splitTextToSize(data.cell.raw, columnStyles[8].cellWidth - 2);
              data.cell.text = lines;
              data.row.height = Math.max(data.row.height || 0, lines.length * 3);
            }
          }
        },
        // Handle page breaks and page numbers
        didDrawPage: function (data) {
          doc.setFontSize(6);
          doc.setTextColor(150);
          const pageCount = doc.internal.getNumberOfPages();
          
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - BOTTOM_MARGIN + 5,
            { align: 'center' }
          );
          
          if (data.pageNumber > 1) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
              'Timesheet Report - Continued',
              pageWidth / 2,
              TOP_MARGIN,
              { align: 'center' }
            );
            
            doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.setLineWidth(0.2);
            doc.line(LEFT_MARGIN, TOP_MARGIN + 2, pageWidth - RIGHT_MARGIN, TOP_MARGIN + 2);
          }
        },
        // Color coding for remark column
        willDrawCell: function (data) {
          if (data.column.index === 9 && data.cell.raw) { // Remark column
            const remark = data.cell.raw.toLowerCase();
            if (remark.includes('approved')) {
              doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            } else if (remark.includes('rejected')) {
              doc.setTextColor(244, 67, 54);
            } else if (remark.includes('pending')) {
              doc.setTextColor(255, 152, 0);
            }
          }
        },
        didDrawCell: function (data) {
          if (data.column.index === 9) {
            doc.setTextColor(0, 0, 0);
          }
        },
        // Adjust row height for description text
        rowPageBreak: 'auto'
      });
      
   
       
    
      // ==================== SAVE PDF ====================
      const fileName = `Timesheet_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF report generated successfully with ${filteredTimesheets.length} records!`);
      
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF report. Please try again.");
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
              {/* Bulk Approve Button */}
              {selectedRows.size > 0 && (
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
                      minWidth: 200,
                    }}
                  >
                    {bulkUpdateLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      `Approve Selected (${selectedRows.size})`
                    )}
                  </Button>
                </Tooltip>
              )}
              
              {/* Export Menu Button */}
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
                    boxShadow: "0 8px 32px rgba(46, 125, 50, 0.15)",
                  }
                }}
              >
                <MenuItem onClick={exportToExcel} sx={{ py: 1.5 }}>
                  <ExcelIcon sx={{ mr: 2, color: "#2E7D32" }} />
                  <Typography>Export to Excel (All Details)</Typography>
                </MenuItem>
                <MenuItem onClick={exportToPDF} sx={{ py: 1.5 }}>
                  <PdfIcon sx={{ mr: 2, color: "#F44336" }} />
                  <Typography>Export to PDF (A4 Format)</Typography>
                </MenuItem>
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

          {/* Selection Summary */}
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
                <strong>{selectedRows.size} timesheet(s)</strong> selected for approval
              </Typography>
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
              <StatCard color="#0b5491ff">
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
            
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
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
            
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
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
            
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
              <StatCard color={pendingApprovals > 0 ? "#FF9800" : "#2E7D32"}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {pendingApprovals}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <Warning />
                    </Avatar>
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
              <Typography variant="subtitle1" fontWeight="bold" color="#2196F3" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filter Timesheets
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Department</InputLabel>
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
              
              {selectedDepartment !== "all" && (
                <Typography variant="caption" color="#2196F3" sx={{ mt: 1, display: "block" }}>
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
            {/* Selection Toolbar */}
            {filteredTimesheets.length > 0 && (
              <Box sx={{ 
                p: 2, 
                bgcolor: "rgba(46, 125, 50, 0.08)", 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(46, 125, 50, 0.1)"
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={
                          selectedRows.size > 0 && 
                          selectedRows.size < filteredTimesheets.length
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
                  <Typography variant="body2" color="#2196F3">
                    {selectedRows.size} of {filteredTimesheets.length} selected
                  </Typography>
                </Box>
                
                {selectedRows.size > 0 && (
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
                      `Approve Selected (${selectedRows.size})`
                    )}
                  </Button>
                )}
              </Box>
            )}

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: "rgba(46, 125, 50, 0.08)",
                    borderBottom: "2px solid #2196F3"
                  }}>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", width: 60 ,backgroundColor:"#2196F3"}}>
                      Select
                    </TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", width: 60 ,backgroundColor:"#2196F3"}}></TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Date/Day</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Employee</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Department</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Designation</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Activity</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Work Mode</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Hours</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold" ,backgroundColor:"#2196F3"}}>Remark</TableCell>
                    <TableCell sx={{ color: "#ffffffff", fontWeight: "bold",backgroundColor:"#2196F3", width: 180 }}>Actions</TableCell>
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
                            borderBottom: expandedRows.includes(row.id) ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                            bgcolor: selectedRows.has(row.id) ? 'rgba(46, 125, 50, 0.08)' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Radio
                              checked={selectedRows.has(row.id)}
                              onChange={() => handleRowSelect(row.id)}
                              value={row.id}
                              name="timesheet-radio"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          
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
                            {row.description && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {truncateText(row.description, 30)}
                              </Typography>
                            )}
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
                            {row.permission_hours && parseFloat(row.permission_hours) > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Perm: {row.permission_hours}h
                              </Typography>
                            )}
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
                          <TableCell colSpan={11} sx={{ p: 0 }}>
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
                                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
                                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
                      <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
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
                <Typography variant="body2" color="#2196F3" fontWeight="medium">
                  Showing {filteredTimesheets.length} of {timesheets.length} records
                  {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#2196F3">
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
                bgcolor: "linear-gradient(135deg, #2196F3 0%, #2196F3 100%)",
                color: 'white',
                py: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center',color:'#2196F3',fontWeight:'bold' }}>
                  <PersonIcon sx={{ mr: 1,color:'#2196F3' }} />
                  Timesheet Details
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196F3' }}>
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
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196F3' }}>
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
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196F3' }}>
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
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {selectedTimesheet.description || "No description"}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196F3' }}>
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
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196F3' }}>
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
                          <Typography variant="h4" color="#2196F3" fontWeight="bold">
                            {selectedTimesheet.total_hours || "0.0"}h
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2196F3' }}>
                      Remarks
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Paper elevation={0} sx={{ 
                        p: 2, 
                        flex: 1, 
                        bgcolor: selectedTimesheet.remark ? `${getHoursColor(selectedTimesheet.remark)}10` : 'rgba(117, 117, 117, 0.1)', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="body1" fontWeight="medium" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
                    borderColor: "rgba(46, 107, 125, 0.3)",
                    color: "#2196F3",
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: "#2196F3",
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