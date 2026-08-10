import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  TableContainer,
  Tooltip,
  Grid,
  Avatar,
  InputAdornment,
  Stack,
  styled,
  alpha,
  FormControl,
  InputLabel,
  Select,
  Menu,
  Collapse,
  GlobalStyles,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Groups,
  Person,
  MoreVert as MoreVertIcon,
  ChecklistRtl,
  CloudUpload as CloudUploadIcon,
  PauseCircle,
  BlockOutlined as BlockCircle,
  TrendingUp,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from "@mui/icons-material";
import { auth, db } from "../Config";
import { API_BASE_URL } from "../Config";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Shared design tokens — same palette/type used across Todo, Timesheet,
// Header, Sidebar, Notifications and Profile. Worth lifting into a single
// `theme/tokens.js` file so all pages stay in lockstep.
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
          active
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

// Status / role / work-mode color maps — drive chip colors consistently.
const STATUS_COLOR = { 
  active: COLORS.success, 
  Active: COLORS.success,
  inactive: COLORS.muted, 
  Inactive: COLORS.muted, 
  "on hold": COLORS.warning, 
  "On Hold": COLORS.warning 
};
const ROLE_COLOR = { Admin: COLORS.danger, TeamLead: COLORS.warning, Employee: COLORS.primary };

// Helper function to normalize status for comparison
const normalizeStatus = (status) => {
  if (!status) return 'active';
  const normalized = status.toLowerCase().trim();
  if (normalized === 'on hold') return 'on hold';
  if (normalized === 'inactive') return 'inactive';
  return 'active';
};

// Helper function to get display status
const getDisplayStatus = (status) => {
  if (!status) return 'Active';
  const normalized = status.toLowerCase().trim();
  if (normalized === 'on hold') return 'On Hold';
  if (normalized === 'inactive') return 'Inactive';
  return 'Active';
};

const getStatusColor = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_COLOR[normalized] || COLORS.muted;
};

const getRoleColor = (role) => ROLE_COLOR[role] || COLORS.primary;

const getWorkModeColor = (mode) => {
  const m = mode?.toLowerCase() || '';
  if (m.includes('office')) return COLORS.primary;
  if (m.includes('home')) return COLORS.success;
  if (m.includes('hybrid')) return COLORS.warning;
  return COLORS.muted;
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

const RoleChip = styled(Chip)(({ role }) => {
  const color = getRoleColor(role);
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

const ProfileImageUpload = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '200px',
  border: `2px dashed ${alpha(COLORS.primary, 0.3)}`,
  borderRadius: '14px',
  backgroundColor: alpha(COLORS.primary, 0.05),
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  '&:hover': {
    backgroundColor: alpha(COLORS.primary, 0.09),
    borderColor: COLORS.primary,
  },
});

// Status options with colors
const statusOptions = [
  { value: "Active", label: "Active", color: COLORS.success, icon: ChecklistRtl },
  { value: "Inactive", label: "Inactive", color: COLORS.muted, icon: PauseCircle },
  { value: "On Hold", label: "On Hold", color: COLORS.warning, icon: BlockCircle },
];

const initialForm = {
  empId: "",
  doj: "",
  gender: "",
  name: "",
  designation: "",
  department: "",
  email: "",
  workMode: "",
  totalHours: "",
  password: "",
  role: "Employee",
  status: "Active",
  profileImgFile: null,
  profileImgChanged: false,
};

const workModeOptions = [
  "Work From Office",
  "Work From Home",
  "Hybrid",
];

const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Employee", label: "Employee" },
  { value: "TeamLead", label: "Team Lead" },
];

const genderOptions = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];

