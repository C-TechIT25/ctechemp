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
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Stack,
  alpha,
  styled,
  Badge,
  Collapse,
  FormControl,
  InputLabel,
  Select,
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
  Work,
  AccessTime,
  CalendarMonth,
  CheckCircle,
  Warning,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Comment as CommentIcon,
  TrendingUp,
  CloudUpload as CloudUploadIcon,
  PhotoCamera,
} from "@mui/icons-material";
import { auth, db } from "../Config";
import { API_BASE_URL } from "../Config";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";

// Green Gradient Theme - Matching Timesheet
const greenTheme = {
  primary: "#2196F3",
  secondary: "#2196F3",
  lightGreen: "#2196F3",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  gradient: "linear-gradient(135deg, #2196F3 0%, #05467aff 100%)",
  lightGradient: "linear-gradient(135deg, #2196F3 0%, #0f4877ff 100%)"
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
  border: "1px solid rgba(46, 93, 125, 0.1)",
  boxShadow: "0 8px 32px rgba(46, 113, 125, 0.08)",
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
    boxShadow: "0 8px 24px rgba(46, 113, 125, 0.2)",
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getColor = (status) => {
    const statusLower = status?.toLowerCase();
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
  border: '2px dashed rgba(46, 125, 50, 0.3)',
  borderRadius: '12px',
  backgroundColor: 'rgba(46, 125, 50, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
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

// Helper function to get image URL - UPDATED for URL system
const getImageUrl = (profileData) => {
  if (!profileData) return "";
  
  // Check if it's already a URL (from backend)
  if (typeof profileData === 'string') {
    // If it's a full URL
    if (profileData.startsWith('http')) {
      return profileData;
    }
    // If it's a base64 string (legacy support)
    if (profileData.startsWith('data:image') || profileData.length > 100) {
      return profileData;
    }
    return "";
  }
  
  // If profileData is an object
  if (typeof profileData === 'object' && profileData !== null) {
    // Try profile_img_url first (new system)
    if (profileData.profile_img_url && profileData.profile_img_url.startsWith('http')) {
      return profileData.profile_img_url;
    }
    // Fallback to profile_img (legacy system)
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
        
        // Calculate new dimensions
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
        
        // Convert to base64 with quality setting
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
  const [showFilters, setShowFilters] = useState(false);

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPEG, PNG, GIF)', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      // Create a preview URL for immediate display
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
    // Clean up blob URL
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
      // Fetch from PostgreSQL - UPDATED to use profile_img_url
      const response = await fetch(`${API_BASE_URL}employees`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const pgData = await response.json();

      // Fetch from Firebase for roles
      const fbSnap = await getDocs(collection(db, "users"));
      const fbData = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Combine data
      const combinedUsers = pgData.map((pgUser) => {
        const fbUser = fbData.find((fb) => fb.email === pgUser.email);
        return {
          ...pgUser,
          uid: fbUser?.uid,
          role: fbUser?.role || "Employee",
          pgId: pgUser.id,
        };
      });

      setUsers(combinedUsers);
      
      // Extract unique departments
      const uniqueDepts = [...new Set(combinedUsers.map(user => user.department).filter(Boolean))];
      setDepartments(uniqueDepts);
      
      showToast(`Loaded ${combinedUsers.length} users successfully!`, "success");
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Failed to load users. Please try again.", "error");
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
    // Validate required fields
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
      // 1️⃣ Firebase Auth
      const res = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = res.user.uid;

      // 2️⃣ PostgreSQL Employee
      const pgResponse = await fetch(`${API_BASE_URL}employees`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
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
          // No profile_img - it will be uploaded separately
        }),
      });

      if (!pgResponse.ok) {
        const errorData = await pgResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create employee in PostgreSQL");
      }

      // 3️⃣ Upload profile image if exists - UPDATED to use separate endpoint
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
          } else {
            console.warn('Failed to upload profile image, continuing without it');
          }
        } catch (uploadError) {
          console.error('Error uploading profile image:', uploadError);
          // Continue without profile image
        }
      }

      // 4️⃣ Firebase Firestore - Store user data with profile image URL
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
        profileImgUrl: profileImageUrl,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", uid), firestoreData);

      // Clean up blob URL
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
      // 1️⃣ Update PostgreSQL
      const updateData = {
        employee_name: form.name,
        gender: form.gender,
        department: form.department,
        designation: form.designation,
        work_mode: form.workMode,
        total_hours: form.totalHours,
      };

      const updateResponse = await fetch(`${API_BASE_URL}employees/${editing.pgId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update employee");
      }

      // 2️⃣ Upload new profile image if changed - UPDATED
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

      // 3️⃣ Update Firebase Firestore
      if (editing.uid) {
        const firestoreUpdateData = {
          name: form.name,
          department: form.department,
          designation: form.designation,
          workMode: form.workMode,
          totalHours: form.totalHours,
          role: form.role,
          gender: form.gender,
        };
        
        // Only update profile image if it changed
        if (form.profileImgChanged && updatedProfileImageUrl) {
          firestoreUpdateData.profileImgUrl = updatedProfileImageUrl;
        }
        
        await updateDoc(doc(db, "users", editing.uid), firestoreUpdateData);
      }

      // Clean up blob URL
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setProfileImagePreview("");
      fetchUsers();
      showToast("User updated successfully!", "success");
    } catch (err) {
      console.error("Error updating user:", err);
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
      // 1️⃣ Delete profile image if exists
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

      // 2️⃣ Firebase Firestore
      if (user.uid) {
        await deleteDoc(doc(db, "users", user.uid));
      }

      // 3️⃣ PostgreSQL
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
      profileImgFile: null,
      profileImgChanged: false,
    });
    
    // Set preview for existing image
    if (existingProfileImgUrl) {
      setProfileImagePreview(existingProfileImgUrl);
    } else {
      setProfileImagePreview("");
    }
    
    setOpen(true);
  };

  /* ================= FILTER FUNCTIONS ================= */
  const handleApplyFilters = () => {
    showToast("Filters applied successfully!", "info");
  };

  const handleClearFilters = () => {
    setSelectedDepartment("all");
    setSelectedRole("all");
    setSearchTerm("");
    showToast("Filters cleared!", "info");
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === "" || 
      user.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === "all" || user.department === selectedDepartment;
    const matchesRole = selectedRole === "all" || user.role === selectedRole;

    return matchesSearch && matchesDepartment && matchesRole;
  });

  // Stats calculations
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === "Admin").length;
  const totalWFH = users.filter(u => u.work_mode === "Work From Home").length;
  const totalHours = users.reduce((sum, user) => sum + (parseFloat(user.total_hours) || 0), 0);

  // Handle dialog close
  const handleDialogClose = () => {
    if (!loading && !uploadingImage) {
      // Clean up blob URL
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
      <Box sx={{ flexGrow: 1, px: 4, py: 3 }}>
        {/* Toast Container */}
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <GradientTypography variant="h4">
                User Management
              </GradientTypography>
              <Typography variant="body2" color="text.secondary">
                Manage all employees and their information
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
              
              <Tooltip title="Refresh users">
                <IconButton 
                  onClick={fetchUsers} 
                  disabled={fetching}
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

          {/* STATS CARDS */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
              <StatCard color={greenTheme.gradient}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {totalUsers}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <Groups />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Users
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
              <StatCard color="#2196F3">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {totalAdmins}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <Person />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Admin Users
                  </Typography>
                </CardContent>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} minWidth={'250px'}>
              <StatCard color="#FF9800">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent:"space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {totalWFH}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <Work />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Work From Home
                  </Typography>
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
                bgcolor: "rgba(46, 125, 50, 0.05)",
                border: "1px solid rgba(46, 125, 50, 0.1)"
              }
            }}
          />

          {/* FILTER SECTION */}
          <Collapse in={showFilters}>
            <StyledPaper sx={{ p: 3, mt: 3, bgcolor: "rgba(46, 125, 50, 0.02)" }}>
              <Typography variant="subtitle1" fontWeight="bold" color="#2196F3" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filter Users
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
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
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "#2196F3" }}>Role</InputLabel>
                    <Select
                      value={selectedRole}
                      label="Role"
                      onChange={(e) => setSelectedRole(e.target.value)}
                      sx={{ 
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.05)",
                        border: "1px solid rgba(46, 125, 50, 0.1)"
                      }}
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      {roleOptions.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          <Chip
                            label={role.label}
                            size="small"
                            color={role.color}
                            sx={{ mr: 1 }}
                          />
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
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
              
              {(selectedDepartment !== "all" || selectedRole !== "all") && (
                <Typography variant="caption" color="#2196F3" sx={{ mt: 1, display: "block" }}>
                  Filtering by: {selectedDepartment !== "all" ? `Department = ${selectedDepartment}` : ""}
                  {selectedDepartment !== "all" && selectedRole !== "all" && ", "}
                  {selectedRole !== "all" ? `Role = ${selectedRole}` : ""}
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
                <TableRow sx={{ 
                  bgcolor: "rgba(46, 125, 50, 0.08)",
                  borderBottom: "2px solid #2196F3"
                }}>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", width: 60, backgroundColor: "#2196F3" }}>S.No</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Profile</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Emp ID</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Name</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Email</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Gender</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Department</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Designation</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Role</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Work Mode</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3" }}>Total Hours</TableCell>
                  <TableCell sx={{ color: "#ffffffff", fontWeight: "bold", backgroundColor: "#2196F3", width: 150 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                      <CircularProgress color="success" />
                      <Typography sx={{ mt: 2, color: "#2196F3" }}>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                      <SearchIcon sx={{ fontSize: 64, color: "rgba(46, 125, 50, 0.3)", mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        {searchTerm || selectedDepartment !== "all" || selectedRole !== "all" ? "No matching users found" : "No users found"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || selectedDepartment !== "all" || selectedRole !== "all" ? "Try adjusting your search or filters" : "Click 'Create New User' to add your first employee"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.pgId}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "rgba(46, 125, 50, 0.02)" : "white",
                        "&:hover": {
                          backgroundColor: "rgba(46, 125, 50, 0.05)",
                          transition: "background-color 0.2s",
                        },
                        borderBottom: "1px solid rgba(46, 125, 50, 0.1)",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#4CAF50",
                            }}
                          />
                          {index + 1}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={getImageUrl(user)} // UPDATED: Use URL directly
                          sx={{
                            width: 40,
                            height: 40,
                            border: "2px solid #2196F3",
                            bgcolor: getImageUrl(user) ? 'transparent' : 'rgba(46, 125, 50, 0.1)',
                            color: getImageUrl(user) ? 'inherit' : '#2E7D32',
                            fontWeight: 'bold',
                          }}
                        >
                          {user.employee_name?.charAt(0) || "U"}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {user.emp_id}
                        </Box>
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
                        <Chip
                          label={user.gender || "-"}
                          size="small"
                          sx={{
                            backgroundColor: user.gender === "Male" 
                              ? "#e3f2fd" 
                              : user.gender === "Female"
                              ? "#fce4ec"
                              : "#f3e5f5",
                            color: user.gender === "Male"
                              ? "#1565c0"
                              : user.gender === "Female"
                              ? "#c2185b"
                              : "#7b1fa2",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.department || "-"} 
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
                        <Chip
                          label={user.designation || "-"}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "rgba(46, 125, 50, 0.3)",
                            color: "#2E7D32",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          label={user.role || "Employee"}
                          size="small"
                          status={user.role}
                        />
                      </TableCell>
                      <TableCell>
                        <WorkModeChip
                          label={user.work_mode || "-"}
                          size="small"
                          mode={user.work_mode}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#2E7D32" }}>
                        {user.total_hours || "0"} hrs
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit user">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(user)}
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
                          <Tooltip title="Delete user">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user)}
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
                        </Stack>
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
              bgcolor: "rgba(46, 125, 50, 0.08)", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(46, 125, 50, 0.1)"
            }}>
              <Typography variant="body2" color="#2196F3" fontWeight="medium">
                Showing {filteredUsers.length} of {users.length} users
                {selectedDepartment !== "all" && ` in ${selectedDepartment}`}
                {selectedRole !== "all" && ` with ${selectedRole} role`}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="#2196F3">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total hours: {totalHours.toFixed(1)}h
              </Typography>
            </Box>
          )}
        </StyledPaper>

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
              background: greenTheme.gradient,
              color: "white",
              fontWeight: "bold",
              py: 2,
            }}
          >
            {editing ? "Edit Employee" : "Create New Employee"}
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
                        Recommended: Square image, max 5MB (will be compressed)
                      </Typography>
                    </>
                  )}
                </ProfileImageUpload>
              </label>
              {uploadingImage && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Processing image...
                  </Typography>
                </Box>
              )}
              {editing && !form.profileImgChanged && profileImagePreview && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Current image will be kept unless you upload a new one
                </Typography>
              )}
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)",
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
                    }
                  }}
                >
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">hrs</Typography>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
                    }
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: "8px",
                      bgcolor: "rgba(46, 125, 50, 0.05)",
                      border: "1px solid rgba(46, 125, 50, 0.1)"
                    }
                  }}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip
                        label={option.label}
                        size="small"
                        color={option.color}
                        sx={{ mr: 1 }}
                      />
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
                    margin="normal"
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: "8px",
                        bgcolor: "rgba(46, 125, 50, 0.05)",
                        border: "1px solid rgba(46, 125, 50, 0.1)"
                      }
                    }}
                  />
                )}
              </Box>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: "block", fontStyle: "italic" }}
            >
              * Required fields
              {editing && form.profileImgChanged && (
                <span style={{ color: '#FF9800', marginLeft: '10px' }}>
                  Note: Profile image will be updated
                </span>
              )}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(46, 125, 50, 0.1)" }}>
            <Button
              onClick={handleDialogClose}
              disabled={loading || uploadingImage}
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
              onClick={editing ? handleUpdateUser : handleCreateUser}
              disabled={loading || uploadingImage}
              startIcon={(loading || uploadingImage) && <CircularProgress size={20} color="inherit" />}
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