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
} from "@mui/icons-material";
import { auth, db } from "../Config";
import { API_BASE_URL } from "../Config";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";

// Green Gradient Theme - Matching Timesheet
const greenTheme = {
  primary: "#2E7D32",
  secondary: "#4CAF50",
  lightGreen: "#66BB6A",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  gradient: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
  lightGradient: "linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)"
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
    boxShadow: "0 6px 12px rgba(46, 125, 50, 0.25)",
  },
  "&:disabled": {
    background: "rgba(0, 0, 0, 0.12)",
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(46, 125, 50, 0.1)",
  boxShadow: "0 8px 32px rgba(46, 125, 50, 0.08)",
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
    boxShadow: "0 8px 24px rgba(46, 125, 50, 0.2)",
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower?.includes("admin")) return "#2E7D32";
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

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
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

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setFetching(true);
    try {
      // Fetch from PostgreSQL
      const response = await fetch(`${API_BASE_URL}employees`);
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

      // 2️⃣ Firebase Firestore
      await setDoc(doc(db, "users", uid), {
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
        createdAt: serverTimestamp(),
      });

      // 3️⃣ PostgreSQL Employee
      const pgResponse = await fetch(`${API_BASE_URL}employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        }),
      });

      if (!pgResponse.ok) {
        throw new Error("Failed to create employee in PostgreSQL");
      }

      setOpen(false);
      setForm(initialForm);
      fetchUsers();
      showToast("User created successfully!", "success");
    } catch (err) {
      console.error("Error creating user:", err);
      showToast(err.message, "error");
    }
    setLoading(false);
  };

  /* ================= UPDATE USER ================= */
  const handleUpdateUser = async () => {
    if (!editing) return;

    setLoading(true);
    try {
      // 🔹 Update Firebase
      await updateDoc(doc(db, "users", editing.uid), {
        name: form.name,
        department: form.department,
        designation: form.designation,
        workMode: form.workMode,
        totalHours: form.totalHours,
        role: form.role,
        gender: form.gender,
      });

      // 🔹 Update PostgreSQL
      await fetch(`${API_BASE_URL}employees/${editing.pgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_name: form.name,
          gender: form.gender,
          department: form.department,
          designation: form.designation,
          work_mode: form.workMode,
          total_hours: form.totalHours,
        }),
      });

      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      fetchUsers();
      showToast("User updated successfully!", "success");
    } catch (err) {
      console.error("Error updating user:", err);
      showToast(err.message, "error");
    }
    setLoading(false);
  };

  /* ================= DELETE USER ================= */
  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(`Are you sure you want to delete ${user.employee_name}?`)
    )
      return;

    try {
      // 🔹 Firebase Firestore
      if (user.uid) {
        await deleteDoc(doc(db, "users", user.uid));
      }

      // 🔹 PostgreSQL
      await fetch(`${API_BASE_URL}employees/${user.pgId}`, {
        method: "DELETE",
      });

      fetchUsers();
      showToast("User deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast(err.message, "error");
    }
  };

  /* ================= EDIT OPEN ================= */
  const handleEdit = (user) => {
    setEditing(user);
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
    });
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
  const totalTeamLeads = users.filter(u => u.role === "TeamLead").length;
  const totalHours = users.reduce((sum, user) => sum + (parseFloat(user.total_hours) || 0), 0);

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
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
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
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
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
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#FF9800">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
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
            
            <Grid item xs={12} sm={6} md={3}minWidth={'250px'}>
              <StatCard color="#4CAF50">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {totalTeamLeads}
                    </Typography>
                    <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}>
                      <AccessTime />
                    </Avatar>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Team Leads
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
              <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filter Users
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
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
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "success.main" }}>Role</InputLabel>
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
              
              {(selectedDepartment !== "all" || selectedRole !== "all") && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
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
                  borderBottom: "2px solid #2E7D32"
                }}>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold", width: 60 }}>S.No</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Emp ID</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Gender</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Department</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Designation</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Role</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Work Mode</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold" }}>Total Hours</TableCell>
                  <TableCell sx={{ color: "#2E7D32", fontWeight: "bold", width: 150 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                      <CircularProgress color="success" />
                      <Typography sx={{ mt: 2, color: "success.main" }}>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
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
                      <TableCell sx={{ fontWeight: 500 }}>
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
                            {user.emp_id?.charAt(0) || "U"}
                          </Avatar>
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
              <Typography variant="body2" color="success.main" fontWeight="medium">
                Showing {filteredUsers.length} of {users.length} users
                {selectedDepartment !== "all" && ` in ${selectedDepartment}`}
                {selectedRole !== "all" && ` with ${selectedRole} role`}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Total hours: {totalHours.toFixed(1)}h
              </Typography>
            </Box>
          )}
        </StyledPaper>

        {/* CREATE/EDIT DIALOG */}
        <Dialog
          open={open}
          onClose={() => !loading && setOpen(false)}
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
                      border: "1px solid rgba(46, 125, 50, 0.1)"
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
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(46, 125, 50, 0.1)" }}>
            <Button
              onClick={() => {
                setOpen(false);
                setEditing(null);
                setForm(initialForm);
              }}
              disabled={loading}
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
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{ minWidth: 140 }}
            >
              {loading
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