// Helper function to get image URL
const getImageUrl = (profileData) => {
  if (!profileData) return "";

  if (typeof profileData === 'string') {
    if (profileData.startsWith('http')) {
      return profileData;
    }
    if (profileData.startsWith('data:image') || profileData.length > 100) {
      return profileData;
    }
    return "";
  }

  if (typeof profileData === 'object' && profileData !== null) {
    if (profileData.profile_img_url && profileData.profile_img_url.startsWith('http')) {
      return profileData.profile_img_url;
    }
    if (profileData.profile_img) {
      if (profileData.profile_img.startsWith('http')) {
        return profileData.profile_img;
      }
      if (typeof profileData.profile_img === 'string' &&
          (profileData.profile_img.startsWith('data:image') || profileData.profile_img.length > 100)) {
        return profileData.profile_img;
      }
    }
    return "";
  }

  return "";
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedRowForMenu, setSelectedRowForMenu] = useState(null);
  const actionMenuOpen = Boolean(actionMenuAnchorEl);

  // Export menu state
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
  const exportMenuOpen = Boolean(exportMenuAnchorEl);

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

  /* ================= HANDLE IMAGE UPLOAD ================= */
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPEG, PNG, GIF)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);

      setForm(prev => ({
        ...prev,
        profileImgFile: file,
        profileImgChanged: true
      }));

      showToast('Image selected successfully. It will be uploaded when you save the user.', 'info');
    } catch (error) {
      console.error('Error processing image:', error);
      showToast('Error processing image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  /* ================= REMOVE IMAGE ================= */
  const handleRemoveImage = () => {
    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImagePreview("");
    setForm(prev => ({
      ...prev,
      profileImgFile: null,
      profileImgChanged: true
    }));
  };

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setFetching(true);
    try {
      console.log('📤 Fetching users from:', `${API_BASE_URL}employees`);

      const response = await fetch(`${API_BASE_URL}employees`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Fetch error response:', errorText);
        throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
      }
      const pgData = await response.json();
      console.log('📥 Received employees data:', pgData);

      const fbSnap = await getDocs(collection(db, "users"));
      const fbData = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const combinedUsers = pgData.map((pgUser) => {
        const fbUser = fbData.find((fb) => fb.email === pgUser.email);
        return {
          ...pgUser,
          uid: fbUser?.uid,
          role: fbUser?.role || "Employee",
          // Normalize status for display
          status: pgUser.status || "Active",
          pgId: pgUser.id,
        };
      });

      setUsers(combinedUsers);

      const uniqueDepts = [...new Set(combinedUsers.map(user => user.department).filter(Boolean))];
      setDepartments(uniqueDepts);

      showToast(`Loaded ${combinedUsers.length} users successfully!`, "success");
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast(`Failed to load users: ${err.message}`, "error");
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= FORM CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= CREATE USER ================= */
  const handleCreateUser = async () => {
    if (
      !form.empId ||
      !form.name ||
      !form.email ||
      !form.password ||
      !form.doj
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = res.user.uid;

      console.log('📤 Creating user with status:', form.status);

      const pgResponse = await fetch(`${API_BASE_URL}employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          emp_id: form.empId,
          employee_name: form.name,
          gender: form.gender,
          date_of_joining: form.doj,
          designation: form.designation,
          department: form.department,
          email: form.email,
          work_mode: form.workMode,
          total_hours: form.totalHours,
          password: form.password,
          status: form.status,
        }),
      });

      if (!pgResponse.ok) {
        const errorData = await pgResponse.json().catch(() => ({}));
        console.error('❌ Create error:', errorData);
        throw new Error(errorData.error || "Failed to create employee in PostgreSQL");
      }

      const createdEmployee = await pgResponse.json();
      console.log('✅ Employee created:', createdEmployee);

      let profileImageUrl = null;
      if (form.profileImgFile) {
        try {
          const formData = new FormData();
          formData.append('profile_img', form.profileImgFile);

          const encodedEmail = encodeURIComponent(form.email);
          const uploadResponse = await fetch(`${API_BASE_URL}profile/image/${encodedEmail}`, {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            profileImageUrl = uploadResult.data?.profile_img_url || uploadResult.data?.profile_img;
          }
        } catch (uploadError) {
          console.error('Error uploading profile image:', uploadError);
        }
      }

      const firestoreData = {
        uid,
        empId: form.empId,
        name: form.name,
        email: form.email,
        gender: form.gender,
        designation: form.designation,
        department: form.department,
        workMode: form.workMode,
        totalHours: form.totalHours,
        role: form.role,
        status: form.status,
        profileImgUrl: profileImageUrl,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", uid), firestoreData);

      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setOpen(false);
      setForm(initialForm);
      setProfileImagePreview("");
      fetchUsers();
      showToast("User created successfully!", "success");
    } catch (err) {
      console.error("Error creating user:", err);
      showToast(err.message || "Error creating user", "error");
    }
    setLoading(false);
  };

  /* ================= UPDATE USER ================= */
  const handleUpdateUser = async () => {
    if (!editing) return;

    setLoading(true);
    try {
      const updateData = {
        employee_name: form.name,
        gender: form.gender,
        department: form.department,
        designation: form.designation,
        work_mode: form.workMode,
        total_hours: form.totalHours,
        status: form.status,
      };

      console.log('📤 Updating user with data:', updateData);
      console.log('📤 API URL:', `${API_BASE_URL}employees/${editing.pgId}`);

      const updateResponse = await fetch(`${API_BASE_URL}employees/${editing.pgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(updateData),
      });

      const responseText = await updateResponse.text();

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!updateResponse.ok) {
        console.error('❌ Update error response:', responseData);
        throw new Error(responseData.error || "Failed to update employee");
      }

      console.log('✅ Update successful:', responseData);

      let updatedProfileImageUrl = editing.profile_img_url || editing.profile_img;
      if (form.profileImgFile && form.profileImgChanged) {
        try {
          const formData = new FormData();
          formData.append('profile_img', form.profileImgFile);

          const encodedEmail = encodeURIComponent(editing.email);
          const uploadResponse = await fetch(`${API_BASE_URL}profile/image/${encodedEmail}`, {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            updatedProfileImageUrl = uploadResult.data?.profile_img_url || uploadResult.data?.profile_img;
            showToast('Profile image updated successfully!', 'success');
          }
        } catch (uploadError) {
          console.error('Error uploading profile image:', uploadError);
          showToast('Failed to update profile image, keeping existing one', 'warning');
        }
      }

      if (editing.uid) {
        const firestoreUpdateData = {
          name: form.name,
          department: form.department,
          designation: form.designation,
          workMode: form.workMode,
          totalHours: form.totalHours,
          role: form.role,
          gender: form.gender,
          status: form.status,
        };

        if (form.profileImgChanged && updatedProfileImageUrl) {
          firestoreUpdateData.profileImgUrl = updatedProfileImageUrl;
        }

        console.log('📤 Updating Firestore with:', firestoreUpdateData);
        await updateDoc(doc(db, "users", editing.uid), firestoreUpdateData);
      }

      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setProfileImagePreview("");
      await fetchUsers();
      showToast("User updated successfully!", "success");

    } catch (err) {
      console.error("❌ Error updating user:", err);
      showToast(err.message || "Error updating user", "error");
    }
    setLoading(false);
  };

  /* ================= DELETE USER ================= */
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.employee_name}?`)) {
      return;
    }

    try {
      if (user.profile_img_url) {
        try {
          const encodedEmail = encodeURIComponent(user.email);
          await fetch(`${API_BASE_URL}profile/image/${encodedEmail}`, {
            method: 'DELETE'
          });
        } catch (imgError) {
          console.warn('Error deleting profile image:', imgError);
        }
      }

      if (user.uid) {
        await deleteDoc(doc(db, "users", user.uid));
      }

      const deleteResponse = await fetch(`${API_BASE_URL}employees/${user.pgId}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete employee");
      }

      fetchUsers();
      showToast("User deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast(err.message || "Error deleting user", "error");
    }
  };

  /* ================= EDIT OPEN ================= */
  const handleEdit = (user) => {
    setEditing(user);
    const existingProfileImgUrl = getImageUrl(user);

    setForm({
      empId: user.emp_id,
      doj: user.date_of_joining?.split("T")[0] || "",
      name: user.employee_name,
      email: user.email,
      gender: user.gender || "",
      department: user.department || "",
      designation: user.designation || "",
      workMode: user.work_mode || "",
      totalHours: user.total_hours || "",
      role: user.role || "Employee",
      status: getDisplayStatus(user.status), // Normalize status for display
      profileImgFile: null,
      profileImgChanged: false,
    });

    if (existingProfileImgUrl) {
      setProfileImagePreview(existingProfileImgUrl);
    } else {
      setProfileImagePreview("");
    }

    setOpen(true);
  };

  /* ================= ACTION MENU HANDLERS ================= */
  const handleActionMenuOpen = (event, user) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedRowForMenu(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedRowForMenu(null);
  };

  const handleEditFromMenu = () => {
    if (selectedRowForMenu) {
      handleEdit(selectedRowForMenu);
      handleActionMenuClose();
    }
  };

  const handleDeleteFromMenu = () => {
    if (selectedRowForMenu) {
      handleDeleteUser(selectedRowForMenu);
      handleActionMenuClose();
    }
  };

  /* ================= EXPORT FUNCTIONS ================= */
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchorEl(null);
  };

  // Export to PDF (Landscape)
  const exportToPDF = () => {
    try {
      const exportData = filteredUsers.length > 0 ? filteredUsers : users;

      if (exportData.length === 0) {
        showToast('No users to export!', 'warning');
        return;
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');

      // ===== COLOR PALETTE (matches the app's indigo theme) =====
      const PDF_COLORS = {
        primary: [79, 70, 229],         // Indigo #4F46E5
        text: [30, 27, 46],             // Ink
        lightText: [107, 114, 128],     // Muted gray
        border: [229, 231, 235],        // Light gray
        rowAlt: [246, 247, 251],        // Very light gray
        white: [255, 255, 255],
        active: [16, 185, 129],         // Success
        onHold: [245, 158, 11],         // Warning
        inactive: [239, 68, 68],        // Danger
      };

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const MARGIN = { top: 12, right: 12, bottom: 15, left: 12 };
      const CONTENT_WIDTH = pageWidth - MARGIN.left - MARGIN.right;

      let currentY = MARGIN.top;

      doc.setFontSize(18);
      doc.setTextColor(...PDF_COLORS.text);
      doc.setFont('helvetica', 'bold');
      doc.text('User Management Report', MARGIN.left, currentY);

      doc.setFontSize(10);
      doc.setTextColor(...PDF_COLORS.lightText);
      doc.setFont('helvetica', 'normal');
      doc.text('Employee Directory and Access Control', MARGIN.left, currentY + 5);

      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.lightText);
      const currentDate = new Date().toLocaleString();
      doc.text(`Generated: ${currentDate}`, pageWidth - MARGIN.right, currentY, { align: 'right' });
      doc.text(`Total Records: ${exportData.length}`, pageWidth - MARGIN.right, currentY + 5, { align: 'right' });

      currentY += 14;

      // Calculate stats using normalized status
      const activeCount = exportData.filter(u => normalizeStatus(u.status) === 'active').length;
      const onHoldCount = exportData.filter(u => normalizeStatus(u.status) === 'on hold').length;
      const inactiveCount = exportData.filter(u => normalizeStatus(u.status) === 'inactive').length;

      const stats = [
        { label: 'Active Users', value: activeCount.toString(), borderColor: PDF_COLORS.active },
        { label: 'On Hold', value: onHoldCount.toString(), borderColor: PDF_COLORS.onHold },
        { label: 'Inactive', value: inactiveCount.toString(), borderColor: PDF_COLORS.inactive },
        { label: 'Total Users', value: exportData.length.toString(), borderColor: PDF_COLORS.primary },
      ];

      const statBoxWidth = CONTENT_WIDTH / 4 - 1.5;
      const statBoxHeight = 16;
      const statBoxY = currentY;

      stats.forEach((stat, index) => {
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
        doc.text(stat.label, boxX + 3, statBoxY + 3.5);

        doc.setFontSize(12);
        doc.setTextColor(...stat.borderColor);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, boxX + 3, statBoxY + 11);
      });

      currentY = statBoxY + statBoxHeight + 7;

      const tableColumn = ["S.No", "Emp ID", "Name", "Email", "Department", "Designation", "Status", "Role", "Work Mode", "Hours"];
      const tableRows = [];

      exportData.forEach((user, index) => {
        tableRows.push([
          (index + 1).toString(),
          user.emp_id || '-',
          user.employee_name || '-',
          user.email || '-',
          user.department || '-',
          user.designation || '-',
          getDisplayStatus(user.status), // Use normalized display status
          user.role || 'Employee',
          user.work_mode || '-',
          user.total_hours || '0'
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',

        columnStyles: {
          0: { cellWidth: 13, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'left' },
          3: { cellWidth: 40, halign: 'left' },
          4: { cellWidth: 40, halign: 'left' },
          5: { cellWidth: 35, halign: 'left' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 20, halign: 'center' },
          8: { cellWidth: 30, halign: 'center' },
          9: { cellWidth: 18, halign: 'center' },
        },

        headStyles: {
          fillColor: PDF_COLORS.primary,
          textColor: PDF_COLORS.white,
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
          lineColor: PDF_COLORS.primary,
          lineWidth: 0.1
        },

        bodyStyles: {
          fontSize: 8,
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
          if (data.column.index === 6) {
            const cellText = data.cell.text[0] || '';
            const statusLower = cellText.toLowerCase().trim();

            if (statusLower === 'on hold') {
              data.cell.textColor = PDF_COLORS.onHold;
              data.cell.fontStyle = 'normal';
            } else if (statusLower === 'inactive') {
              data.cell.textColor = PDF_COLORS.inactive;
              data.cell.fontStyle = 'normal';
            } else if (statusLower === 'active') {
              data.cell.textColor = PDF_COLORS.text;
              data.cell.fontStyle = 'normal';
            }
          }
        },

        margin: MARGIN,
        rowPageBreak: 'avoid',

        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();

          doc.setDrawColor(...PDF_COLORS.primary);
          doc.setLineWidth(0.5);
          doc.line(MARGIN.left, pageHeight - MARGIN.bottom - 5, pageWidth - MARGIN.right, pageHeight - MARGIN.bottom - 5);

          doc.setFontSize(7);
          doc.setTextColor(...PDF_COLORS.lightText);
          doc.setFont('helvetica', 'normal');

          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - MARGIN.bottom + 3,
            { align: 'center' }
          );

          doc.setFontSize(6);
          doc.text(
            '© User Management System - Confidential',
            MARGIN.left,
            pageHeight - MARGIN.bottom + 3
          );
        }
      });

      const fileName = `User_Management_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      showToast('PDF exported successfully!', 'success');
      handleExportMenuClose();

    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast('Error exporting PDF: ' + error.message, 'error');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredUsers.length > 0 ? filteredUsers : users;

      if (exportData.length === 0) {
        showToast('No users to export!', 'warning');
        return;
      }

      const excelData = exportData.map((user, index) => ({
        'S.No': index + 1,
        'Employee ID': user.emp_id || '-',
        'Name': user.employee_name || '-',
        'Email': user.email || '-',
        'Gender': user.gender || '-',
        'Date of Joining': user.date_of_joining || '-',
        'Department': user.department || '-',
        'Designation': user.designation || '-',
        'Status': getDisplayStatus(user.status), // Use normalized display status
        'Role': user.role || 'Employee',
        'Work Mode': user.work_mode || '-',
        'Total Hours': user.total_hours || '0'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const wscols = [
        { wch: 8 },
        { wch: 15 },
        { wch: 25 },
        { wch: 30 },
        { wch: 12 },
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 12 },
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'Users');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'user_management_report.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Excel exported successfully!', 'success');
      handleExportMenuClose();
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showToast('Error exporting Excel: ' + error.message, 'error');
    }
  };

  /* ================= FILTER FUNCTIONS ================= */
  const handleApplyFilters = () => {
    showToast("Filters applied successfully!", "info");
  };

  const handleClearFilters = () => {
    setSelectedDepartment("all");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSearchTerm("");
    showToast("Filters cleared!", "info");
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === "" ||
      user.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment;
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    
    // Normalize status for comparison
    const userStatusNormalized = normalizeStatus(user.status);
    const filterStatusNormalized = selectedStatus === "all" ? "all" : normalizeStatus(selectedStatus);
    const matchesStatus = selectedStatus === "all" || userStatusNormalized === filterStatusNormalized;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  // Stats calculations - using normalized status
  const totalUsers = users.length;
  const activeUsers = users.filter(u => normalizeStatus(u.status) === 'active').length;
  const inactiveUsers = users.filter(u => normalizeStatus(u.status) === 'inactive').length;
  const onHoldUsers = users.filter(u => normalizeStatus(u.status) === 'on hold').length;
  const totalAdmins = users.filter(u => u.role === "Admin").length;
  const totalHours = users.reduce((sum, user) => sum + (parseFloat(user.total_hours) || 0), 0);
  const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  // Handle dialog close
  const handleDialogClose = () => {
    if (!loading && !uploadingImage) {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setProfileImagePreview("");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <GlobalStyles styles={fontImport} />
      <Shell sx={{ px: { xs: 2, sm: 4 }, py: 3, bgcolor: COLORS.bg, minHeight: "100vh" }}>
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

        {/* Header */}
        <Surface sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: COLORS.ink }}>
                <Display>User management</Display>
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.muted, mt: 0.5 }}>
                Manage all employees and their information.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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

              <Tooltip title="Refresh users">
                <IconButton
                  onClick={fetchUsers}
                  disabled={fetching}
                  sx={{ bgcolor: COLORS.bg, color: COLORS.muted, border: `1px solid ${COLORS.border}`, "&:hover": { bgcolor: alpha(COLORS.primary, 0.12), color: COLORS.primary } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Button
                onClick={handleExportMenuOpen}
                startIcon={<PdfIcon />}
                variant="outlined"
                sx={{
                  borderColor: COLORS.border,
                  color: COLORS.muted,
                  borderRadius: "12px",
                  px: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) }
                }}
              >
                Export
              </Button>

              <GradientButton
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setEditing(null);
                  setForm(initialForm);
                  setProfileImagePreview("");
                  setOpen(true);
                }}
              >
                Create new user
              </GradientButton>
            </Box>
          </Box>

          {/* Export Menu */}
          <Menu
            anchorEl={exportMenuAnchorEl}
            open={exportMenuOpen}
            onClose={handleExportMenuClose}
            PaperProps={{ sx: { borderRadius: "14px", mt: 1, minWidth: 220 } }}
          >
            <MenuItem onClick={exportToPDF} sx={{ py: 1.5 }}>
              <PdfIcon sx={{ mr: 2, color: COLORS.danger }} />
              <Typography>Export to PDF (landscape)</Typography>
            </MenuItem>
            <MenuItem onClick={exportToExcel} sx={{ py: 1.5 }}>
              <ExcelIcon sx={{ mr: 2, color: COLORS.success }} />
              <Typography>Export to Excel</Typography>
            </MenuItem>
          </Menu>

          {/* Overview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, flexWrap: 'wrap', mb: 3 }}>
            <RadialProgress value={activeRate} color={COLORS.primary} />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
              <StatTile label="Total users" value={totalUsers} color={COLORS.primary} icon={<Groups fontSize="small" />} />
              <StatTile label="Active" value={activeUsers} color={COLORS.success} icon={<ChecklistRtl fontSize="small" />} />
              <StatTile label="On hold" value={onHoldUsers} color={COLORS.warning} icon={<BlockCircle fontSize="small" />} />
              <StatTile label="Inactive" value={inactiveUsers} color={COLORS.muted} icon={<PauseCircle fontSize="small" />} />
              <StatTile label="Admins" value={totalAdmins} color={COLORS.danger} icon={<Person fontSize="small" />} />
            </Box>
          </Box>

          {/* Search bar */}
          <TextField
            fullWidth
            placeholder="Search by name, email, ID, department, or designation…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

          {/* Filter section */}
          <Collapse in={showFilters}>
            <Divider sx={{ my: 2.5 }} />
            <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ fontSize: 18, color: COLORS.primary }} />
              Filter users
            </Typography>

            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={3} minWidth={200}>
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

              <Grid item xs={12} md={3} minWidth={200}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select value={selectedRole} label="Role" onChange={(e) => setSelectedRole(e.target.value)} sx={{ borderRadius: "10px", bgcolor: COLORS.bg }}>
                    <MenuItem value="all">All roles</MenuItem>
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3} minWidth={200}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={selectedStatus} label="Status" onChange={(e) => setSelectedStatus(e.target.value)} sx={{ borderRadius: "10px", bgcolor: COLORS.bg }}>
                    <MenuItem value="all">All status</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3} minWidth={200}>
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

            {(selectedDepartment !== "all" || selectedRole !== "all" || selectedStatus !== "all") && (
              <Typography variant="caption" sx={{ color: COLORS.muted, mt: 2, display: "block" }}>
                Active filters:
                {selectedDepartment !== "all" && ` Department = ${selectedDepartment}`}
                {selectedRole !== "all" && `, Role = ${selectedRole}`}
                {selectedStatus !== "all" && `, Status = ${selectedStatus}`}
              </Typography>
            )}
          </Collapse>
        </Surface>

        {/* Table */}
        <Surface sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 420px)", minHeight: 320 }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, width: 60, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>S.No</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Profile</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Emp ID</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Name</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Email</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Department</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Role</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}` }}>Work mode</TableCell>
                  <TableCell sx={{ bgcolor: COLORS.bg, fontWeight: 700, color: COLORS.ink, borderBottom: `2px solid ${alpha(COLORS.primary, 0.25)}`, width: 70 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <CircularProgress sx={{ color: COLORS.primary }} />
                      <Typography sx={{ mt: 2, color: COLORS.muted }}>Loading users…</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <SearchIcon sx={{ fontSize: 56, color: alpha(COLORS.muted, 0.3), mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.ink }}>
                        {searchTerm || selectedDepartment !== "all" || selectedRole !== "all" || selectedStatus !== "all" ? "No matching users found" : "No users found"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.muted }}>
                        {searchTerm || selectedDepartment !== "all" || selectedRole !== "all" || selectedStatus !== "all" ? "Try adjusting your search or filters." : "Click \"Create new user\" to add your first employee."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => {
                    const displayStatus = getDisplayStatus(user.status);
                    return (
                      <TableRow
                        key={user.pgId}
                        hover
                        sx={{ '&:hover': { bgcolor: alpha(COLORS.primary, 0.03) }, borderBottom: `1px solid ${COLORS.border}` }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: getStatusColor(user.status) }} />
                            {index + 1}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Avatar
                            src={getImageUrl(user)}
                            sx={{
                              width: 40,
                              height: 40,
                              border: `2px solid ${COLORS.primary}`,
                              bgcolor: getImageUrl(user) ? 'transparent' : alpha(COLORS.primary, 0.1),
                              color: getImageUrl(user) ? 'inherit' : COLORS.primary,
                              fontWeight: 'bold',
                            }}
                          >
                            {user.employee_name?.charAt(0) || "U"}
                          </Avatar>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, color: COLORS.ink }}>{user.emp_id}</TableCell>
                        <TableCell sx={{ fontWeight: 500, color: COLORS.ink }}>{user.employee_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: COLORS.muted }}>{user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip label={displayStatus} size="small" status={user.status} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.department || "-"}
                            size="small"
                            sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 600, borderRadius: "6px" }}
                          />
                        </TableCell>
                        <TableCell>
                          <RoleChip label={user.role || "Employee"} size="small" role={user.role} />
                        </TableCell>
                        <TableCell>
                          <WorkModeChip label={user.work_mode || "-"} size="small" mode={user.work_mode} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="More options">
                            <IconButton
                              size="small"
                              onClick={(event) => handleActionMenuOpen(event, user)}
                              sx={{ color: COLORS.muted, "&:hover": { bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary } }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <Box sx={{ p: 2, bgcolor: COLORS.bg, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, fontWeight: 500 }}>
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary, display: "flex", alignItems: "center", gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: "1.1rem" }} />
                Total hours: {totalHours.toFixed(1)}h
              </Typography>
            </Box>
          )}
        </Surface>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchorEl}
          open={actionMenuOpen}
          onClose={handleActionMenuClose}
          PaperProps={{ sx: { borderRadius: "14px", mt: 1, minWidth: 200 } }}
        >
          <MenuItem onClick={handleEditFromMenu} sx={{ py: 1.5 }}>
            <EditIcon sx={{ mr: 2, color: COLORS.primary }} />
            <Typography>Edit user</Typography>
          </MenuItem>
          <MenuItem onClick={handleDeleteFromMenu} sx={{ py: 1.5 }}>
            <DeleteIcon sx={{ mr: 2, color: COLORS.danger }} />
            <Typography>Delete user</Typography>
          </MenuItem>
        </Menu>

        {/* Create/Edit Dialog */}
        <Dialog
          open={open}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: "20px", overflow: 'hidden', boxShadow: '0 20px 60px rgba(16,24,40,0.25)' } }}
        >
          <Box sx={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, color: "white", p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <DialogTitle sx={{ p: 0, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              <PersonAddIcon sx={{ mr: 1.5 }} />
              <Display>{editing ? "Edit employee" : "Create new employee"}</Display>
            </DialogTitle>
            <Chip label={form.status} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }} />
          </Box>

          <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Profile Image Upload Section */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
              PROFILE IMAGE {!editing && "(OPTIONAL)"}
            </Typography>
            <Box sx={{ mb: 3, mt: 1 }}>
              {editing && form.profileImgChanged && (
                <Chip label="Image changed" size="small" sx={{ mb: 1, fontSize: '0.7rem', bgcolor: alpha(COLORS.warning, 0.12), color: COLORS.warning }} />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="profile-image-upload"
                disabled={uploadingImage}
              />
              <label htmlFor="profile-image-upload">
                <ProfileImageUpload sx={{
                  opacity: uploadingImage ? 0.7 : 1,
                  pointerEvents: uploadingImage ? 'none' : 'auto'
                }}>
                  {profileImagePreview ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img
                        src={profileImagePreview}
                        alt="Profile Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                      />
                      {!uploadingImage && (
                        <>
                          <IconButton
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: alpha(COLORS.danger, 0.85), color: 'white', '&:hover': { backgroundColor: COLORS.danger } }}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={(e) => { e.stopPropagation(); document.getElementById('profile-image-upload').click(); }}
                            sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: alpha(COLORS.primary, 0.85), color: 'white', '&:hover': { backgroundColor: COLORS.primary } }}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 44, color: COLORS.primary, mb: 1.5 }} />
                      <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 600 }}>
                        Click to upload profile image
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.muted }}>
                        Recommended: Square image, max 5MB
                      </Typography>
                    </>
                  )}
                </ProfileImageUpload>
              </label>
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
              EMPLOYEE DETAILS
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth label="Employee ID *" name="empId" value={form.empId} onChange={handleChange}
                disabled={!!editing} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth label="Email ID *" name="email" value={form.email} onChange={handleChange}
                type="email" disabled={!!editing} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth type="date" label="Date of joining *" name="doj" value={form.doj} onChange={handleChange}
                InputLabelProps={{ shrink: true }} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth select label="Gender" name="gender" value={form.gender} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              >
                <MenuItem value="">Select gender</MenuItem>
                {genderOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </TextField>
              <TextField
                fullWidth label="Employee name *" name="name" value={form.name} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth label="Designation" name="designation" value={form.designation} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth label="Department" name="department" value={form.department} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth select label="Work mode" name="workMode" value={form.workMode} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              >
                <MenuItem value="">Select work mode</MenuItem>
                {workModeOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </TextField>
              <TextField
                fullWidth label="Total hours" name="totalHours" value={form.totalHours} onChange={handleChange}
                type="number" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              />
              <TextField
                fullWidth select label="Status *" name="status" value={form.status} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
                      {status.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Divider sx={{ mb: 2, mt: 3 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.faint, letterSpacing: 1 }}>
              ACCESS
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth select label="Role" name="role" value={form.role} onChange={handleChange}
                size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
              >
                {roleOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>

              {!editing && (
                <TextField
                  fullWidth label="Password *" type="password" name="password" value={form.password} onChange={handleChange}
                  size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: "10px" } }}
                />
              )}
            </Box>

            <Typography variant="caption" sx={{ color: COLORS.faint, mt: 3, display: "block", fontStyle: "italic" }}>
              * Required fields
            </Typography>
          </DialogContent>

          <Box sx={{ p: 2, bgcolor: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }}>
            <DialogActions sx={{ p: 0 }}>
              <Button
                onClick={handleDialogClose}
                disabled={loading || uploadingImage}
                variant="outlined"
                sx={{ borderColor: COLORS.border, color: COLORS.muted, borderRadius: "10px", textTransform: 'none', fontWeight: 600, "&:hover": { borderColor: COLORS.primary, color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.04) } }}
              >
                Cancel
              </Button>
              <GradientButton
                onClick={editing ? handleUpdateUser : handleCreateUser}
                disabled={loading || uploadingImage}
                sx={{ minWidth: 150 }}
              >
                {loading || uploadingImage ? "Processing…" : editing ? "Update user" : "Create user"}
              </GradientButton>
            </DialogActions>
          </Box>
        </Dialog>
      </Shell>
    </LocalizationProvider>
  );
}