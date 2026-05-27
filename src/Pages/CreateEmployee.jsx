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
import { createTheme, ThemeProvider, alpha, useTheme } from "@mui/material/styles";

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
import MoreVertIcon       from "@mui/icons-material/MoreVert";
import Menu               from "@mui/material/Menu";

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
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
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
        paper: { borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.18)" },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.72rem" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiSelect: {
      styleOverrides: { root: { borderRadius: 10 } },
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
  // Clean the employee ID first
  const cleanId = String(employeeId).trim();
  
  // Return the correct hash-based URL
  return `${window.location.origin}/#/${cleanId}`;
}

async function generateQRCode(employeeId) {
  // Clean the employeeId before generating QR
  const cleanEmployeeId = String(employeeId).trim();
  const url = getProfileUrl(cleanEmployeeId);
  
  const QRCodeModule = await import("qrcode");
  return await QRCodeModule.default.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
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
      <Box sx={{ minHeight: "100vh", background: "white", fontFamily: "'DM Sans',sans-serif" }}>

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
// MOBILE EMPLOYEE CARD (replaces table rows on small screens)
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeMobileCard({ emp, onView, onEdit, onQR, onDelete }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const co = COMPANY_OPTIONS.find(c => c.value === emp.company) || COMPANY_OPTIONS[0];
  const isActive = emp.status === "Active";

  return (
    <Paper elevation={0} sx={{
      borderRadius: 2.5, border: "1px solid #E2E8F0", p: 2,
      background: "#fff", mb: 1.5,
      "&:hover": { boxShadow: "0 4px 20px rgba(21,101,192,0.10)", borderColor: "#BFDBFE" },
      transition: "all .18s",
    }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Avatar src={emp.photoURL}
          sx={{ width: 46, height: 46, border: "2px solid #E2E8F0", background: "#DBEAFE", color: "#1565C0", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
          {!emp.photoURL && (emp.fullName || "?")[0]}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {emp.fullName}
            </Typography>
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ flexShrink: 0, color: "#94a3b8", p: 0.4 }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography sx={{ fontSize: 12, color: "#64748b", mb: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, alignItems: "center" }}>
            <Chip label={emp.employeeId} size="small"
              sx={{ fontFamily: "monospace", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 10, border: "1px solid #BFDBFE", height: 20 }} />
            <Chip label={co.label} size="small"
              sx={{ background: co.bg, color: co.color, border: `1px solid ${co.border}`, fontWeight: 600, fontSize: 10, height: 20 }} />
            <Chip
              label={emp.status || "Active"} size="small"
              sx={{
                background: isActive ? "#DCFCE7" : "#FEF3C7",
                color: isActive ? "#166534" : "#92400E",
                fontWeight: 700, fontSize: 10, height: 20,
              }}
            />
            {calcExperience(emp.joiningDate) && (
              <Typography sx={{ fontSize: 10.5, color: "#94a3b8" }}>
                {calcExperience(emp.joiningDate)}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {emp.contactNumber && (
        <Typography sx={{ fontSize: 11.5, color: "#64748b", mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
          <PhoneIcon sx={{ fontSize: 13 }} /> {emp.contactNumber}
        </Typography>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: 160 } }}>
        <MenuItem onClick={() => { setMenuAnchor(null); onView(emp); }}
          sx={{ fontSize: 13, gap: 1.25, color: "#2196F3" }}>
          <VisibilityIcon fontSize="small" /> View Profile
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onEdit(emp); }}
          sx={{ fontSize: 13, gap: 1.25, color: "#d97706" }}>
          <EditIcon fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onQR(emp); }}
          sx={{ fontSize: 13, gap: 1.25, color: "#7C3AED" }}>
          <QrCodeIcon fontSize="small" /> QR Code
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onDelete(emp); }}
          sx={{ fontSize: 13, gap: 1.25, color: "#dc2626" }}>
          <DeleteIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeTable({ employees, onCreate, onEdit, onView, onQR, onDelete }) {
  const [search, setSearch] = useState("");
  const isMobile = useMediaQuery("(max-width:640px)");
  const isTablet = useMediaQuery("(max-width:960px)");

  const filtered = employees.filter((e) =>
    [e.fullName, e.employeeId, e.designation, e.department, e.email]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    { label: "Total Employees", value: employees.length,                                    icon: <PeopleAltIcon />,   color: "#1565C0", border: "#1565C0" },
    { label: "Active",          value: employees.filter(e => e.status === "Active").length,  icon: <CheckCircleIcon />, color: "#16a34a", border: "#16a34a" },
    { label: "Inactive",        value: employees.filter(e => e.status !== "Active").length,  icon: <PauseCircleIcon />, color: "#d97706", border: "#d97706" },
  ];

  // Columns shown on tablet (hide some)
  const tabletHiddenCols = ["Contact", "Experience"];
  // Columns shown on desktop
  const allCols = ["Photo","Employee ID","Full Name","Designation","Department","Company","Contact","Status","Experience","Actions"];
  const visibleCols = isTablet
    ? allCols.filter(c => !tabletHiddenCols.includes(c))
    : allCols;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: { xs: 2, md: 3 }, flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{
            width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, borderRadius: "14px",
            background: "linear-gradient(135deg,#1565C0,#1976d2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(21,101,192,0.35)", flexShrink: 0,
          }}>
            <EngineeringIcon sx={{ color: "#fff", fontSize: { xs: 20, md: 26 } }} />
          </Box>
          <Box>
            <Typography sx={{
              fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.5px",
              fontSize: { xs: 16, sm: 18, md: 22 }, color: "#0F172A",
            }}>
              Employee Management
            </Typography>
            <Typography sx={{ color: "#64748b", mt: 0.3, fontSize: { xs: 11, sm: 12, md: 13 } }}>
              C-Tech Engineering · Admin Portal
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}
          size={isMobile ? "small" : "large"}
          sx={{ px: { xs: 2, md: 3 }, py: { xs: 1, md: 1.3 }, fontSize: { xs: 12, md: 14 } }}>
          {isMobile ? "Add" : "Create Employee"}
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        {stats.map((s) => (
          <Grid item xs={4} key={s.label}minWidth={'250px'}>
            <Paper elevation={0} sx={{
              borderRadius: { xs: 2, md: 1 },
              border: "1px solid #E2E8F0",
              p: { xs: "12px 14px", sm: "14px 18px", md: "18px 22px" },
              borderTop: `4px solid ${s.border}`, background: "#fff",
              transition: "box-shadow .2s, transform .2s",
              "&:hover": { boxShadow: `0 8px 28px ${alpha(s.color, 0.15)}`, transform: "translateY(-2px)" },
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: s.color, lineHeight: 1, fontSize: { xs: 22, sm: 28, md: 34 } }}>{s.value}</Typography>
                  <Typography sx={{ color: "#64748b", fontWeight: 500, mt: 0.5, fontSize: { xs: 9.5, sm: 11, md: 13 } }}>{s.label}</Typography>
                </Box>
                <Box sx={{
                  width: { xs: 32, md: 46 }, height: { xs: 32, md: 46 },
                  borderRadius: { xs: 1.5, md: 2.5 },
                  background: alpha(s.color, 0.08),
                  display: { xs: "none", sm: "flex" }, alignItems: "center", justifyContent: "center",
                }}>
                  {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: { xs: 16, md: 22 } } })}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <TextField
        fullWidth
        placeholder={isMobile ? "Search employees…" : "Search by name, ID, designation, department, email…"}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#94a3b8", fontSize: { xs: 18, md: 22 } }} /></InputAdornment>,
          sx: { background: "#fff", borderRadius: "12px", fontSize: { xs: 13, md: 14 } },
        }}
        sx={{ mb: 2 }}
        size="small"
      />

      {/* MOBILE CARDS */}
      {isMobile ? (
        <Box>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <PeopleAltIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
              <Typography sx={{ color: "#94a3b8", fontWeight: 500, fontSize: 13 }}>
                {employees.length === 0 ? 'No employees yet. Tap "Add" to create one.' : "No results found."}
              </Typography>
            </Box>
          ) : filtered.map((emp) => (
            <EmployeeMobileCard
              key={emp.id} emp={emp}
              onView={onView} onEdit={onEdit} onQR={onQR} onDelete={onDelete}
            />
          ))}
          <Box sx={{ pt: 1, pb: 2 }}>
            <Typography sx={{ color: "#94a3b8", textAlign: "center", fontSize: 11.5 }}>
              {filtered.length} of {employees.length} employees
            </Typography>
          </Box>
        </Box>
      ) : (
        /* TABLET / DESKTOP TABLE */
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isTablet ? 640 : 960, fontFamily: "'DM Sans',sans-serif" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #F1F5F9" }}>
                  {visibleCols.map((h) => (
                    <th key={h} style={{
                      padding: isTablet ? "11px 12px" : "13px 16px",
                      textAlign: h === "Actions" ? "center" : "left",
                      fontSize: isTablet ? 10 : 11,
                      fontWeight: 700, color: "#94a3b8",
                      letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length} style={{ textAlign: "center", padding: "60px 20px" }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <PeopleAltIcon sx={{ fontSize: 48, color: "#CBD5E1" }} />
                        <Typography sx={{ color: "#94a3b8", fontWeight: 500, fontSize: 13 }}>
                          {employees.length === 0
                            ? 'No employees yet. Click "Create Employee" to add one.'
                            : "No results found."}
                        </Typography>
                      </Box>
                    </td>
                  </tr>
                ) : filtered.map((emp) => {
                  const co = COMPANY_OPTIONS.find(c => c.value === emp.company) || COMPANY_OPTIONS[0];
                  const cellPad = isTablet ? "11px 12px" : "14px 16px";
                  const fs = isTablet ? 12 : 13;
                  return (
                    <tr key={emp.id}
                      style={{ borderBottom: "1px solid #F8FAFC", transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FBFF"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: cellPad }}>
                        <Avatar src={emp.photoURL}
                          sx={{
                            width: isTablet ? 32 : 38, height: isTablet ? 32 : 38,
                            border: "2px solid #E2E8F0", background: "#DBEAFE",
                            color: "#1565C0", fontWeight: 700, fontSize: isTablet ? 13 : 15,
                          }}>
                          {!emp.photoURL && (emp.fullName || "?")[0]}
                        </Avatar>
                      </td>
                      <td style={{ padding: cellPad }}>
                        <Chip label={emp.employeeId} size="small"
                          sx={{ fontFamily: "monospace", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: isTablet ? 10 : 12, border: "1px solid #BFDBFE" }} />
                      </td>
                      <td style={{ padding: cellPad }}>
                        <Typography sx={{ fontWeight: 600, fontSize: isTablet ? 12.5 : 14, color: "#0F172A", whiteSpace: "nowrap" }}>{emp.fullName}</Typography>
                      </td>
                      <td style={{ padding: cellPad, color: "#64748b", fontSize: fs, maxWidth: 160 }}>
                        <Typography sx={{ fontSize: fs, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isTablet ? 120 : 180 }}>
                          {emp.designation}
                        </Typography>
                      </td>
                      {!isTablet && (
                        <td style={{ padding: cellPad, color: "#64748b", fontSize: fs }}>{emp.department}</td>
                      )}
                      <td style={{ padding: cellPad }}>
                        <Chip label={co.label} size="small"
                          sx={{ background: co.bg, color: co.color, border: `1px solid ${co.border}`, fontWeight: 600, fontSize: isTablet ? 9.5 : 11 }} />
                      </td>
                      {!isTablet && (
                        <td style={{ padding: cellPad, color: "#64748b", fontSize: fs }}>{emp.contactNumber}</td>
                      )}
                      <td style={{ padding: cellPad }}>
                        <Chip
                          label={emp.status || "Active"} size="small"
                          icon={emp.status === "Active"
                            ? <CheckCircleIcon style={{ fontSize: 12 }} />
                            : <PauseCircleIcon style={{ fontSize: 12 }} />}
                          sx={{
                            background: emp.status === "Active" ? "#DCFCE7" : "#FEF3C7",
                            color: emp.status === "Active" ? "#166534" : "#92400E",
                            fontWeight: 700, fontSize: isTablet ? 9.5 : 11,
                            "& .MuiChip-icon": { color: emp.status === "Active" ? "#16a34a" : "#d97706" },
                          }}
                        />
                      </td>
                      {!isTablet && (
                        <td style={{ padding: cellPad, color: "#64748b", fontSize: fs }}>
                          {calcExperience(emp.joiningDate) || "—"}
                        </td>
                      )}
                      <td style={{ padding: cellPad }}>
                        <Box sx={{ display: "flex", gap: isTablet ? 0.5 : 0.75, justifyContent: "center" }}>
                          <Tooltip title="View Profile" arrow>
                            <IconButton size="small" onClick={() => onView(emp)}
                              sx={{ background: alpha("#2196F3", 0.08), color: "#2196F3", borderRadius: "8px", p: isTablet ? 0.5 : 0.75, "&:hover": { background: alpha("#2196F3", 0.16) } }}>
                              <VisibilityIcon sx={{ fontSize: isTablet ? 15 : 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit" arrow>
                            <IconButton size="small" onClick={() => onEdit(emp)}
                              sx={{ background: alpha("#f59e0b", 0.08), color: "#d97706", borderRadius: "8px", p: isTablet ? 0.5 : 0.75, "&:hover": { background: alpha("#f59e0b", 0.16) } }}>
                              <EditIcon sx={{ fontSize: isTablet ? 15 : 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="QR Code" arrow>
                            <IconButton size="small" onClick={() => onQR(emp)}
                              sx={{ background: alpha("#8b5cf6", 0.08), color: "#7C3AED", borderRadius: "8px", p: isTablet ? 0.5 : 0.75, "&:hover": { background: alpha("#8b5cf6", 0.16) } }}>
                              <QrCodeIcon sx={{ fontSize: isTablet ? 15 : 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete" arrow>
                            <IconButton size="small" onClick={() => onDelete(emp)}
                              sx={{ background: alpha("#ef4444", 0.08), color: "#dc2626", borderRadius: "8px", p: isTablet ? 0.5 : 0.75, "&:hover": { background: alpha("#ef4444", 0.16) } }}>
                              <DeleteIcon sx={{ fontSize: isTablet ? 15 : 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
          <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid #F1F5F9", background: "#FAFBFC" }}>
            <Typography sx={{ color: "#94a3b8", textAlign: "center", fontSize: { sm: 11, md: 12 } }}>
              Showing {filtered.length} of {employees.length} employees · C-Tech Engineering Employee Management System
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

// ── Shared field style helpers ─────────────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
};

const selectSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
  "& .MuiSelect-select": { borderRadius: "10px" },
};

// ══════════════════════════════════════════════════════════════════════════════
// FORM DIALOG
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
  const isMobile = useMediaQuery("(max-width:640px)");

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
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2, pb: 1.25, borderBottom: "2px solid #F1F5F9" }}>
      <Box sx={{ width: { xs: 28, md: 34 }, height: { xs: 28, md: 34 }, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { color: "#1565C0", fontSize: { xs: 15, md: 18 } } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, color: "#0F172A" }}>{title}</Typography>
        {!isMobile && <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.2 }}>{subtitle}</Typography>}
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined}
      TransitionComponent={SlideUp}
      fullWidth maxWidth="lg"
      fullScreen={isMobile}
      scroll="paper">

      {/* Dialog Header */}
      <Box sx={{ background: "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)", px: { xs: 2, md: 3.5 }, py: { xs: 2, md: 2.5 }, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: { xs: 32, md: 38 }, height: { xs: 32, md: 38 }, borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isEdit ? <EditIcon sx={{ color: "#fff", fontSize: { xs: 16, md: 20 } }} /> : <AddIcon sx={{ color: "#fff", fontSize: { xs: 16, md: 20 } }} />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: { xs: 14, md: 17 } }}>
              {isEdit ? "Edit Employee" : "Create Employee"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: { xs: 10.5, md: 11.5 } }}>
              C-Tech Engineering · Admin Portal
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {!isMobile && (
            <Chip label={isEdit ? "Editing Record" : "New Registration"} size="small"
              sx={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.25)" }} />
          )}
          <IconButton onClick={onClose} disabled={loading}
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>
        <Box sx={{ p: { xs: 1.5, md: 3 }, display: "flex", flexDirection: "column", gap: { xs: 1.75, md: 2.5 } }}>

          {error && (
            <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: 2, fontWeight: 500, fontSize: { xs: 12, md: 13 } }}>
              {error}
            </Alert>
          )}

          {/* Photo Upload */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PersonIcon />} title="Employee Photo" subtitle="Upload a clear passport-size photo" />
            <Box
              sx={{
                border: `2px dashed ${dragOver ? "#1565C0" : "#BFDBFE"}`,
                borderRadius: 3, p: { xs: 2, md: 2.5 },
                display: "flex", alignItems: "center", gap: { xs: 1.5, md: 2.5 },
                background: dragOver ? "#EFF6FF" : "#F8FBFF", cursor: "pointer",
                transition: "all .2s", flexWrap: "wrap",
                "&:hover": { borderColor: "#1565C0", background: "#EFF6FF" },
              }}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <Avatar src={imagePreview}
                sx={{ width: { xs: 56, md: 76 }, height: { xs: 56, md: 76 }, border: "3px solid #1565C0", background: "#DBEAFE", color: "#1565C0", fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>
                {!imagePreview && <CloudUploadIcon sx={{ fontSize: { xs: 22, md: 30 }, color: "#93c5fd" }} />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: { xs: 12.5, md: 14 }, fontWeight: 600, color: "#334155" }}>
                  {imagePreview ? "Photo selected — click to change" : "Drag & drop or click to upload"}
                </Typography>
                <Typography sx={{ fontSize: { xs: 11, md: 12 }, color: "#94a3b8", mt: 0.5 }}>JPG, PNG, WEBP · Max 5 MB</Typography>
              </Box>
              <Button variant="contained" size="small" startIcon={<CloudUploadIcon />}
                onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}
                sx={{ flexShrink: 0, fontSize: { xs: 11, md: 13 } }}>
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
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<BusinessIcon />} title="Company" subtitle="Select the company this employee belongs to" />
            <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, flexWrap: "wrap" }}>
              {COMPANY_OPTIONS.map((co) => {
                const isSelected = form.company === co.value;
                return (
                  <Box
                    key={co.value}
                    onClick={() => setForm(p => ({ ...p, company: co.value }))}
                    sx={{
                      flex: "1 1 240px",
                      border: `2px solid ${isSelected ? co.color : "#E2E8F0"}`,
                      borderRadius: 2.5,
                      p: { xs: "12px 14px", md: "14px 20px" },
                      cursor: "pointer",
                      background: isSelected ? co.bg : "#fff",
                      transition: "all .18s",
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 1.25, md: 2 },
                      "&:hover": { borderColor: co.color, background: co.bg },
                    }}
                  >
                    <Box sx={{
                      width: { xs: 34, md: 40 }, height: { xs: 34, md: 40 }, borderRadius: "10px",
                      background: isSelected ? co.color : "#F1F5F9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "background .18s",
                    }}>
                      <EngineeringIcon sx={{ color: isSelected ? "#fff" : "#94a3b8", fontSize: { xs: 17, md: 20 } }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: { xs: 12.5, md: 14 }, fontWeight: 700, color: isSelected ? co.color : "#334155" }}>
                        {co.label}
                      </Typography>
                      {!isMobile && (
                        <Typography sx={{ fontSize: 11.5, color: isSelected ? co.color : "#94a3b8", mt: 0.25, opacity: 0.8 }}>
                          {co.value === "C-Tech" ? "C-Tech Engineering Pvt. Ltd." : "Precon Construction"}
                        </Typography>
                      )}
                    </Box>
                    {isSelected && (
                      <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: co.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckIcon sx={{ color: "#fff", fontSize: 13 }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Identity & Role */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<BadgeIcon />} title="Identity & Role" subtitle="Employee ID, designation and department" />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
              {[
                { label: "Employee ID", name: "employeeId", placeholder: "EMP-2024-0001", required: true },
                { label: "Full Name", name: "fullName", placeholder: "Rajesh Kumar", required: true },
                { label: "Designation", name: "designation", placeholder: "Senior Structural Engineer", required: true },
                { label: "Department", name: "department", placeholder: "Civil & Structural Division", required: true },
              ].map((f) => (
                <Grid item xs={12} sm={6} md={4} key={f.name}>
                  <TextField fullWidth size="small" label={f.label} name={f.name} required={f.required}
                    placeholder={f.placeholder} value={form[f.name]} onChange={set} sx={fieldSx}
                    InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                    InputLabelProps={{ sx: { fontSize: { xs: 12.5, md: 14 } } }}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" sx={selectSx}>
                  <InputLabel sx={{ fontSize: { xs: 12.5, md: 14 } }}>Employment Status</InputLabel>
                  <Select name="status" value={form.status} label="Employment Status" onChange={set}
                    sx={{ fontSize: { xs: 13, md: 14 } }}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Personal Information */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PersonIcon />} title="Personal Information" subtitle="Date of birth, gender and residency address" />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Date of Birth" name="dob" type="date"
                  InputLabelProps={{ shrink: true, sx: { fontSize: { xs: 12.5, md: 14 } } }}
                  value={form.dob} onChange={set} sx={fieldSx}
                  InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                  helperText={form.dob ? `Age: ${calculateAge(form.dob)} years` : " "}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}minWidth={'200px'}>
                <FormControl fullWidth size="small" sx={selectSx}>
                  <InputLabel sx={{ fontSize: { xs: 12.5, md: 14 } }}>Gender</InputLabel>
                  <Select name="gender" value={form.gender} label="Gender" onChange={set}
                    sx={{ fontSize: { xs: 13, md: 14 } }}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}minWidth={'500px'}>
                <TextField fullWidth size="small" label="Residency Address" name="residencyAddress"
                  multiline rows={2}
                  placeholder="House No, Street, City, State, Pincode"
                  value={form.residencyAddress} onChange={set}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                  InputLabelProps={{ sx: { fontSize: { xs: 12.5, md: 14 } } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Joining & Experience */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<CalendarTodayIcon />} title="Joining & Work Experience" subtitle="Experience auto-calculated from joining date" />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }} alignItems="flex-start">
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Date of Joining" name="joiningDate" required
                  type="date" InputLabelProps={{ shrink: true, sx: { fontSize: { xs: 12.5, md: 14 } } }}
                  value={form.joiningDate} onChange={set} sx={fieldSx}
                  InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth size="small" label="Work Shift" name="workShift"
                  placeholder="8:00 AM – 5:30 PM" value={form.workShift} onChange={set} sx={fieldSx}
                  InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                  InputLabelProps={{ sx: { fontSize: { xs: 12.5, md: 14 } } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ pt: 0.5 }}>
                  <Typography sx={{ fontSize: { xs: 11.5, md: 12 }, fontWeight: 600, color: "#334155", mb: 0.75 }}>Work Experience</Typography>
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
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PhoneIcon />} title="Contact Information" subtitle="Mobile, email and site location" />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
              {[
                { label: "Mobile Number", name: "contactNumber", placeholder: "+91 98400 55123", required: true },
                { label: "Work Email", name: "email", placeholder: "name@ctech-engg.in", required: true },
                { label: "Work Location", name: "location", placeholder: "Chennai, Tamil Nadu" },
              ].map((f) => (
                <Grid item xs={12} sm={6} md={4} key={f.name}>
                  <TextField fullWidth size="small" label={f.label} name={f.name}
                    required={f.required} placeholder={f.placeholder}
                    value={form[f.name]} onChange={set} sx={fieldSx}
                    InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                    InputLabelProps={{ sx: { fontSize: { xs: 12.5, md: 14 } } }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Medical & Emergency */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #FEE2E2", background: "#FFFBFB" }}>
            <SectionLabel icon={<FavoriteIcon />} title="Medical & Emergency" subtitle="Blood group and emergency contact" />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
              {[
                { label: "Blood Group", name: "bloodGroup", placeholder: "B+ / O-" },
                { label: "Emergency Contact Name", name: "emergencyContact", placeholder: "Priya Kumar (Spouse)" },
                { label: "Emergency Phone", name: "emergencyPhone", placeholder: "+91 94450 22876" },
              ].map((f) => (
                <Grid item xs={12} sm={6} md={4} key={f.name}>
                  <TextField fullWidth size="small" label={f.label} name={f.name}
                    placeholder={f.placeholder} value={form[f.name]} onChange={set} sx={fieldSx}
                    InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
                    InputLabelProps={{ sx: { fontSize: { xs: 12.5, md: 14 } } }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Notes */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<NoteAltIcon />} title="Additional Notes" subtitle="Certifications, remarks or special instructions" />
            <TextField fullWidth multiline minRows={3} name="notes" label="Notes"
              placeholder="e.g. Holds PMP certification, site safety trained…"
              value={form.notes} onChange={set}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              InputProps={{ sx: { fontSize: { xs: 13, md: 14 } } }}
              InputLabelProps={{ sx: { fontSize: { xs: 12.5, md: 14 } } }}
            />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.75, md: 2 }, borderTop: "1px solid #F1F5F9", gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}
          size={isMobile ? "small" : "medium"}
          sx={{ borderColor: "#E2E8F0", color: "#475569", "&:hover": { background: "#F1F5F9" }, fontSize: { xs: 12, md: 14 } }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          size={isMobile ? "small" : "medium"}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <VerifiedUserIcon />}
          sx={{ minWidth: { xs: 140, md: 180 }, fontSize: { xs: 12, md: 14 } }}>
          {loading ? "Saving…" : isEdit ? "Update Employee" : "Create & Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW PROFILE DIALOG
// ══════════════════════════════════════════════════════════════════════════════
function ViewProfileDialog({ open, employee, onClose, onEdit }) {
  const emp = employee;
  const isMobile = useMediaQuery("(max-width:640px)");

  const InfoRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <Box sx={{
        display: "flex", alignItems: "flex-start", gap: 1.5,
        py: { xs: 1, md: 1.25 }, borderBottom: "1px solid #F8FAFC", "&:last-child": { borderBottom: "none" },
      }}>
        <Box sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.25 }}>
          {React.cloneElement(icon, { sx: { color: "#1565C0", fontSize: { xs: 14, md: 16 } } })}
        </Box>
        <Box>
          <Typography sx={{ fontSize: { xs: 9.5, md: 10 }, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", mb: 0.3 }}>{label}</Typography>
          <Typography sx={{ fontSize: { xs: 12.5, md: 13.5 }, color: "#0F172A", fontWeight: 500 }}>{value}</Typography>
        </Box>
      </Box>
    );
  };

  if (!emp) return null;
  const isActive = emp.status === "Active";
  const co = COMPANY_OPTIONS.find(c => c.value === emp.company) || COMPANY_OPTIONS[0];

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={SlideUp}
      fullWidth maxWidth="sm" fullScreen={isMobile} scroll="paper">

      {/* Hero */}
      <Box sx={{ background: "linear-gradient(145deg,#0052CC 0%,#0A3A7A 55%,#091E42 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%,rgba(255,255,255,0.05) 0%,transparent 60%)" }} />
        <Box sx={{ position: "relative", zIndex: 2, pt: { xs: 3, md: 4 }, pb: { xs: 3.5, md: 5 }, px: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <IconButton onClick={onClose}
            sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={<Box sx={{ width: 16, height: 16, borderRadius: "50%", background: isActive ? "#22c55e" : "#f59e0b", border: "2px solid #0052CC" }} />}>
            <Avatar src={emp.photoURL}
              sx={{ width: { xs: 70, md: 86 }, height: { xs: 70, md: 86 }, border: "3px solid rgba(255,255,255,0.3)", background: "linear-gradient(135deg,#1e40af,#0052cc)", fontSize: { xs: 24, md: 30 }, fontWeight: 700, color: "#fff" }}>
              {!emp.photoURL && (emp.fullName || "?")[0]}
            </Avatar>
          </Badge>
          <Typography sx={{ fontWeight: 800, color: "#fff", mt: 1.5, mb: 0.5, fontSize: { xs: 17, md: 21 } }}>{emp.fullName}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.65)", mb: 1.5, fontSize: { xs: 11.5, md: 13 } }}>
            {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
            <Chip label={emp.status || "Active"} size="small"
              icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#4ade80" : "#fbbf24" }} />}
              sx={{ background: "rgba(34,197,94,0.2)", border: "0.5px solid rgba(34,197,94,0.45)", color: "#4ade80", fontWeight: 700, fontSize: 10 }} />
            {emp.employeeId && (
              <Chip label={emp.employeeId} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 10 }} />
            )}
            {emp.company && (
              <Chip label={co.label} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 10 }} />
            )}
            {emp.location && !isMobile && (
              <Chip label={emp.location} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 10 }} />
            )}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>
        <Box sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 2 }, display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>

          {/* Verified strip */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, md: 1.75 }, borderRadius: 2.5, border: "1px solid #86EFAC", background: "#F0FDF4", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: { xs: 32, md: 38 }, height: { xs: 32, md: 38 }, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <VerifiedUserIcon sx={{ color: "#16a34a", fontSize: { xs: 17, md: 20 } }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: { xs: 12.5, md: 13.5 } }}>Identity Verified</Typography>
              <Typography sx={{ color: "#4ade80", mt: 0.2, fontSize: { xs: 10.5, md: 11.5 } }}>Authenticated via C-Tech QR Code</Typography>
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
                <Paper elevation={0} sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2.5, border: "1px solid #E2E8F0", borderTop: `3px solid ${s.border}`, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 800, color: s.color, lineHeight: 1.1, fontSize: { xs: 13, sm: 15, md: 17 } }}>{s.value}</Typography>
                  <Typography sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", mt: 0.5, fontSize: { xs: 8.5, sm: 9, md: 9.5 } }}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Personal Information */}
          {(emp.dob || emp.gender || emp.residencyAddress) && (
            <Paper elevation={0} sx={{ px: { xs: 1.75, md: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
              <Typography sx={{ fontSize: { xs: 9.5, md: 10.5 }, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>
                Personal Information
              </Typography>
              {emp.dob && <InfoRow icon={<CakeIcon />} label="Date of Birth" value={new Date(emp.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />}
              {emp.dob && <InfoRow icon={<AccessTimeIcon />} label="Age" value={`${calculateAge(emp.dob)} years`} />}
              {emp.gender && <InfoRow icon={<WcIcon />} label="Gender" value={emp.gender} />}
              {emp.residencyAddress && <InfoRow icon={<HomeIcon />} label="Residency Address" value={emp.residencyAddress} />}
            </Paper>
          )}

          {/* Contact */}
          <Paper elevation={0} sx={{ px: { xs: 1.75, md: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
            <Typography sx={{ fontSize: { xs: 9.5, md: 10.5 }, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Contact Information</Typography>
            <InfoRow icon={<PhoneIcon />}     label="Mobile"     value={emp.contactNumber} />
            <InfoRow icon={<EmailIcon />}     label="Work Email" value={emp.email} />
            <InfoRow icon={<LocationOnIcon />}label="Location"   value={emp.location} />
            <InfoRow icon={<AccessTimeIcon />}label="Work Shift" value={emp.workShift} />
          </Paper>

          {/* Employment */}
          <Paper elevation={0} sx={{ px: { xs: 1.75, md: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
            <Typography sx={{ fontSize: { xs: 9.5, md: 10.5 }, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Employment Details</Typography>
            <InfoRow icon={<BusinessIcon />}      label="Company"         value={co.label} />
            <InfoRow icon={<WorkIcon />}          label="Department"      value={emp.department} />
            <InfoRow icon={<BadgeIcon />}          label="Designation"     value={emp.designation} />
            <InfoRow icon={<CalendarTodayIcon />}  label="Date of Joining" value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : ""} />
            <InfoRow icon={<AccessTimeIcon />}     label="Work Experience" value={calcExperience(emp.joiningDate)} />
          </Paper>

          {(emp.bloodGroup || emp.emergencyContact) && (
            <Paper elevation={0} sx={{ px: { xs: 1.75, md: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #FECACA", background: "#FFF5F5" }}>
              <Typography sx={{ fontSize: { xs: 9.5, md: 10.5 }, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Medical & Emergency</Typography>
              <InfoRow icon={<FavoriteIcon />}label="Blood Group"       value={emp.bloodGroup} />
              <InfoRow icon={<PersonIcon />}  label="Emergency Contact" value={emp.emergencyContact} />
              <InfoRow icon={<PhoneIcon />}   label="Emergency Phone"   value={emp.emergencyPhone} />
            </Paper>
          )}

          {emp.notes && (
            <Paper elevation={0} sx={{ px: { xs: 1.75, md: 2 }, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
              <Typography sx={{ fontSize: { xs: 9.5, md: 10.5 }, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Notes</Typography>
              <Typography sx={{ fontSize: { xs: 12.5, md: 13 }, color: "#475569", lineHeight: 1.75 }}>{emp.notes}</Typography>
            </Paper>
          )}

          {/* Footer brand */}
          <Box sx={{ background: "linear-gradient(135deg,#0052cc,#091e42)", borderRadius: 3, p: { xs: 2, md: 2.5 }, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.75 }}>
              <EngineeringIcon sx={{ color: "#fff", fontSize: { xs: 15, md: 18 } }} />
              <Typography sx={{ fontWeight: 800, color: "#fff", letterSpacing: "2px", fontSize: { xs: 11.5, md: 14 } }}>C-TECH ENGINEERING</Typography>
            </Box>
            <Box sx={{ width: 36, height: 1, background: "rgba(255,255,255,0.2)", mx: "auto", my: 1 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px", fontSize: { xs: 9, md: 10 } }}>BUILDING TRUST. DELIVERING EXCELLENCE.</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.75, md: 2 }, borderTop: "1px solid #F1F5F9", gap: 1 }}>
        <Button variant="outlined" onClick={onClose} size={isMobile ? "small" : "medium"}
          sx={{ borderColor: "#E2E8F0", color: "#475569", fontSize: { xs: 12, md: 14 } }}>Close</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(emp)}
          size={isMobile ? "small" : "medium"}
          sx={{ fontSize: { xs: 12, md: 14 } }}>Edit Employee</Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QR CODE DIALOG
// ══════════════════════════════════════════════════════════════════════════════
function QRCodeDialog({ open, employee, onClose, onSnack }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const isMobile = useMediaQuery("(max-width:640px)");

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
          width: 320,
          margin: 2,
          color: { dark: "#1565C0", light: "#ffffff" },
        });
        setQrCodeUrl(dataUrl);
      } catch (error) {
        console.error("QR generation error:", error);
      }
    };
    generateQR();
  }, [open, employee]);

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
    <Dialog open={open} onClose={onClose} TransitionComponent={SlideUp}
      maxWidth="xs" fullWidth fullScreen={isMobile}>

      {/* Header */}
      <Box sx={{
        background: "linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)",
        px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 },
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: { xs: 34, md: 40 }, height: { xs: 34, md: 40 }, borderRadius: "12px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCodeScannerIcon sx={{ color: "#fff", fontSize: { xs: 18, md: 22 } }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: { xs: 14, md: 16 } }}>Employee QR Code</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: { xs: 10.5, md: 11.5 } }}>Scan to open profile instantly</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.12)" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>

        {/* Employee identity strip */}
        <Box sx={{ px: { xs: 2, md: 2.5 }, pt: { xs: 2, md: 2.5 }, pb: 0 }}>
          <Paper elevation={0} sx={{
            p: { xs: "12px 14px", md: "14px 18px" }, borderRadius: 2.5,
            border: `1.5px solid ${co.border}`, background: co.bg,
            display: "flex", alignItems: "center", gap: 1.5,
          }}>
            <Avatar src={employee.photoURL}
              sx={{ width: { xs: 38, md: 46 }, height: { xs: 38, md: 46 }, border: `2px solid ${co.color}`, background: "#DBEAFE", color: co.color, fontWeight: 700, fontSize: { xs: 14, md: 17 }, flexShrink: 0 }}>
              {!employee.photoURL && (employee.fullName || "?")[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: { xs: 12.5, md: 14 } }}>
                {employee.fullName}
              </Typography>
              <Typography sx={{ color: "#64748b", mt: 0.2, fontSize: { xs: 11, md: 12 } }}>
                {employee.designation}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Chip label={employee.employeeId} size="small"
                sx={{ fontFamily: "monospace", background: "#fff", color: co.color, border: `1px solid ${co.border}`, fontWeight: 700, fontSize: { xs: 9.5, md: 11 }, mb: 0.5, display: "block" }} />
              <Chip label={co.label} size="small"
                sx={{ background: co.color, color: "#fff", fontWeight: 600, fontSize: { xs: 9, md: 10 } }} />
            </Box>
          </Paper>
        </Box>

        {/* QR Code card */}
        <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2, pb: 0 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", background: "#fff", overflow: "hidden" }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 700, color: "#334155", fontSize: { xs: 11.5, md: 12 } }}>Scan with phone camera</Typography>
              <Chip label="Live" size="small" sx={{ background: "#DCFCE7", color: "#166534", fontWeight: 700, fontSize: 10, height: 20 }} />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: { xs: 2.5, md: 3 }, px: 2, background: "#FAFBFF" }}>
              {qrCodeUrl ? (
                <Box sx={{ p: { xs: 1.5, md: 2 }, border: "1.5px solid #E8EEFF", borderRadius: 2.5, background: "#fff", boxShadow: "0 4px 24px rgba(79,70,229,0.08)", position: "relative" }}>
                  <img src={qrCodeUrl} alt="Employee QR Code"
                    style={{ width: isMobile ? 170 : 200, height: isMobile ? 170 : 200, display: "block" }} />
                  {[
                    { top: 0, left: 0, borderTop: "3px solid #4F46E5", borderLeft: "3px solid #4F46E5", borderRadius: "6px 0 0 0" },
                    { top: 0, right: 0, borderTop: "3px solid #4F46E5", borderRight: "3px solid #4F46E5", borderRadius: "0 6px 0 0" },
                    { bottom: 0, left: 0, borderBottom: "3px solid #4F46E5", borderLeft: "3px solid #4F46E5", borderRadius: "0 0 0 6px" },
                    { bottom: 0, right: 0, borderBottom: "3px solid #4F46E5", borderRight: "3px solid #4F46E5", borderRadius: "0 0 6px 0" },
                  ].map((s, i) => (
                    <Box key={i} sx={{ position: "absolute", width: 18, height: 18, ...s }} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ width: isMobile ? 200 : 232, height: isMobile ? 200 : 232, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2.5, border: "1.5px dashed #DDD6FE", background: "#FAFBFF" }}>
                  <CircularProgress size={36} sx={{ color: "#7C3AED" }} />
                </Box>
              )}
            </Box>

            <Box sx={{ px: 2.5, py: 1.75, borderTop: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", alignItems: "center", gap: 1 }}>
              <LinkIcon sx={{ color: "#94a3b8", fontSize: 15, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 10.5, fontFamily: "monospace", color: "#4F46E5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profileUrl}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy link"} arrow>
                <IconButton size="small" onClick={copyToClipboard}
                  sx={{ flexShrink: 0, background: copied ? "#DCFCE7" : alpha("#4F46E5", 0.08), color: copied ? "#16a34a" : "#4F46E5", borderRadius: "7px", "&:hover": { background: alpha("#4F46E5", 0.15) }, transition: "all .2s" }}>
                  {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
          <Typography sx={{ color: "#94a3b8", textAlign: "center", lineHeight: 1.6, fontSize: { xs: 11, md: 11.5 } }}>
            Point your phone camera at the QR code · No app needed
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 }, pt: 0, gap: 1, background: "#F8FAFC", borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={onClose} size={isMobile ? "small" : "medium"}
          sx={{ borderColor: "#E2E8F0", color: "#475569", flex: "1 1 auto", fontSize: { xs: 12, md: 13 } }}>
          Close
        </Button>
        <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={openProfile}
          size={isMobile ? "small" : "medium"}
          sx={{ borderColor: "#4F46E5", color: "#4F46E5", flex: "1 1 auto", fontSize: { xs: 12, md: 13 }, "&:hover": { background: alpha("#4F46E5", 0.06) } }}>
          Open Profile
        </Button>
        <Button variant="contained" startIcon={<DownloadIcon />}
          onClick={() => downloadQRCode(employee.employeeId)}
          fullWidth size={isMobile ? "small" : "medium"}
          sx={{ mt: 0.5, fontSize: { xs: 12, md: 13 }, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", "&:hover": { background: "linear-gradient(135deg,#4338CA,#6D28D9)" } }}>
          Download QR Code
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DELETE DIALOG
// ══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ open, employee, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);
  const isMobile = useMediaQuery("(max-width:640px)");

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
      <DialogContent sx={{ textAlign: "center", pt: { xs: 3, md: 4 }, pb: 2, px: { xs: 2, md: 3 } }}>
        <Box sx={{ width: { xs: 52, md: 64 }, height: { xs: 52, md: 64 }, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
          <DeleteIcon sx={{ color: "#dc2626", fontSize: { xs: 24, md: 30 } }} />
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: 16, md: 18 } }}>Delete Employee?</Typography>
        <Typography sx={{ color: "#64748b", lineHeight: 1.7, fontSize: { xs: 12.5, md: 13.5 } }}>
          This will permanently remove{" "}
          <strong style={{ color: "#0F172A" }}>{employee.fullName}</strong>{" "}
          ({employee.employeeId}) from Firebase. This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2.5, md: 3 }, gap: 1 }}>
        <Button variant="outlined" fullWidth onClick={onClose} disabled={deleting}
          size={isMobile ? "small" : "medium"}
          sx={{ borderColor: "#E2E8F0", color: "#475569", fontSize: { xs: 12, md: 14 } }}>Cancel</Button>
        <Button variant="contained" fullWidth onClick={handleDelete} disabled={deleting} color="error"
          size={isMobile ? "small" : "medium"}
          startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
          sx={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 4px 14px rgba(220,38,38,0.3)", fontSize: { xs: 12, md: 14 } }}>
          {deleting ? "Deleting…" : "Yes, Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}