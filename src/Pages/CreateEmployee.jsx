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
  Tooltip, Badge, Slide, Snackbar, Alert,
} from "@mui/material";
import { createTheme, alpha } from "@mui/material/styles";

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

const BLANK = {
  employeeId: "", fullName: "", designation: "", department: "",
  contactNumber: "", email: "", bloodGroup: "",
  emergencyContact: "", emergencyPhone: "",
  joiningDate: "", location: "", workShift: "", status: "Active", notes: "",
};

// ── Barcode helpers ────────────────────────────────────────────────────────────
function renderBarcode(canvas, value) {
  if (!canvas || !value) return false;
  try {
    const safe = String(value).replace(/[^\x20-\x7E]/g, "");
    JsBarcode(canvas, safe, {
      format: "CODE128",
      width: 2, height: 60,
      displayValue: true,
      text: safe,
      fontOptions: "bold",
      font: "DM Sans, monospace",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 5,
      fontSize: 13,
      background: "#ffffff",
      lineColor: "#0F172A",
      margin: 12,
    });
    return true;
  } catch { return false; }
}

function downloadBarcode(employeeId, canvas) {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `Barcode_${employeeId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ── QR Code helpers ────────────────────────────────────────────────────────────
async function generateQRCode(employeeId) {
  const url = `${window.location.origin}/#/employee/profile/${employeeId}`;
  return await QRCode.toDataURL(url, {
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
  const [barcodeDialog,setBarcodeDialog]= useState({ open: false, employee: null });
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
          onBarcode={(emp) => setBarcodeDialog({ open: true, employee: emp })}
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

        <BarcodeDialog
          open={barcodeDialog.open}
          employee={barcodeDialog.employee}
          onClose={() => setBarcodeDialog({ open: false, employee: null })}
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
// TABLE (same as before, keep it)
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeTable({ employees, onCreate, onEdit, onView, onBarcode, onDelete }) {
  const [search, setSearch] = useState("");

  const filtered = employees.filter((e) =>
    [e.fullName, e.employeeId, e.designation, e.department, e.email]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    { label: "Total Employees", value: employees.length,                                   icon: <PeopleAltIcon />,   color: "#1565C0", border: "#1565C0" },
    { label: "Active",          value: employees.filter(e => e.status === "Active").length, icon: <CheckCircleIcon />, color: "#16a34a", border: "#16a34a" },
    { label: "Inactive",        value: employees.filter(e => e.status !== "Active").length, icon: <PauseCircleIcon />, color: "#d97706", border: "#d97706" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: "14px",
            background: "linear-gradient(135deg,#1565C0,#1976d2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(21,101,192,0.35)",
          }}>
            <EngineeringIcon sx={{ color: "#fff", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: "#0F172A", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
              Employee Management
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.3 }}>
              C-Tech Engineering · Admin Portal
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} size="large" sx={{ px: 3, py: 1.3 }}>
          Create Employee
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Paper elevation={0} sx={{
              borderRadius: 3, border: "1px solid #E2E8F0", p: "18px 22px",
              borderTop: `4px solid ${s.border}`, background: "#fff",
              transition: "box-shadow .2s, transform .2s",
              "&:hover": { boxShadow: `0 8px 28px ${alpha(s.color, 0.15)}`, transform: "translateY(-2px)" },
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontSize: 34, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, mt: 0.5 }}>{s.label}</Typography>
                </Box>
                <Box sx={{ width: 46, height: 46, borderRadius: 2.5, background: alpha(s.color, 0.08), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
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
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#94a3b8" }} /></InputAdornment>,
          sx: { background: "#fff", borderRadius: "12px" },
        }}
        sx={{ mb: 2.5 }}
        size="small"
      />

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920, fontFamily: "'DM Sans',sans-serif" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #F1F5F9" }}>
                {["Photo","Employee ID","Full Name","Designation","Department","Contact","Status","Experience","Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "13px 16px",
                    textAlign: h === "Actions" ? "center" : "left",
                    fontSize: 11, fontWeight: 700, color: "#94a3b8",
                    letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "60px 20px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <PeopleAltIcon sx={{ fontSize: 48, color: "#CBD5E1" }} />
                      <Typography sx={{ color: "#94a3b8", fontWeight: 500 }}>
                        {employees.length === 0
                          ? 'No employees yet. Click "Create Employee" to add one.'
                          : "No results found."}
                      </Typography>
                    </Box>
                  </td>
                </tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id}
                  style={{ borderBottom: "1px solid #F8FAFC", transition: "background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FBFF"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ padding: "14px 16px" }}>
                    <Avatar src={emp.photoURL}
                      sx={{ width: 38, height: 38, border: "2px solid #E2E8F0", background: "#DBEAFE", color: "#1565C0", fontWeight: 700, fontSize: 15 }}>
                      {!emp.photoURL && (emp.fullName || "?")[0]}
                    </Avatar>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Chip label={emp.employeeId} size="small"
                      sx={{ fontFamily: "monospace", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12, border: "1px solid #BFDBFE" }} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{emp.fullName}</Typography>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>{emp.designation}</td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>{emp.department}</td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>{emp.contactNumber}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <Chip
                      label={emp.status || "Active"} size="small"
                      icon={emp.status === "Active"
                        ? <CheckCircleIcon style={{ fontSize: 13 }} />
                        : <PauseCircleIcon style={{ fontSize: 13 }} />}
                      sx={{
                        background: emp.status === "Active" ? "#DCFCE7" : "#FEF3C7",
                        color: emp.status === "Active" ? "#166534" : "#92400E",
                        fontWeight: 700,
                        "& .MuiChip-icon": { color: emp.status === "Active" ? "#16a34a" : "#d97706" },
                      }}
                    />
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>
                    {calcExperience(emp.joiningDate) || "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Box sx={{ display: "flex", gap: 0.75, justifyContent: "center" }}>
                      <Tooltip title="View Profile" arrow>
                        <IconButton size="small" onClick={() => onView(emp)}
                          sx={{ background: alpha("#2196F3", 0.08), color: "#2196F3", borderRadius: "8px", "&:hover": { background: alpha("#2196F3", 0.16) } }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit" arrow>
                        <IconButton size="small" onClick={() => onEdit(emp)}
                          sx={{ background: alpha("#f59e0b", 0.08), color: "#d97706", borderRadius: "8px", "&:hover": { background: alpha("#f59e0b", 0.16) } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Barcode & QR" arrow>
                        <IconButton size="small" onClick={() => onBarcode(emp)}
                          sx={{ background: alpha("#8b5cf6", 0.08), color: "#7C3AED", borderRadius: "8px", "&:hover": { background: alpha("#8b5cf6", 0.16) } }}>
                          <QrCodeScannerIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton size="small" onClick={() => onDelete(emp)}
                          sx={{ background: alpha("#ef4444", 0.08), color: "#dc2626", borderRadius: "8px", "&:hover": { background: alpha("#ef4444", 0.16) } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid #F1F5F9", background: "#FAFBFC" }}>
          <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center" }}>
            Showing {filtered.length} of {employees.length} employees · C-Tech Engineering Employee Management System
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM DIALOG (same as before, keep it)
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2, pb: 1.5, borderBottom: "2px solid #F1F5F9" }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {React.cloneElement(icon, { sx: { color: "#1565C0", fontSize: 18 } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{title}</Typography>
        <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.2 }}>{subtitle}</Typography>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined}
      TransitionComponent={SlideUp} fullWidth maxWidth="md" scroll="paper">

      {/* Dialog Header */}
      <Box sx={{ background: "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)", px: 3.5, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isEdit ? <EditIcon sx={{ color: "#fff", fontSize: 20 }} /> : <AddIcon sx={{ color: "#fff", fontSize: 20 }} />}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
              {isEdit ? "Edit Employee" : "Create Employee"}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)" }}>
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
        <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>

          {error && (
            <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: 2, fontWeight: 500 }}>
              {error}
            </Alert>
          )}

          {/* Photo Upload */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PersonIcon />} title="Employee Photo" subtitle="Upload a clear passport-size photo" />
            <Box
              sx={{
                border: `2px dashed ${dragOver ? "#1565C0" : "#BFDBFE"}`,
                borderRadius: 3, p: 2.5, display: "flex", alignItems: "center", gap: 2.5,
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
                sx={{ width: 76, height: 76, border: "3px solid #1565C0", background: "#DBEAFE", color: "#1565C0", fontSize: 28, fontWeight: 700 }}>
                {!imagePreview && <CloudUploadIcon sx={{ fontSize: 30, color: "#93c5fd" }} />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  {imagePreview ? "Photo selected — click to change" : "Drag & drop or click to upload"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}>JPG, PNG, WEBP · Max 5 MB</Typography>
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

          {/* Identity & Role */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<BadgeIcon />} title="Identity & Role" subtitle="Employee ID, designation and department" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Employee ID" name="employeeId" required placeholder="EMP-2024-0001" value={form.employeeId} onChange={set} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Full Name" name="fullName" required placeholder="Rajesh Kumar" value={form.fullName} onChange={set} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Designation" name="designation" required placeholder="Senior Structural Engineer" value={form.designation} onChange={set} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Department" name="department" required placeholder="Civil & Structural Division" value={form.department} onChange={set} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Employment Status</InputLabel>
                  <Select name="status" value={form.status} label="Employment Status" onChange={set} sx={{ borderRadius: "10px" }}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Joining & Experience */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<CalendarTodayIcon />} title="Joining & Work Experience" subtitle="Experience auto-calculated from joining date" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Date of Joining" name="joiningDate" required type="date" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={set} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Work Shift" name="workShift" placeholder="8:00 AM – 5:30 PM" value={form.workShift} onChange={set} /></Grid>
              <Grid item xs={12} sm={4}>
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
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<PhoneIcon />} title="Contact Information" subtitle="Mobile, email and site location" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Mobile Number" name="contactNumber" required placeholder="+91 98400 55123" value={form.contactNumber} onChange={set} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Work Email" name="email" required placeholder="name@ctech-engg.in" value={form.email} onChange={set} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Work Location" name="location" placeholder="Chennai, Tamil Nadu" value={form.location} onChange={set} /></Grid>
            </Grid>
          </Paper>

          {/* Medical & Emergency */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #FEE2E2", background: "#FFFBFB" }}>
            <SectionLabel icon={<FavoriteIcon />} title="Medical & Emergency" subtitle="Blood group and emergency contact" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Blood Group" name="bloodGroup" placeholder="B+ / O-" value={form.bloodGroup} onChange={set} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Emergency Contact Name" name="emergencyContact" placeholder="Priya Kumar (Spouse)" value={form.emergencyContact} onChange={set} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Emergency Phone" name="emergencyPhone" placeholder="+91 94450 22876" value={form.emergencyPhone} onChange={set} /></Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <SectionLabel icon={<NoteAltIcon />} title="Additional Notes" subtitle="Certifications, remarks or special instructions" />
            <TextField fullWidth multiline minRows={3} name="notes" label="Notes"
              placeholder="e.g. Holds PMP certification, site safety trained…"
              value={form.notes} onChange={set} />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #F1F5F9", gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}
          sx={{ borderColor: "#E2E8F0", color: "#475569", "&:hover": { background: "#F1F5F9" } }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <VerifiedUserIcon />}
          sx={{ minWidth: 180 }}>
          {loading ? "Saving…" : isEdit ? "Update Employee" : "Create & Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW PROFILE DIALOG (same as before, keep it)
// ══════════════════════════════════════════════════════════════════════════════
function ViewProfileDialog({ open, employee, onClose, onEdit }) {
  const emp = employee;

  const InfoRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <Box sx={{
        display: "flex", alignItems: "flex-start", gap: 1.5,
        py: 1.25, borderBottom: "1px solid #F8FAFC", "&:last-child": { borderBottom: "none" },
      }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.25 }}>
          {React.cloneElement(icon, { sx: { color: "#1565C0", fontSize: 16 } })}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", mb: 0.3 }}>{label}</Typography>
          <Typography sx={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500 }}>{value}</Typography>
        </Box>
      </Box>
    );
  };

  if (!emp) return null;
  const isActive = emp.status === "Active";

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={SlideUp} fullWidth maxWidth="sm" scroll="paper">

      {/* Hero */}
      <Box sx={{ background: "linear-gradient(145deg,#0052CC 0%,#0A3A7A 55%,#091E42 100%)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%,rgba(255,255,255,0.05) 0%,transparent 60%)" }} />
        <Box sx={{ position: "relative", zIndex: 2, pt: 4, pb: 5, px: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <IconButton onClick={onClose}
            sx={{ position: "absolute", top: 12, right: 12, color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon />
          </IconButton>
          <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={<Box sx={{ width: 18, height: 18, borderRadius: "50%", background: isActive ? "#22c55e" : "#f59e0b", border: "2px solid #0052CC" }} />}>
            <Avatar src={emp.photoURL}
              sx={{ width: 86, height: 86, border: "3px solid rgba(255,255,255,0.3)", background: "linear-gradient(135deg,#1e40af,#0052cc)", fontSize: 30, fontWeight: 700, color: "#fff" }}>
              {!emp.photoURL && (emp.fullName || "?")[0]}
            </Avatar>
          </Badge>
          <Typography sx={{ fontSize: 21, fontWeight: 800, color: "#fff", mt: 1.5, mb: 0.5 }}>{emp.fullName}</Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.65)", mb: 1.5 }}>
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
            {emp.location && (
              <Chip label={emp.location} size="small"
                sx={{ background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 11 }} />
            )}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, background: "#F8FAFC" }}>
        <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Verified strip */}
          <Paper elevation={0} sx={{ p: 1.75, borderRadius: 2.5, border: "1px solid #86EFAC", background: "#F0FDF4", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <VerifiedUserIcon sx={{ color: "#16a34a", fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#166534" }}>Identity Verified</Typography>
              <Typography sx={{ fontSize: 11.5, color: "#4ade80" }}>Authenticated via C-Tech QR Code</Typography>
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
                  <Typography sx={{ fontSize: 17, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", mt: 0.5 }}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Contact */}
          <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Contact Information</Typography>
            <InfoRow icon={<PhoneIcon />}     label="Mobile"     value={emp.contactNumber} />
            <InfoRow icon={<EmailIcon />}     label="Work Email" value={emp.email} />
            <InfoRow icon={<LocationOnIcon />}label="Location"   value={emp.location} />
            <InfoRow icon={<AccessTimeIcon />}label="Work Shift" value={emp.workShift} />
          </Paper>

          {/* Employment */}
          <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Employment Details</Typography>
            <InfoRow icon={<WorkIcon />}          label="Department"      value={emp.department} />
            <InfoRow icon={<BadgeIcon />}          label="Designation"     value={emp.designation} />
            <InfoRow icon={<CalendarTodayIcon />}  label="Date of Joining" value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : ""} />
            <InfoRow icon={<AccessTimeIcon />}     label="Work Experience" value={calcExperience(emp.joiningDate)} />
          </Paper>

          {(emp.bloodGroup || emp.emergencyContact) && (
            <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2.5, border: "1px solid #FECACA", background: "#FFF5F5" }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Medical & Emergency</Typography>
              <InfoRow icon={<FavoriteIcon />}label="Blood Group"       value={emp.bloodGroup} />
              <InfoRow icon={<PersonIcon />}  label="Emergency Contact" value={emp.emergencyContact} />
              <InfoRow icon={<PhoneIcon />}   label="Emergency Phone"   value={emp.emergencyPhone} />
            </Paper>
          )}

          {emp.notes && (
            <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff" }}>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", mb: 1 }}>Notes</Typography>
              <Typography sx={{ fontSize: 13, color: "#475569", lineHeight: 1.75 }}>{emp.notes}</Typography>
            </Paper>
          )}

          {/* Footer brand */}
          <Box sx={{ background: "linear-gradient(135deg,#0052cc,#091e42)", borderRadius: 3, p: 2.5, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.75 }}>
              <EngineeringIcon sx={{ color: "#fff", fontSize: 18 }} />
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "2px" }}>C-TECH ENGINEERING</Typography>
            </Box>
            <Box sx={{ width: 36, height: 1, background: "rgba(255,255,255,0.2)", mx: "auto", my: 1 }} />
            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px" }}>BUILDING TRUST. DELIVERING EXCELLENCE.</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, borderTop: "1px solid #F1F5F9", gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: "#E2E8F0", color: "#475569" }}>Close</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(emp)}>Edit Employee</Button>
      </DialogActions>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BARCODE & QR DIALOG (UPDATED with navigation)
// ══════════════════════════════════════════════════════════════════════════════
function BarcodeDialog({ open, employee, onClose, onSnack }) {
  const canvasRef  = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [barcodeError, setBarcodeError] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    setRendered(false);
    setBarcodeError(false);
    if (!open || !employee?.employeeId) return;
    
    // Set the profile URL using employeeId
    const url = `${window.location.origin}/#/employee/profile/${employee.employeeId}`;
    setProfileUrl(url);
    
    // Generate QR Code
    generateQRCode(employee.employeeId).then(setQrCodeUrl);
    
    // Render barcode
    const t = setTimeout(() => {
      if (canvasRef.current) {
        const ok = renderBarcode(canvasRef.current, employee.employeeId);
        if (ok) setRendered(true);
        else setBarcodeError(true);
      }
    }, 80);
    return () => clearTimeout(t);
  }, [open, employee]);

  // Function to copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      if (onSnack) onSnack("Profile link copied to clipboard!", "success");
    } catch (err) {
      if (onSnack) onSnack("Failed to copy link", "error");
    }
  };

  // Function to open profile in new tab
  const openProfile = () => {
    window.open(profileUrl, "_blank");
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={SlideUp} maxWidth="sm" fullWidth>

      {/* Header */}
      <Box sx={{ background: "linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%)", px: 3, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "9px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCodeScannerIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Employee Barcode & QR Code</Typography>
            <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)" }}>{employee.fullName} · {employee.employeeId}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ textAlign: "center", py: 3, px: 3, background: "#F8FAFC" }}>
        
        {/* QR Code Section */}
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#475569", mb: 1.5 }}>
            📱 Scan QR Code to Open Profile
          </Typography>
          {qrCodeUrl ? (
            <Box sx={{ 
              background: "#fff", 
              p: 1.5, 
              borderRadius: 2, 
              display: "inline-block",
              border: "2px solid #EDE9FE"
            }}>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ width: 180, height: 180, display: "block" }}
              />
            </Box>
          ) : (
            <CircularProgress size={40} sx={{ color: "#7C3AED" }} />
          )}
          <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 1.5 }}>
            Scan with any QR reader to view employee profile
          </Typography>
        </Paper>

        {/* Barcode Section */}
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#475569", mb: 1.5 }}>
            🔖 Barcode (CODE128 Format)
          </Typography>
          <Box sx={{
            background: "#fff", border: "2px solid #EDE9FE", borderRadius: 2,
            p: 1.5, display: "flex", justifyContent: "center",
            minHeight: 120, alignItems: "center",
          }}>
            {barcodeError ? (
              <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                Unable to render barcode for: <strong>{employee.employeeId}</strong>
              </Typography>
            ) : (
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: "100%", display: "block",
                  opacity: rendered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                }}
              />
            )}
            {!rendered && !barcodeError && (
              <CircularProgress size={28} sx={{ color: "#7C3AED", position: "absolute" }} />
            )}
          </Box>
          <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 1.5 }}>
            Barcode contains Employee ID: <strong>{employee.employeeId}</strong>
          </Typography>
        </Paper>

        {/* Employee Info */}
        <Paper elevation={0} sx={{ background: "#F5F3FF", borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#5B21B6" }}>{employee.fullName}</Typography>
          <Typography sx={{ fontSize: 12, color: "#7C3AED", mt: 0.3 }}>{employee.designation} · {employee.department}</Typography>
        </Paper>

        {/* Profile URL Section */}
        <Paper elevation={0} sx={{ 
          background: "#F0FDF4", 
          borderRadius: 2, 
          p: 1.5, 
          border: "1px solid #86EFAC",
          cursor: "pointer",
          "&:hover": { background: "#DCFCE7" }
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#166534", mb: 0.5 }}>
            🔗 Employee Profile Link
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
            <Typography sx={{ fontSize: 11, fontFamily: "monospace", color: "#166534", wordBreak: "break-all" }}>
              {profileUrl}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 10, color: "#4ade80", mt: 0.5 }}>
            Click below to open or copy this link
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, background: "#fff", borderTop: "1px solid #F1F5F9" }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: "#E2E8F0", color: "#475569" }}>
          Close
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<ContentCopyIcon />}
          onClick={copyToClipboard}
          sx={{ borderColor: "#7C3AED", color: "#7C3AED" }}
        >
          Copy Link
        </Button>
        <Button 
          variant="contained" 
          startIcon={<OpenInNewIcon />}
          onClick={openProfile}
          sx={{
            background: "linear-gradient(135deg,#7C3AED,#5B21B6)",
            "&:hover": { background: "linear-gradient(135deg,#6D28D9,#4C1D95)" },
            boxShadow: "0 4px 14px rgba(124,58,237,0.35)"
          }}
        >
          Open Profile
        </Button>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />}
          onClick={() => downloadQRCode(employee.employeeId)}
          sx={{
            background: "linear-gradient(135deg,#059669,#047857)",
            "&:hover": { background: "linear-gradient(135deg,#047857,#065F46)" },
          }}
        >
          Download QR
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
      <DialogContent sx={{ textAlign: "center", pt: 4, pb: 2, px: 3 }}>
        <Box sx={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
          <DeleteIcon sx={{ color: "#dc2626", fontSize: 30 }} />
        </Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Delete Employee?</Typography>
        <Typography sx={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7 }}>
          This will permanently remove{" "}
          <strong style={{ color: "#0F172A" }}>{employee.fullName}</strong>{" "}
          ({employee.employeeId}) from Firebase. This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
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