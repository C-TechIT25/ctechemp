import React, { useState, useRef, useEffect } from "react";
import { db, storage } from "../Config";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

// MUI Core
import {
  Box, Button, Dialog, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Typography, Avatar, Chip, IconButton, InputAdornment,
  CircularProgress, LinearProgress, Paper, Grid,
  Tooltip, Badge, Slide, Snackbar, Alert, useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";

// MUI Icons
import AddIcon            from "@mui/icons-material/Add";
import EditIcon           from "@mui/icons-material/Edit";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import DeleteIcon         from "@mui/icons-material/Delete";
import SearchIcon         from "@mui/icons-material/Search";
import CloseIcon          from "@mui/icons-material/Close";
import DownloadIcon       from "@mui/icons-material/Download";
import PeopleAltIcon      from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import PauseCircleIcon    from "@mui/icons-material/PauseCircle";
import BadgeIcon          from "@mui/icons-material/Badge";
import PhoneIcon          from "@mui/icons-material/Phone";
import EmailIcon          from "@mui/icons-material/Email";
import LocationOnIcon     from "@mui/icons-material/LocationOn";
import AccessTimeIcon     from "@mui/icons-material/AccessTime";
import WorkIcon           from "@mui/icons-material/Work";
import CalendarTodayIcon  from "@mui/icons-material/CalendarToday";
import FavoriteIcon       from "@mui/icons-material/Favorite";
import NoteAltIcon        from "@mui/icons-material/NoteAlt";
import VerifiedUserIcon   from "@mui/icons-material/VerifiedUser";
import CloudUploadIcon    from "@mui/icons-material/CloudUpload";
import WarningAmberIcon   from "@mui/icons-material/WarningAmber";
import PersonIcon         from "@mui/icons-material/Person";
import EngineeringIcon    from "@mui/icons-material/Engineering";
import QrCodeScannerIcon  from "@mui/icons-material/QrCodeScanner";
import ContentCopyIcon    from "@mui/icons-material/ContentCopy";
import OpenInNewIcon      from "@mui/icons-material/OpenInNew";
import LinkIcon           from "@mui/icons-material/Link";
import QrCodeIcon         from "@mui/icons-material/QrCode";
import HomeIcon           from "@mui/icons-material/Home";
import CakeIcon           from "@mui/icons-material/Cake";
import WcIcon             from "@mui/icons-material/Wc";
import BusinessIcon       from "@mui/icons-material/Business";
import CheckIcon          from "@mui/icons-material/Check";

// ── Theme ──────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "light",
    primary:    { main: "#1565C0", light: "#1976d2", dark: "#0D47A1" },
    secondary:  { main: "#7C3AED" },
    success:    { main: "#16a34a", light: "#dcfce7" },
    warning:    { main: "#d97706", light: "#fef3c7" },
    error:      { main: "#dc2626", light: "#fef2f2" },
    background: { default: "#EEF2F7", paper: "#ffffff" },
    text:       { primary: "#0F172A", secondary: "#64748b" },
  },
  typography: {
    fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
    h5: { fontWeight: 700, fontSize: "clamp(1.2rem, 4vw, 1.5rem)" },
    h6: { fontWeight: 700, fontSize: "clamp(1rem, 3.5vw, 1.25rem)" },
    body2: { fontSize: "0.8125rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 10 },
        containedPrimary: {
          background: "linear-gradient(135deg, #1565C0 0%, #1976d2 100%)",
          boxShadow: "0 4px 14px rgba(21,101,192,0.3)",
          "&:hover": { background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)", boxShadow: "0 6px 20px rgba(21,101,192,0.4)" },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1565C0" },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", margin: 16 },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.72rem" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcExperience(joiningDate) {
  if (!joiningDate) return "";
  const start = new Date(joiningDate);
  const now   = new Date();
  if (isNaN(start) || start > now) return "";
  let years  = now.getFullYear() - start.getFullYear();
  let months = now.getMonth()    - start.getMonth();
  const days = now.getDate()     - start.getDate();
  if (days   < 0) months  -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0 && months === 0) return "< 1 month";
  const p = [];
  if (years  > 0) p.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) p.push(`${months} mo`);
  return p.join(" ");
}

function calculateAge(dob) {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const COMPANY_OPTIONS = [
  { value: "C-Tech", label: "C-Tech Engineering", color: "#1565C0", bg: "#EFF6FF", border: "#BFDBFE" },
  { value: "Precon", label: "Precon", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
];

const BLANK = {
  employeeId: "", fullName: "", designation: "", department: "",
  contactNumber: "", email: "", bloodGroup: "",
  emergencyContact: "", emergencyPhone: "",
  joiningDate: "", location: "", workShift: "", status: "Active", notes: "",
  residencyAddress: "", dob: "", gender: "", company: "C-Tech",
};

// ── QR Code helpers ────────────────────────────────────────────────────────────
function getProfileUrl(employeeId) {
  return `${window.location.origin}/#/employee/profile/${employeeId}`;
}

async function generateQRCode(employeeId) {
  const url = getProfileUrl(employeeId);
  const QRCodeModule = await import("qrcode");
  return await QRCodeModule.default.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#0052cc", light: "#ffffff" },
  });
}

async function downloadQRCode(employeeId) {
  const dataUrl = await generateQRCode(employeeId);
  const link = document.createElement("a");
  link.download = `QR_${employeeId}.png`;
  link.href = dataUrl;
  link.click();
}

