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
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Stack,
  styled,
  FormControl,
  InputLabel,
  Select,
  Menu,
  Collapse
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChecklistRtl,
  CloudUpload as CloudUploadIcon,
  PauseCircle,
  BlockOutlined as BlockCircle,
  TrendingUp,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
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

// Blue Theme - Matching Timesheet
const blueTheme = {
  primary: "#2196F3",
  secondary: "#2196F3",
  lightBlue: "#2196F3",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  gradient: "linear-gradient(135deg, #2196F3 0%, #05467aff 100%)",
  lightGradient: "linear-gradient(135deg, #2196F3 0%, #0f4877ff 100%)"
};

// Status options with colors
const statusOptions = [
  { value: "Active", label: "Active", color: "#2E7D32", icon: ChecklistRtl },
  { value: "Inactive", label: "Inactive", color: "#757575", icon: PauseCircle },
  { value: "On Hold", label: "On Hold", color: "#FF9800", icon: BlockCircle },
];

// Styled Components
const GradientTypography = styled(Typography)(({ theme }) => ({
  background: blueTheme.gradient,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 700,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: blueTheme.gradient,
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 24px",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    background: blueTheme.lightGradient,
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(46, 109, 125, 0.25)",
  },
  "&:disabled": {
    background: "rgba(0, 0, 0, 0.12)",
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(33, 150, 243, 0.1)",
  boxShadow: "0 8px 32px rgba(33, 150, 243, 0.08)",
}));

const StatCard = styled(Card)(({ theme, color }) => ({
  borderRadius: "12px",
  height: "100%",
  background: color || blueTheme.gradient,
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
    boxShadow: "0 8px 24px rgba(33, 150, 243, 0.2)",
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower?.includes("active")) return "#2E7D32";
    if (statusLower?.includes("inactive")) return "#757575";
    if (statusLower?.includes("hold")) return "#FF9800";
    if (statusLower?.includes("admin")) return "#074d86ff";
    if (statusLower?.includes("employee")) return "#2196F3";
    if (statusLower?.includes("teamlead")) return "#FF9800";
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

const RoleChip = styled(Chip)(({ theme, role }) => {
  const getColor = (role) => {
    const roleLower = role?.toLowerCase();
    if (roleLower?.includes("admin")) return "#074d86ff";
    if (roleLower?.includes("teamlead")) return "#FF9800";
    return "#2196F3";
  };
  
  const color = getColor(role);
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

const ProfileImageUpload = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '200px',
  border: '2px dashed rgba(33, 150, 243, 0.3)',
  borderRadius: '12px',
  backgroundColor: 'rgba(33, 150, 243, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196F3',
  }
}));

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
  { value: "Admin", label: "Admin", color: "success" },
  { value: "Employee", label: "Employee", color: "primary" },
  { value: "TeamLead", label: "Team Lead", color: "warning" },
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