// ── Slide transition ───────────────────────────────────────────────────────────
const SlideUp = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function EmployeeApp() {
  const [employees, setEmployees] = useState([]);
  const [formDialog,   setFormDialog]   = useState({ open: false, employee: null });
  const [viewDialog,   setViewDialog]   = useState({ open: false, employee: null });
  const [qrDialog, setQrDialog] = useState({ open: false, employee: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
      setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg,#EEF2F7 0%,#E3EAF4 100%)", fontFamily: "'DM Sans',sans-serif" }}>

        <EmployeeTable
          employees={employees}
          onCreate={() => setFormDialog({ open: true, employee: null })}
          onEdit={(emp) => setFormDialog({ open: true, employee: emp })}
          onView={(emp) => setViewDialog({ open: true, employee: emp })}
          onQR={(emp) => setQrDialog({ open: true, employee: emp })}
          onDelete={(emp) => setDeleteDialog({ open: true, employee: emp })}
        />

        <EmployeeFormDialog
          open={formDialog.open}
          employee={formDialog.employee}
          onClose={() => setFormDialog({ open: false, employee: null })}
          onSuccess={(msg) => { setFormDialog({ open: false, employee: null }); showSnack(msg); }}
        />

        <ViewProfileDialog
          open={viewDialog.open}
          employee={viewDialog.employee}
          onClose={() => setViewDialog({ open: false, employee: null })}
          onEdit={(emp) => { setViewDialog({ open: false, employee: null }); setFormDialog({ open: true, employee: emp }); }}
        />

        <QRCodeDialog
          open={qrDialog.open}
          employee={qrDialog.employee}
          onClose={() => setQrDialog({ open: false, employee: null })}
          onSnack={showSnack}
        />

        <DeleteDialog
          open={deleteDialog.open}
          employee={deleteDialog.employee}
          onClose={() => setDeleteDialog({ open: false, employee: null })}
          onSuccess={() => { setDeleteDialog({ open: false, employee: null }); showSnack("Employee deleted successfully."); }}
        />

        <Snackbar open={snack.open} autoHideDuration={3500}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={snack.severity} variant="filled"
            sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.message}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE - Responsive
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeTable({ employees, onCreate, onEdit, onView, onQR, onDelete }) {
  const [search, setSearch] = useState("");
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const filtered = employees.filter((e) =>
    [e.fullName, e.employeeId, e.designation, e.department, e.email]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    { label: "Total Employees", value: employees.length,                                   icon: <PeopleAltIcon />,   color: "#1565C0", border: "#1565C0" },
    { label: "Active",          value: employees.filter(e => e.status === "Active").length, icon: <CheckCircleIcon />, color: "#16a34a", border: "#16a34a" },
    { label: "Inactive",        value: employees.filter(e => e.status !== "Active").length, icon: <PauseCircleIcon />, color: "#d97706", border: "#d97706" },
  ];

  // Responsive table column configuration
  const getVisibleColumns = () => {
    if (isMobile) {
      return ['Photo', 'Employee ID', 'Full Name', 'Status', 'Actions'];
    } else if (isTablet) {
      return ['Photo', 'Employee ID', 'Full Name', 'Designation', 'Company', 'Status', 'Actions'];
    } else {
      return ['Photo', 'Employee ID', 'Full Name', 'Designation', 'Department', 'Company', 'Contact', 'Status', 'Experience', 'Actions'];
    }
  };

  const visibleColumns = getVisibleColumns();

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3.5 }, maxWidth: 1600, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        mb: { xs: 2, sm: 3 }, 
        flexWrap: "wrap", 
        gap: 2,
        flexDirection: { xs: "column", sm: "row" }
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "center", sm: "flex-start" } }}>
          <Box sx={{
            width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, borderRadius: "14px",
            background: "linear-gradient(135deg,#1565C0,#1976d2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(21,101,192,0.35)",
          }}>
            <EngineeringIcon sx={{ color: "#fff", fontSize: { xs: 22, sm: 26 } }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: "#0F172A", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.5px", fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
              Employee Management
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.3, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
              C-Tech Engineering · Admin Portal
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} size={isMobile ? "medium" : "large"} sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.8, sm: 1.3 }, width: { xs: "100%", sm: "auto" } }}>
          Create Employee
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Paper elevation={0} sx={{
              borderRadius: 1, border: "1px solid #E2E8F0", p: { xs: "12px 16px", sm: "18px 22px" },
              borderTop: `4px solid ${s.border}`, background: "#fff",
              transition: "box-shadow .2s, transform .2s",
              "&:hover": { boxShadow: `0 8px 28px ${alpha(s.color, 0.15)}`, transform: "translateY(-2px)" },
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, mt: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>{s.label}</Typography>
                </Box>
                <Box sx={{ width: { xs: 38, sm: 46 }, height: { xs: 38, sm: 46 }, borderRadius: 2.5, background: alpha(s.color, 0.08), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: { xs: 18, sm: 22 } } })}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by name, ID, designation, department, email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#94a3b8", fontSize: { xs: 18, sm: 20 } }} /></InputAdornment>,
          sx: { background: "#fff", borderRadius: "12px" },
        }}
        sx={{ mb: { xs: 1.5, sm: 2.5 } }}
        size="small"
      />

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 500 : isTablet ? 700 : 1000, fontFamily: "'DM Sans',sans-serif" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #F1F5F9" }}>
                {visibleColumns.map((h) => (
                  <th key={h} style={{
                    padding: { xs: "10px 12px", sm: "13px 16px" },
                    textAlign: h === "Actions" ? "center" : "left",
                    fontSize: { xs: 10, sm: 11 }, fontWeight: 700, color: "#94a3b8",
                    letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: "center", padding: "40px 20px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <PeopleAltIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: "#CBD5E1" }} />
                      <Typography sx={{ color: "#94a3b8", fontWeight: 500, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        {employees.length === 0
                          ? 'No employees yet. Click "Create Employee" to add one.'
                          : "No results found."}
                      </Typography>
                    </Box>
                  </td>
                </tr>
              ) : filtered.map((emp) => {
                const co = COMPANY_OPTIONS.find(c => c.value === emp.company) || COMPANY_OPTIONS[0];
                return (
                  <tr key={emp.id}
                    style={{ borderBottom: "1px solid #F8FAFC", transition: "background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FBFF"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    
                    {visibleColumns.includes('Photo') && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" } }}>
                        <Avatar src={emp.photoURL}
                          sx={{ width: { xs: 32, sm: 38 }, height: { xs: 32, sm: 38 }, border: "2px solid #E2E8F0", background: "#DBEAFE", color: "#1565C0", fontWeight: 700, fontSize: { xs: 13, sm: 15 } }}>
                          {!emp.photoURL && (emp.fullName || "?")[0]}
                        </Avatar>
                      </td>
                    )}
                    
                    {visibleColumns.includes('Employee ID') && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" } }}>
                        <Chip label={emp.employeeId} size="small"
                          sx={{ fontFamily: "monospace", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: { xs: 10, sm: 12 }, border: "1px solid #BFDBFE" }} />
                      </td>
                    )}
                    
                    {visibleColumns.includes('Full Name') && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" } }}>
                        <Typography sx={{ fontWeight: 600, fontSize: { xs: 12, sm: 14 }, color: "#0F172A" }}>{emp.fullName}</Typography>
                      </td>
                    )}
                    
                    {visibleColumns.includes('Designation') && !isMobile && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" }, color: "#64748b", fontSize: { xs: 11, sm: 13 } }}>{emp.designation}</td>
                    )}
                    
                    {visibleColumns.includes('Department') && !isMobile && !isTablet && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" }, color: "#64748b", fontSize: { xs: 11, sm: 13 } }}>{emp.department}</td>
                    )}
                    
                    {visibleColumns.includes('Company') && !isMobile && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" } }}>
                        <Chip label={co.label} size="small"
                          sx={{ background: co.bg, color: co.color, border: `1px solid ${co.border}`, fontWeight: 600, fontSize: { xs: 9, sm: 11 } }} />
                      </td>
                    )}
                    
                    {visibleColumns.includes('Contact') && !isMobile && !isTablet && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" }, color: "#64748b", fontSize: { xs: 11, sm: 13 } }}>{emp.contactNumber}</td>
                    )}
                    
                    {visibleColumns.includes('Status') && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" } }}>
                        <Chip
                          label={emp.status || "Active"} size="small"
                          icon={emp.status === "Active"
                            ? <CheckCircleIcon style={{ fontSize: { xs: 11, sm: 13 } }} />
                            : <PauseCircleIcon style={{ fontSize: { xs: 11, sm: 13 } }} />}
                          sx={{
                            background: emp.status === "Active" ? "#DCFCE7" : "#FEF3C7",
                            color: emp.status === "Active" ? "#166534" : "#92400E",
                            fontWeight: 700,
                            fontSize: { xs: 9, sm: 11 },
                            "& .MuiChip-icon": { color: emp.status === "Active" ? "#16a34a" : "#d97706" },
                          }}
                        />
                      </td>
                    )}
                    
                    {visibleColumns.includes('Experience') && !isMobile && !isTablet && (
                      <td style={{ padding: { xs: "10px 12px", sm: "14px 16px" }, color: "#64748b", fontSize: { xs: 11, sm: 13 } }}>
                        {calcExperience(emp.joiningDate) || "—"}
                      </td>
                    )}
                    
                    {visibleColumns.includes('Actions') && (
                      <td style={{ padding: { xs: "10px 8px", sm: "14px 16px" } }}>
                        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75 }, justifyContent: "center", flexWrap: "wrap" }}>
                          <Tooltip title="View Profile" arrow>
                            <IconButton size="small" onClick={() => onView(emp)}
                              sx={{ background: alpha("#2196F3", 0.08), color: "#2196F3", borderRadius: "8px", "&:hover": { background: alpha("#2196F3", 0.16) }, p: { xs: 0.5, sm: 1 } }}>
                              <VisibilityIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit" arrow>
                            <IconButton size="small" onClick={() => onEdit(emp)}
                              sx={{ background: alpha("#f59e0b", 0.08), color: "#d97706", borderRadius: "8px", "&:hover": { background: alpha("#f59e0b", 0.16) }, p: { xs: 0.5, sm: 1 } }}>
                              <EditIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="QR Code" arrow>
                            <IconButton size="small" onClick={() => onQR(emp)}
                              sx={{ background: alpha("#8b5cf6", 0.08), color: "#7C3AED", borderRadius: "8px", "&:hover": { background: alpha("#8b5cf6", 0.16) }, p: { xs: 0.5, sm: 1 } }}>
                              <QrCodeIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete" arrow>
                            <IconButton size="small" onClick={() => onDelete(emp)}
                              sx={{ background: alpha("#ef4444", 0.08), color: "#dc2626", borderRadius: "8px", "&:hover": { background: alpha("#ef4444", 0.16) }, p: { xs: 0.5, sm: 1 } }}>
                              <DeleteIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 1.5 }, borderTop: "1px solid #F1F5F9", background: "#FAFBFC" }}>
          <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
            Showing {filtered.length} of {employees.length} employees · C-Tech Engineering Employee Management System
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