// Helper function to compress image for upload
const compressImage = async (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
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
      console.log('📥 Received employees data:', response);
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

  /* ================= UPDATE USER - FIXED VERSION ================= */
  const handleUpdateUser = async () => {
    if (!editing) return;

    setLoading(true);
    try {
      // Prepare update data
      const updateData = {
        employee_name: form.name,
        gender: form.gender,
        department: form.department,
        designation: form.designation,
        work_mode: form.workMode,
        total_hours: form.totalHours,
        status: form.status, // Important: Include status
      };

      console.log('📤 Updating user with data:', updateData);
      console.log('📤 Status value being sent:', form.status);
      console.log('📤 API URL:', `${API_BASE_URL}employees/${editing.pgId}`);

      // Make the update request
      const updateResponse = await fetch(`${API_BASE_URL}employees/${editing.pgId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(updateData),
      });

      console.log('📥 Response status:', updateResponse.status);
      console.log('📥 Response status text:', updateResponse.statusText);

      // Get the raw response text
      const responseText = await updateResponse.text();
      console.log('📥 Raw response:', responseText);

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

      // Handle profile image upload if changed
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

      // Update Firestore
      if (editing.uid) {
        const firestoreUpdateData = {
          name: form.name,
          department: form.department,
          designation: form.designation,
          workMode: form.workMode,
          totalHours: form.totalHours,
          role: form.role,
          gender: form.gender,
          status: form.status, // Important: Include status
        };
        
        if (form.profileImgChanged && updatedProfileImageUrl) {
          firestoreUpdateData.profileImgUrl = updatedProfileImageUrl;
        }
        
        console.log('📤 Updating Firestore with:', firestoreUpdateData);
        await updateDoc(doc(db, "users", editing.uid), firestoreUpdateData);
      }

      // Clean up
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setProfileImagePreview("");
      await fetchUsers(); // Refresh the user list
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
      status: user.status || "Active",
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
    // Get the filtered users data for export
    const exportData = filteredUsers.length > 0 ? filteredUsers : users;
    
    if (exportData.length === 0) {
      showToast('No users to export!', 'warning');
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // ===== COLOR PALETTE =====
    const COLORS = {
      primary: [37, 99, 235],         // Bright blue #2563EB
      text: [45, 45, 45],             // Dark gray
      lightText: [107, 114, 128],     // Medium gray
      border: [229, 231, 235],        // Light gray
      rowAlt: [249, 250, 251],        // Very light gray
      white: [255, 255, 255],
      active: [34, 197, 94],          // Green #22C55E
      onHold: [249, 115, 22],         // Orange #F97316
      inactive: [239, 68, 68],        // Red #EF4444
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const MARGIN = { top: 12, right: 12, bottom: 15, left: 12 };
    const CONTENT_WIDTH = pageWidth - MARGIN.left - MARGIN.right;

    // ===== HEADER SECTION =====
    let currentY = MARGIN.top;

    // Main title
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('User Management Report', MARGIN.left, currentY);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.lightText);
    doc.setFont('helvetica', 'normal');
    doc.text('Employee Directory and Access Control', MARGIN.left, currentY + 5);

    // Header metadata (right aligned)
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.lightText);
    const currentDate = new Date().toLocaleString();
    doc.text(`Generated: ${currentDate}`, pageWidth - MARGIN.right, currentY, { align: 'right' });
    doc.text(`Total Records: ${exportData.length}`, pageWidth - MARGIN.right, currentY + 5, { align: 'right' });

    currentY += 14;

    // ===== SUMMARY STATISTICS =====
    const activeCount = exportData.filter(u => u.status && u.status.toLowerCase() === 'active').length;
    const onHoldCount = exportData.filter(u => u.status && u.status.toLowerCase() === 'on hold').length;
    const inactiveCount = exportData.filter(u => u.status && u.status.toLowerCase() === 'inactive').length;

    const stats = [
      { 
        label: 'Active Users', 
        value: activeCount.toString(),
        borderColor: COLORS.active
      },
      { 
        label: 'On Hold', 
        value: onHoldCount.toString(),
        borderColor: COLORS.onHold
      },
      { 
        label: 'Inactive', 
        value: inactiveCount.toString(),
        borderColor: COLORS.inactive
      },
      { 
        label: 'Total Users', 
        value: exportData.length.toString(),
        borderColor: COLORS.primary
      },
    ];

    const statBoxWidth = CONTENT_WIDTH / 4 - 1.5;
    const statBoxHeight = 16;
    const statBoxY = currentY;

    stats.forEach((stat, index) => {
      const boxX = MARGIN.left + (index * (statBoxWidth + 2));

      // White background with border
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.rect(boxX, statBoxY, statBoxWidth, statBoxHeight, 'FD');

      // Left colored border (thick)
      doc.setDrawColor(...stat.borderColor);
      doc.setLineWidth(0.8);
      doc.line(boxX, statBoxY, boxX, statBoxY + statBoxHeight);

      // Label
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.lightText);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, boxX + 3, statBoxY + 3.5);

      // Value
      doc.setFontSize(12);
      doc.setTextColor(...stat.borderColor);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, boxX + 3, statBoxY + 11);
    });

    currentY = statBoxY + statBoxHeight + 7;

    // ===== TABLE SECTION =====
    const tableColumn = ["S.No", "Emp ID", "Name", "Email", "Department", "Designation", "Status", "Role", "Work Mode", "Hours"];
    const tableRows = [];

    exportData.forEach((user, index) => {
      const userData = [
        (index + 1).toString(),
        user.emp_id || '-',
        user.employee_name || '-',
        user.email || '-',
        user.department || '-',
        user.designation || '-',
        user.status || 'Active',
        user.role || 'Employee',
        user.work_mode || '-',
        user.total_hours || '0'
      ];
      tableRows.push(userData);
    });

    // Generate table
    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      
      // Column styles
      columnStyles: {
        0: { cellWidth: 13, halign: 'center' },    // S.No
        1: { cellWidth: 20, halign: 'center' },    // Emp ID
        2: { cellWidth: 35, halign: 'left' },      // Name
        3: { cellWidth: 40, halign: 'left' },      // Email
        4: { cellWidth: 40, halign: 'left' },      // Department
        5: { cellWidth: 35, halign: 'left' },      // Designation
        6: { cellWidth: 22, halign: 'center' },    // Status
        7: { cellWidth: 20, halign: 'center' },    // Role
        8: { cellWidth: 30, halign: 'center' },    // Work Mode
        9: { cellWidth: 18, halign: 'center' },    // Hours
      },

      // Header styling
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineColor: COLORS.primary,
        lineWidth: 0.1
      },

      // Body styling
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.text,
        cellPadding: 2,
        lineColor: COLORS.border,
        lineWidth: 0.1,
        valign: 'middle'
      },

      // Alternating row colors
      alternateRowStyles: {
        fillColor: COLORS.rowAlt,
        textColor: COLORS.text,
        cellPadding: 2,
        lineColor: COLORS.border,
        lineWidth: 0.1,
        valign: 'middle'
      },

      // Dynamic status coloring - CASE INSENSITIVE
      didParseCell: function (data) {
        // Color the Status column (index 6)
        if (data.column.index === 6) {
          const cellText = data.cell.text[0] || '';
          const statusLower = cellText.toLowerCase().trim();
          
          if (statusLower === 'on hold') {
            // On Hold - Orange highlight
            data.cell.textColor = COLORS.onHold;
            data.cell.fontStyle = 'normal';
          } else if (statusLower === 'Inactive') {
            // Inactive - Red highlight
            data.cell.textColor = COLORS.inactive;
            data.cell.fontStyle = 'normal';
          } else if (statusLower === 'active') {
            // Active status - use normal text color, no highlighting
            data.cell.textColor = COLORS.text;
            data.cell.fontStyle = 'normal';
          }
        }
      },

      // Page management
      margin: MARGIN,
      rowPageBreak: 'avoid',

      // Footer with page numbers
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        
        // Bottom border
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(MARGIN.left, pageHeight - MARGIN.bottom - 5, pageWidth - MARGIN.right, pageHeight - MARGIN.bottom - 5);

        // Page number and footer
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.lightText);
        doc.setFont('helvetica', 'normal');

        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - MARGIN.bottom + 3,
          { align: 'center' }
        );

        // Footer text
        doc.setFontSize(6);
        doc.text(
          '© User Management System - Confidential',
          MARGIN.left,
          pageHeight - MARGIN.bottom + 3
        );
      }
    });

    // ===== SAVE DOCUMENT =====
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
      // Get the filtered users data for export
      const exportData = filteredUsers.length > 0 ? filteredUsers : users;
      
      if (exportData.length === 0) {
        showToast('No users to export!', 'warning');
        return;
      }

      // Prepare data for Excel
      const excelData = exportData.map((user, index) => ({
        'S.No': index + 1,
        'Employee ID': user.emp_id || '-',
        'Name': user.employee_name || '-',
        'Email': user.email || '-',
        'Gender': user.gender || '-',
        'Date of Joining': user.date_of_joining || '-',
        'Department': user.department || '-',
        'Designation': user.designation || '-',
        'Status': user.status || 'Active',
        'Role': user.role || 'Employee',
        'Work Mode': user.work_mode || '-',
        'Total Hours': user.total_hours || '0'
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Style the worksheet
      const wscols = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 12 }, // Gender
        { wch: 18 }, // Date of Joining
        { wch: 20 }, // Department
        { wch: 20 }, // Designation
        { wch: 12 }, // Status
        { wch: 12 }, // Role
        { wch: 18 }, // Work Mode
        { wch: 12 }, // Total Hours
      ];
      ws['!cols'] = wscols;

      // Append worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Users');

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      
      // Create download link
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
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  // Stats calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "Active").length;
  const inactiveUsers = users.filter(u => u.status === "Inactive").length;
  const onHoldUsers = users.filter(u => u.status === "On Hold").length;
  const totalAdmins = users.filter(u => u.role === "Admin").length;
  const totalHours = users.reduce((sum, user) => sum + (parseFloat(user.total_hours) || 0), 0);

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
      <Box sx={{ flexGrow: 1, px: 4, py: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
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

        {/* HEADER SECTION */}
        <StyledPaper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <GradientTypography variant="h4">
                User Management
              </GradientTypography>
              <Typography variant="body2" color="text.secondary">
                Manage all employees and their information
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
              
              <Tooltip title="Refresh users">
                <IconButton 
                  onClick={fetchUsers} 
                  disabled={fetching}
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

              {/* Export Button with Menu */}
              <Tooltip title="Export data">
                <Button
                  onClick={handleExportMenuOpen}
                  sx={{
                    background: blueTheme.gradient,
                    color: "white",
                    borderRadius: "10px",
                    px: 2,
                    textTransform: "none",
                    "&:hover": {
                      background: blueTheme.lightGradient,
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 12px rgba(46, 109, 125, 0.25)",
                    }
                  }}
                  startIcon={<PdfIcon />}
                >
                  Export
                </Button>
              </Tooltip>
              
              <GradientButton
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setEditing(null);
                  setForm(initialForm);
                  setProfileImagePreview("");
                  setOpen(true);
                }}
                sx={{ px: 3 }}
              >
                Create New User
              </GradientButton>
            </Box>
          </Box>

          {/* Export Menu */}
          <Menu
            anchorEl={exportMenuAnchorEl}
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
            <MenuItem onClick={exportToPDF} sx={{ py: 1.5 }}>
              <PdfIcon sx={{ mr: 2, color: "#f44336" }} />
              <Typography>Export to PDF (Landscape)</Typography>
            </MenuItem>
            <MenuItem onClick={exportToExcel} sx={{ py: 1.5 }}>
              <ExcelIcon sx={{ mr: 2, color: "#2196F3" }} />
              <Typography>Export to Excel</Typography>
            </MenuItem>
          </Menu>

          {/* STATS CARDS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4} width={'15%'}>
              <StatCard color={blueTheme.gradient}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Total Users
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {totalUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <Groups />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} width={'15%'}>
              <StatCard color="#2E7D32">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Active Users
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {activeUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <ChecklistRtl />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} width={'15%'}>
              <StatCard color="#FF9800">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        On Hold
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {onHoldUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <BlockCircle />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2.4} width={'15%'}>
              <StatCard color="#757575">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Inactive Users
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {inactiveUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <PauseCircle />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4} width={'15%'}>
              <StatCard color="#2196F3">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Admin Users
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {totalAdmins}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 40, height: 40 }}>
                      <Person />
                    </Avatar>
                  </Box>
                </CardContent>
              </StatCard>
            </Grid>
          </Grid>

          {/* SEARCH BAR */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, email, ID, department, or designation..."
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
                border: "1px solid rgba(33, 150, 243, 0.1)"
              }
            }}
          />

          {/* FILTER SECTION */}
          <Collapse in={showFilters}>
            <StyledPaper sx={{ p: 3, mt: 3, bgcolor: "rgba(33, 150, 243, 0.02)" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2196F3" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <FilterIcon sx={{ mr: 1 }} />
                Filter Users
              </Typography>
              
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Department</InputLabel>
                    <Select
                      value={selectedDepartment}
                      label="Department"
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(33, 150, 243, 0.05)",
                        border: "1px solid rgba(33, 150, 243, 0.1)"
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
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Role</InputLabel>
                    <Select
                      value={selectedRole}
                      label="Role"
                      onChange={(e) => setSelectedRole(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(33, 150, 243, 0.05)",
                        border: "1px solid rgba(33, 150, 243, 0.1)"
                      }}
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      {roleOptions.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      label="Status"
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(33, 150, 243, 0.05)",
                        border: "1px solid rgba(33, 150, 243, 0.1)"
                      }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      {statusOptions.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Stack direction="row" spacing={1}>
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
              
              {(selectedDepartment !== "all" || selectedRole !== "all" || selectedStatus !== "all") && (
                <Typography variant="caption" color="#2196F3" sx={{ mt: 2, display: "block" }}>
                  Active Filters: 
                  {selectedDepartment !== "all" && ` Department=${selectedDepartment}`}
                  {selectedRole !== "all" && `, Role=${selectedRole}`}
                  {selectedStatus !== "all" && `, Status=${selectedStatus}`}
                </Typography>
              )}
            </StyledPaper>
          </Collapse>
        </StyledPaper>

        {/* TABLE SECTION */}
        <StyledPaper>
          <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: "#2196F3" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold", width: 60 }}>S.No</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Profile</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Emp ID</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Department</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Role</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Work Mode</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold", width: 70 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <CircularProgress color="success" />
                      <Typography sx={{ mt: 2, color: "#2196F3" }}>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <SearchIcon sx={{ fontSize: 64, color: "rgba(33, 150, 243, 0.3)", mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        {searchTerm || selectedDepartment !== "all" || selectedRole !== "all" || selectedStatus !== "all" ? "No matching users found" : "No users found"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || selectedDepartment !== "all" || selectedRole !== "all" || selectedStatus !== "all" ? "Try adjusting your search or filters" : "Click 'Create New User' to add your first employee"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.pgId}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "rgba(33, 150, 243, 0.02)" : "white",
                        "&:hover": {
                          backgroundColor: "rgba(33, 150, 243, 0.05)",
                          transition: "background-color 0.2s",
                        },
                        borderBottom: "1px solid rgba(33, 150, 243, 0.1)",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: user.status === "Active" ? "#2E7D32" : user.status === "On Hold" ? "#FF9800" : "#757575",
                            }}
                          />
                          {index + 1}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={getImageUrl(user)}
                          sx={{
                            width: 40,
                            height: 40,
                            border: "2px solid #2196F3",
                            bgcolor: getImageUrl(user) ? 'transparent' : 'rgba(33, 150, 243, 0.1)',
                            color: getImageUrl(user) ? 'inherit' : '#2196F3',
                            fontWeight: 'bold',
                          }}
                        >
                          {user.employee_name?.charAt(0) || "U"}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {user.emp_id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {user.employee_name}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          label={user.status || "Active"}
                          size="small"
                          status={user.status}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.department || "-"} 
                          size="small" 
                          sx={{ 
                            bgcolor: "rgba(33, 150, 243, 0.1)", 
                            color: "#2196F3",
                            fontWeight: "medium",
                            borderRadius: "6px"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <RoleChip
                          label={user.role || "Employee"}
                          size="small"
                          role={user.role}
                        />
                      </TableCell>
                      <TableCell>
                        <WorkModeChip
                          label={user.work_mode || "-"}
                          size="small"
                          mode={user.work_mode}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="More options">
                          <IconButton
                            size="small"
                            onClick={(event) => handleActionMenuOpen(event, user)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* TABLE FOOTER */}
          {filteredUsers.length > 0 && (
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
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="#2196F3" sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUp sx={{ mr: 1, fontSize: "1.2rem" }} />
                Total hours: {totalHours.toFixed(1)}h
              </Typography>
            </Box>
          )}
        </StyledPaper>

        {/* ACTION MENU */}
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
          <MenuItem onClick={handleEditFromMenu} sx={{ py: 1.5 }}>
            <EditIcon sx={{ mr: 2, color: "#2196F3" }} />
            <Typography>Edit User</Typography>
          </MenuItem>
          <MenuItem onClick={handleDeleteFromMenu} sx={{ py: 1.5 }}>
            <DeleteIcon sx={{ mr: 2, color: "#F44336" }} />
            <Typography>Delete User</Typography>
          </MenuItem>
        </Menu>

        {/* CREATE/EDIT DIALOG */}
        <Dialog
          open={open}
          onClose={handleDialogClose}
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
              background: blueTheme.gradient,
              color: "white",
              fontWeight: "bold",
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAddIcon sx={{ mr: 1 }} />
              {editing ? "Edit Employee" : "Create New Employee"}
            </Box>
            <StatusChip 
              label={form.status} 
              size="small"
              status={form.status}
            />
          </DialogTitle>

          <DialogContent sx={{ mt: 3 }}>
            {/* Profile Image Upload Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="#2196F3">
                Profile Image {!editing && "(Optional)"}
                {editing && form.profileImgChanged && (
                  <Chip 
                    label="Image changed" 
                    size="small" 
                    color="warning" 
                    sx={{ ml: 1, fontSize: '0.7rem' }}
                  />
                )}
              </Typography>
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
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '10px'
                        }}
                      />
                      {!uploadingImage && (
                        <>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(244, 67, 54, 0.8)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#f44336'
                              }
                            }}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('profile-image-upload').click();
                            }}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              backgroundColor: 'rgba(33, 150, 243, 0.8)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#2196F3'
                              }
                            }}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 48, color: '#2196F3', mb: 2 }} />
                      <Typography variant="body2" color="#2196F3" gutterBottom>
                        Click to upload profile image
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recommended: Square image, max 5MB
                      </Typography>
                    </>
                  )}
                </ProfileImageUpload>
              </label>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={3}>
              {/* Left Column */}
              <Box>
                <TextField
                  fullWidth
                  label="Employee ID *"
                  name="empId"
                  value={form.empId}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!editing}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)",
                    }
                  }}
                />

                <TextField
                  fullWidth
                  type="date"
                  label="Date of Joining *"
                  name="doj"
                  value={form.doj}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  {genderOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  label="Employee Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Designation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />
              </Box>

              {/* Right Column */}
              <Box>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email ID *"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  margin="normal"
                  type="email"
                  disabled={!!editing}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="Work Mode"
                  name="workMode"
                  value={form.workMode}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                >
                  <MenuItem value="">Select Work Mode</MenuItem>
                  {workModeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  label="Total Hours"
                  name="totalHours"
                  value={form.totalHours}
                  onChange={handleChange}
                  margin="normal"
                  type="number"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="Status *"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: status.color 
                          }} 
                        />
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: "8px",
                    bgcolor: "rgba(33, 150, 243, 0.05)",
                    border: "1px solid rgba(33, 150, 243, 0.1)"
                  }
                }}
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {!editing && (
                <TextField
                  fullWidth
                  label="Password *"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(33, 150, 243, 0.05)",
                      border: "1px solid rgba(33, 150, 243, 0.1)"
                    }
                  }}
                />
              )}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: "block", fontStyle: "italic" }}
            >
              * Required fields
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(33, 150, 243, 0.1)" }}>
            <Button
              onClick={handleDialogClose}
              disabled={loading || uploadingImage}
              variant="outlined"
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
              Cancel
            </Button>
            <GradientButton
              onClick={editing ? handleUpdateUser : handleCreateUser}
              disabled={loading || uploadingImage}
              sx={{ minWidth: 140 }}
            >
              {loading || uploadingImage
                ? "Processing..."
                : editing
                ? "Update User"
                : "Create User"}
            </GradientButton>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}