// ── Shared field style helpers ─────────────────────────────────────────────────
const fieldSx = {
  minWidth: { xs: "100%", sm: 300 },
  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
};

const selectSx = {
  minWidth: { xs: "100%", sm: 300 },
  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
  "& .MuiSelect-select": { borderRadius: "10px" },
};

// ══════════════════════════════════════════════════════════════════════════════
// FORM DIALOG - Responsive
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeFormDialog({ open, employee, onClose, onSuccess }) {
  const isEdit = !!employee;
  const [form, setForm]               = useState(BLANK);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [dragOver, setDragOver]       = useState(false);
  const fileRef = useRef();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      setForm(isEdit ? { ...BLANK, ...employee } : BLANK);
      setImageFile(null);
      setImagePreview(isEdit ? employee?.photoURL || null : null);
      setError("");
      setUploadProgress(0);
    }
  }, [open, employee]);

  const experience = calcExperience(form.joiningDate);
  const set = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(""); };

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) { setError("Select a valid image."); return; }
    if (file.size > 5 * 1024 * 1024)     { setError("Image must be under 5 MB."); return; }
    setError(""); setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const req = [
      ["employeeId","Employee ID"],["fullName","Full Name"],["designation","Designation"],
      ["department","Department"],["contactNumber","Contact Number"],["email","Email"],["joiningDate","Joining Date"],
    ];
    for (const [k, l] of req) if (!form[k]?.trim()) return `"${l}" is required.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    const err = validate(); if (err) { setError(err); return; }
    setLoading(true);
    try {
      let photoURL = employee?.photoURL || "";
      if (imageFile) {
        const sRef = ref(storage, `employee-photos/${form.employeeId}_${Date.now()}`);
        const task = uploadBytesResumable(sRef, imageFile);
        photoURL = await new Promise((res, rej) => {
          task.on("state_changed",
            (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
            rej,
            async () => res(await getDownloadURL(task.snapshot.ref))
          );
        });
      }
      const data = { ...form, workExperience: experience, photoURL, updatedAt: serverTimestamp() };
      if (isEdit) {
        await updateDoc(doc(db, "employees", employee.id), data);
        onSuccess("Employee updated successfully!");
      } else {
        await addDoc(collection(db, "employees"), { ...data, createdAt: serverTimestamp() });
        onSuccess("Employee created successfully!");
      }
    } catch (e) { setError("Firebase error: " + e.message); }
    finally { setLoading(false); }
  };

  const SectionLabel = ({ icon, title, subtitle }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5, pb: 1.5, borderBottom: "2px solid #F1F5F9", flexWrap: "wrap" }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {React.cloneElement(icon, { sx: { color: "#1565C0", fontSize: 18 } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 700, color: "#0F172A" }}>{title}</Typography>
        <Typography sx={{ fontSize: { xs: 10, sm: 11 }, color: "#94a3b8", mt: 0.2 }}>{subtitle}</Typography>
      </Box>
    </Box>
  );

  const selectedCompany = COMPANY_OPTIONS.find(c => c.value === form.company) || COMPANY_OPTIONS[0];

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined}
      TransitionComponent={SlideUp} fullWidth maxWidth="lg" scroll="paper">

      {/* Dialog Header */}
      <Box sx={{ background: "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)", px: { xs: 2, sm: 3.5 }, py: { xs: 2, sm: 2.5 }, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isEdit ? <EditIcon sx={{ color: "#fff", fontSize: 20 }} /> : <AddIcon sx={{ color: "#fff", fontSize: 20 }} />}
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 15, sm: 17 }, fontWeight: 700, color: "#fff" }}>
              {isEdit ? "Edit Employee" : "Create Employee"}
            </Typography>
            <Typography sx={{ fontSize: { xs: 10, sm: 11.5 }, color: "rgba(255,255,255,0.65)" }}>
              C-Tech Engineering · Admin Portal
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip label={isEdit ? "Editing Record" : "New Registration"} size="small"
            sx={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.25)" }} />
          <IconButton onClick={onClose} disabled={loading}
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>

          {error && (
            <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: 2, fontWeight: 500 }}>
              {error}
            </Alert>
          )}

          {/* Photo Upload */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PersonIcon />} title="Employee Photo" subtitle="Upload a clear passport-size photo" />
            <Box
              sx={{
                border: `2px dashed ${dragOver ? "#1565C0" : "#BFDBFE"}`,
                borderRadius: 3, p: { xs: 1.5, sm: 2, md: 2.5 }, display: "flex", alignItems: "center", gap: 2.5,
                background: dragOver ? "#EFF6FF" : "#F8FBFF", cursor: "pointer",
                transition: "all .2s", flexWrap: "wrap", justifyContent: "center",
                "&:hover": { borderColor: "#1565C0", background: "#EFF6FF" },
              }}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <Avatar src={imagePreview}
                sx={{ width: { xs: 60, sm: 76 }, height: { xs: 60, sm: 76 }, border: "3px solid #1565C0", background: "#DBEAFE", color: "#1565C0", fontSize: { xs: 22, sm: 28 }, fontWeight: 700 }}>
                {!imagePreview && <CloudUploadIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: "#93c5fd" }} />}
              </Avatar>
              <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
                <Typography sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 600, color: "#334155" }}>
                  {imagePreview ? "Photo selected — click to change" : "Drag & drop or click to upload"}
                </Typography>
                <Typography sx={{ fontSize: { xs: 10, sm: 12 }, color: "#94a3b8", mt: 0.5 }}>JPG, PNG, WEBP · Max 5 MB</Typography>
              </Box>
              <Button variant="contained" size="small" startIcon={<CloudUploadIcon />}
                onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }} sx={{ flexShrink: 0 }}>
                {imagePreview ? "Change" : "Browse"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])} />
            </Box>
            {loading && uploadProgress > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.75 }}>Uploading… {uploadProgress}%</Typography>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 99, height: 6 }} />
              </Box>
            )}
          </Paper>

          {/* Company Select */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<BusinessIcon />} title="Company" subtitle="Select the company this employee belongs to" />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" } }}>
              {COMPANY_OPTIONS.map((co) => {
                const isSelected = form.company === co.value;
                return (
                  <Box
                    key={co.value}
                    onClick={() => setForm(p => ({ ...p, company: co.value }))}
                    sx={{
                      minWidth: { xs: "100%", sm: 300 },
                      flex: "1 1 300px",
                      border: `2px solid ${isSelected ? co.color : "#E2E8F0"}`,
                      borderRadius: 2.5,
                      p: "14px 20px",
                      cursor: "pointer",
                      background: isSelected ? co.bg : "#fff",
                      transition: "all .18s",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      "&:hover": { borderColor: co.color, background: co.bg },
                    }}
                  >
                    <Box sx={{
                      width: 40, height: 40, borderRadius: "10px",
                      background: isSelected ? co.color : "#F1F5F9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background .18s",
                    }}>
                      <EngineeringIcon sx={{ color: isSelected ? "#fff" : "#94a3b8", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: isSelected ? co.color : "#334155" }}>
                        {co.label}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: isSelected ? co.color : "#94a3b8", mt: 0.25, opacity: 0.8 }}>
                        {co.value === "C-Tech" ? "C-Tech Engineering Pvt. Ltd." : "Precon Construction"}
                      </Typography>
                    </Box>
                    {isSelected && (
                      <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: co.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckIcon sx={{ color: "#fff", fontSize: 13 }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Identity & Role */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<BadgeIcon />} title="Identity & Role" subtitle="Employee ID, designation and department" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Employee ID" name="employeeId" required placeholder="EMP-2024-0001" value={form.employeeId} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Full Name" name="fullName" required placeholder="Rajesh Kumar" value={form.fullName} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Designation" name="designation" required placeholder="Senior Structural Engineer" value={form.designation} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Department" name="department" required placeholder="Civil & Structural Division" value={form.department} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" sx={selectSx}>
                  <InputLabel>Employment Status</InputLabel>
                  <Select name="status" value={form.status} label="Employment Status" onChange={set}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Personal Information */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PersonIcon />} title="Personal Information" subtitle="Date of birth, gender and residency address" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.dob}
                  onChange={set}
                  sx={fieldSx}
                  helperText={form.dob ? `Age: ${calculateAge(form.dob)} years` : " "}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" sx={selectSx}>
                  <InputLabel>Gender</InputLabel>
                  <Select name="gender" value={form.gender} label="Gender" onChange={set}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Residency Address"
                  name="residencyAddress"
                  multiline
                  rows={2}
                  placeholder="House No, Street, City, State, Pincode"
                  value={form.residencyAddress}
                  onChange={set}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Joining & Experience */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<CalendarTodayIcon />} title="Joining & Work Experience" subtitle="Experience auto-calculated from joining date" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Date of Joining" name="joiningDate" required type="date" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Work Shift" name="workShift" placeholder="8:00 AM – 5:30 PM" value={form.workShift} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ pt: 0.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Work Experience</Typography>
                  {experience
                    ? <Chip icon={<AccessTimeIcon />} label={experience}
                        sx={{ background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #BFDBFE", fontWeight: 600, height: 36 }} />
                    : <Typography sx={{ fontSize: 13, color: "#CBD5E1", fontStyle: "italic" }}>Auto-filled after joining date</Typography>
                  }
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Contact */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PhoneIcon />} title="Contact Information" subtitle="Mobile, email and site location" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Mobile Number" name="contactNumber" required placeholder="+91 98400 55123" value={form.contactNumber} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Work Email" name="email" required placeholder="name@ctech-engg.in" value={form.email} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Work Location" name="location" placeholder="Chennai, Tamil Nadu" value={form.location} onChange={set} sx={fieldSx} />
              </Grid>
            </Grid>
          </Paper>

          {/* Medical & Emergency */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #FEE2E2", background: "#FFFBFB" }}>
            <SectionLabel icon={<FavoriteIcon />} title="Medical & Emergency" subtitle="Blood group and emergency contact" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Blood Group" name="bloodGroup" placeholder="B+ / O-" value={form.bloodGroup} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Emergency Contact Name" name="emergencyContact" placeholder="Priya Kumar (Spouse)" value={form.emergencyContact} onChange={set} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Emergency Phone" name="emergencyPhone" placeholder="+91 94450 22876" value={form.emergencyPhone} onChange={set} sx={fieldSx} />
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<NoteAltIcon />} title="Additional Notes" subtitle="Certifications, remarks or special instructions" />
            <TextField fullWidth multiline minRows={3} name="notes" label="Notes"
              placeholder="e.g. Holds PMP certification, site safety trained…"
              value={form.notes} onChange={set}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }} />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, borderTop: "1px solid #F1F5F9", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}
          sx={{ borderColor: "#E2E8F0", color: "#475569", "&:hover": { background: "#F1F5F9" }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <VerifiedUserIcon />}
          sx={{ minWidth: { xs: "100%", sm: 180 }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
          {loading ? "Saving…" : isEdit ? "Update Employee" : "Create & Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW PROFILE DIALOG - Responsive
// ══════════════════════════════════════════════════════════════════════════════
function ViewProfileDialog({ open, employee, onClose, onEdit }) {
  const emp = employee;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const InfoRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <Box sx={{
        display: "flex", alignItems: "flex-start", gap: 1.5,
        py: 1.25, borderBottom: "1px solid #F8FAFC", "&:last-child": { borderBottom: "none" },
        flexWrap: { xs: "wrap", sm: "nowrap" }
      }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.25 }}>
          {React.cloneElement(icon, { sx: { color: "#1565C0", fontSize: 16 } })}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", mb: 0.3 }}>{label}</Typography>
          <Typography sx={{ fontSize: { xs: 12, sm: 13.5 }, color: "#0F172A", fontWeight: 500 }}>{value}</Typography>
        </Box>
      </Box>
    );
  };

  if (!emp) return null;
  const isActive = emp.status === "Active";
  const co = COMPANY_OPTIONS.find(c => c.value === emp.company) || COMPANY_OPTIONS[0];

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={SlideUp} fullWidth maxWidth="sm" scroll="paper">

      {/* Hero */}
      <Box sx={{ background: "linear-gradient(145deg,#0052CC 0%,#0A3A7A 55%,#091E42 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%,rgba(255,255,255,0.05) 0%,transparent 60%)" }} />
        <Box sx={{ position: "relative", zIndex: 2, pt: { xs: 3, sm: 4 }, pb: { xs: 4, sm: 5 }, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <IconButton onClick={onClose}
            sx={{ position: "absolute", top: 12, right: 12, color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon />
          </IconButton>
          <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={<Box sx={{ width: 18, height: 18, borderRadius: "50%", background: isActive ? "#22c55e" : "#f59e0b", border: "2px solid #0052CC" }} />}>
            <Avatar src={emp.photoURL}
              sx={{ width: { xs: 70, sm: 86 }, height: { xs: 70, sm: 86 }, border: "3px solid rgba(255,255,255,0.3)", background: "linear-gradient(135deg,#1e40af,#0052cc)", fontSize: { xs: 24, sm: 30 }, fontWeight: 700, color: "#fff" }}>
              {!emp.photoURL && (emp.fullName || "?")[0]}
            </Avatar>
          </Badge>
          <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 800, color: "#fff", mt: 1.5, mb: 0.5 }}>{emp.fullName}</Typography>
          <Typography sx={{ fontSize: { xs: 11, sm: 13 }, color: "rgba(255,255,255,0.65)", mb: 1.5 }}>
            {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
            <Chip label={emp.status || "Active"} size="small"
              icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#4ade80" : "#fbbf24" }} />}
              sx={{ background: "rgba(34,197,94,0.2)", border: "0.5px solid rgba(34,197,94,0.45)", color: "#4ade80", fontWeight: 700, fontSize: 11 }} />
            {emp.employeeId && (
              <Chip label={emp.employeeId} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 11 }} />
            )}
            {emp.company && (
              <Chip label={co.label} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 11 }} />
            )}
            {emp.location && (
              <Chip label={emp.location} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 11 }} />
            )}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>
        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Verified strip */}
          <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2.5, border: "1px solid #86EFAC", background: "#F0FDF4", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <VerifiedUserIcon sx={{ color: "#16a34a", fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#166534" }}>Identity Verified</Typography>
              <Typography sx={{ fontSize: 11.5, color: "#4ade80", mt: 0.2 }}>Authenticated via C-Tech QR Code</Typography>
            </Box>
            <Chip label="Live" size="small" sx={{ background: "#DCFCE7", color: "#166534", fontWeight: 700, fontSize: 11 }} />
          </Paper>

          {/* Quick stats */}
          <Grid container spacing={1.25}>
            {[
              { label: "Experience", value: calcExperience(emp.joiningDate) || "—", color: "#1565C0", border: "#1565C0" },
              { label: "Blood Group", value: emp.bloodGroup || "—",                 color: "#dc2626", border: "#dc2626" },
              { label: "Status",      value: emp.status || "Active",                color: isActive ? "#16a34a" : "#d97706", border: isActive ? "#16a34a" : "#d97706" },
            ].map((s) => (
              <Grid item xs={4} key={s.label}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", borderTop: `3px solid ${s.border}`, textAlign: "center" }}>
                  <Typography sx={{ fontSize: { xs: 14, sm: 17 }, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: { xs: 8, sm: 9.5 }, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", mt: 0.5 }}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Personal Information */}
          {(emp.dob || emp.gender || emp.residencyAddress) && (
            <Paper elevation={0} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>
                Personal Information
              </Typography>
              {emp.dob && (
                <InfoRow icon={<CakeIcon />} label="Date of Birth" value={new Date(emp.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              )}
              {emp.dob && (
                <InfoRow icon={<AccessTimeIcon />} label="Age" value={`${calculateAge(emp.dob)} years`} />
              )}
              {emp.gender && (
                <InfoRow icon={<WcIcon />} label="Gender" value={emp.gender} />
              )}
              {emp.residencyAddress && (
                <InfoRow icon={<HomeIcon />} label="Residency Address" value={emp.residencyAddress} />
              )}
            </Paper>
          )}

          {/* Contact */}
          <Paper elevation={0} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Contact Information</Typography>
            <InfoRow icon={<PhoneIcon />}     label="Mobile"     value={emp.contactNumber} />
            <InfoRow icon={<EmailIcon />}     label="Work Email" value={emp.email} />
            <InfoRow icon={<LocationOnIcon />}label="Location"   value={emp.location} />
            <InfoRow icon={<AccessTimeIcon />}label="Work Shift" value={emp.workShift} />
          </Paper>

          {/* Employment */}
          <Paper elevation={0} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Employment Details</Typography>
            <InfoRow icon={<BusinessIcon />}      label="Company"         value={co.label} />
            <InfoRow icon={<WorkIcon />}          label="Department"      value={emp.department} />
            <InfoRow icon={<BadgeIcon />}          label="Designation"     value={emp.designation} />
            <InfoRow icon={<CalendarTodayIcon />}  label="Date of Joining" value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : ""} />
            <InfoRow icon={<AccessTimeIcon />}     label="Work Experience" value={calcExperience(emp.joiningDate)} />
          </Paper>

          {(emp.bloodGroup || emp.emergencyContact) && (
            <Paper elevation={0} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #FECACA", background: "#FFF5F5" }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Medical & Emergency</Typography>
              <InfoRow icon={<FavoriteIcon />}label="Blood Group"       value={emp.bloodGroup} />
              <InfoRow icon={<PersonIcon />}  label="Emergency Contact" value={emp.emergencyContact} />
              <InfoRow icon={<PhoneIcon />}   label="Emergency Phone"   value={emp.emergencyPhone} />
            </Paper>
          )}

          {emp.notes && (
            <Paper elevation={0} sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Notes</Typography>
              <Typography sx={{ fontSize: { xs: 11, sm: 13 }, color: "#475569", lineHeight: 1.75 }}>{emp.notes}</Typography>
            </Paper>
          )}

          {/* Footer brand */}
          <Box sx={{ background: "linear-gradient(135deg,#0052cc,#091e42)", borderRadius: 3, p: 2.5, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
              <EngineeringIcon sx={{ color: "#fff", fontSize: 18 }} />
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 11, sm: 14 }, color: "#fff", letterSpacing: "2px" }}>C-TECH ENGINEERING</Typography>
            </Box>
            <Box sx={{ width: 36, height: 1, background: "rgba(255,255,255,0.2)", mx: "auto", my: 1 }} />
            <Typography sx={{ fontSize: { xs: 8, sm: 10 }, color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px" }}>BUILDING TRUST. DELIVERING EXCELLENCE.</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2, borderTop: "1px solid #F1F5F9", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: "#E2E8F0", color: "#475569", flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>Close</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(emp)} sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>Edit Employee</Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QR CODE DIALOG — Responsive
// ══════════════════════════════════════════════════════════════════════════════
function QRCodeDialog({ open, employee, onClose, onSnack }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!open || !employee?.employeeId) return;
    const url = getProfileUrl(employee.employeeId);
    setProfileUrl(url);
    setQrCodeUrl("");
    setCopied(false);
    const generateQR = async () => {
      try {
        const QRCodeModule = await import("qrcode");
        const dataUrl = await QRCodeModule.default.toDataURL(url, {
          width: isMobile ? 250 : 320,
          margin: 2,
          color: { dark: "#1565C0", light: "#ffffff" },
        });
        setQrCodeUrl(dataUrl);
      } catch (error) {
        console.error("QR generation error:", error);
      }
    };
    generateQR();
  }, [open, employee, isMobile]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onSnack) onSnack("Profile link copied to clipboard!", "success");
    } catch (err) {
      if (onSnack) onSnack("Failed to copy link", "error");
    }
  };

  const openProfile = () => window.open(profileUrl, "_blank");

  if (!employee) return null;

  const co = COMPANY_OPTIONS.find(c => c.value === employee.company) || COMPANY_OPTIONS[0];

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={SlideUp} maxWidth="xs" fullWidth>

      {/* Header */}
      <Box sx={{
        background: "linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)",
        px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 },
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "12px",
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <QrCodeScannerIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, fontWeight: 700, color: "#fff" }}>Employee QR Code</Typography>
            <Typography sx={{ fontSize: { xs: 10, sm: 11.5 }, color: "rgba(255,255,255,0.65)" }}>Scan to open profile instantly</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.12)" } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>

        {/* Employee identity strip */}
        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: { xs: 1.5, sm: 2.5 }, pb: 0 }}>
          <Paper elevation={0} sx={{
            p: "14px 18px", borderRadius: 2.5,
            border: `1.5px solid ${co.border}`,
            background: co.bg,
            display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
          }}>
            <Avatar src={employee.photoURL}
              sx={{ width: 46, height: 46, border: `2px solid ${co.color}`, background: "#DBEAFE", color: co.color, fontWeight: 700, fontSize: 17 }}>
              {!employee.photoURL && (employee.fullName || "?")[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 }, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {employee.fullName}
              </Typography>
              <Typography sx={{ fontSize: { xs: 10, sm: 12 }, color: "#64748b", mt: 0.2 }}>
                {employee.designation}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Chip label={employee.employeeId} size="small"
                sx={{ fontFamily: "monospace", background: "#fff", color: co.color, border: `1px solid ${co.border}`, fontWeight: 700, fontSize: 11, mb: 0.5, display: "block" }} />
              <Chip label={co.label} size="small"
                sx={{ background: co.color, color: "#fff", fontWeight: 600, fontSize: 10 }} />
            </Box>
          </Paper>
        </Box>

        {/* QR Code card */}
        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2, pb: 0 }}>
          <Paper elevation={0} sx={{
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            background: "#fff",
            overflow: "hidden",
          }}>
            <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2, pb: 1, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: { xs: 10, sm: 12 }, fontWeight: 700, color: "#334155" }}>Scan with phone camera</Typography>
              <Chip label="Live" size="small"
                sx={{ background: "#DCFCE7", color: "#166534", fontWeight: 700, fontSize: 10, height: 20 }} />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: { xs: 2, sm: 3 }, px: 2, background: "#FAFBFF" }}>
              {qrCodeUrl ? (
                <Box sx={{
                  p: 2,
                  border: "1.5px solid #E8EEFF",
                  borderRadius: 2.5,
                  background: "#fff",
                  boxShadow: "0 4px 24px rgba(79,70,229,0.08)",
                  position: "relative",
                }}>
                  <img
                    src={qrCodeUrl}
                    alt="Employee QR Code"
                    style={{ width: isMobile ? 160 : 200, height: isMobile ? 160 : 200, display: "block" }}
                  />
                  {[
                    { top: 0, left: 0, borderTop: "3px solid #4F46E5", borderLeft: "3px solid #4F46E5", borderRadius: "6px 0 0 0" },
                    { top: 0, right: 0, borderTop: "3px solid #4F46E5", borderRight: "3px solid #4F46E5", borderRadius: "0 6px 0 0" },
                    { bottom: 0, left: 0, borderBottom: "3px solid #4F46E5", borderLeft: "3px solid #4F46E5", borderRadius: "0 0 0 6px" },
                    { bottom: 0, right: 0, borderBottom: "3px solid #4F46E5", borderRight: "3px solid #4F46E5", borderRadius: "0 0 6px 0" },
                  ].map((s, i) => (
                    <Box key={i} sx={{ position: "absolute", width: 16, height: 16, ...s }} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ width: isMobile ? 180 : 232, height: isMobile ? 180 : 232, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2.5, border: "1.5px dashed #DDD6FE", background: "#FAFBFF" }}>
                  <CircularProgress size={36} sx={{ color: "#7C3AED" }} />
                </Box>
              )}
            </Box>

            <Box sx={{
              px: { xs: 1.5, sm: 2.5 }, py: 1.75,
              borderTop: "1px solid #F1F5F9",
              background: "#F8FAFC",
              display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap",
            }}>
              <LinkIcon sx={{ color: "#94a3b8", fontSize: 16, flexShrink: 0 }} />
              <Typography sx={{
                fontSize: { xs: 9, sm: 11 }, fontFamily: "monospace", color: "#4F46E5",
                flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {profileUrl}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy link"} arrow>
                <IconButton size="small" onClick={copyToClipboard}
                  sx={{
                    flexShrink: 0,
                    background: copied ? "#DCFCE7" : alpha("#4F46E5", 0.08),
                    color: copied ? "#16a34a" : "#4F46E5",
                    borderRadius: "7px",
                    "&:hover": { background: alpha("#4F46E5", 0.15) },
                    transition: "all .2s",
                  }}>
                  {copied ? <CheckIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 1.5, pb: 2.5 }}>
          <Typography sx={{ fontSize: { xs: 10, sm: 11.5 }, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
            Point your phone camera at the QR code · No app needed
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.5, sm: 2.5 }, pt: 0, gap: 1, background: "#F8FAFC", borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={onClose}
          sx={{ borderColor: "#E2E8F0", color: "#475569", flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
          Close
        </Button>
        <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={openProfile}
          sx={{ borderColor: "#4F46E5", color: "#4F46E5", flex: { xs: "1 1 100%", sm: "0 0 auto" },
            "&:hover": { background: alpha("#4F46E5", 0.06) } }}>
          Open Profile
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => downloadQRCode(employee.employeeId)}
          fullWidth
          sx={{
            mt: 0.5,
            background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
            "&:hover": { background: "linear-gradient(135deg,#4338CA,#6D28D9)" },
          }}
        >
          Download QR Code
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DELETE DIALOG - Responsive
// ══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ open, employee, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!employee) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "employees", employee.id));
      onSuccess();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onClose={!deleting ? onClose : undefined}
      TransitionComponent={SlideUp} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: "center", pt: 4, pb: 2, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
          <DeleteIcon sx={{ color: "#dc2626", fontSize: 30 }} />
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>Delete Employee?</Typography>
        <Typography sx={{ fontSize: { xs: 12, sm: 13.5 }, color: "#64748b", lineHeight: 1.7 }}>
          This will permanently remove{" "}
          <strong style={{ color: "#0F172A" }}>{employee.fullName}</strong>{" "}
          ({employee.employeeId}) from Firebase. This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 3, gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" fullWidth onClick={onClose} disabled={deleting}
          sx={{ borderColor: "#E2E8F0", color: "#475569" }}>Cancel</Button>
        <Button variant="contained" fullWidth onClick={handleDelete} disabled={deleting} color="error"
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          sx={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
          {deleting ? "Deleting…" : "Yes, Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}