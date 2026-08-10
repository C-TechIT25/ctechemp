import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Fade,
  Grid,
  useMediaQuery,
  useTheme,
  GlobalStyles,
  alpha,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  Dashboard,
  Person,
  CorporateFare,
  Login as LoginIcon,
  VerifiedUser,
} from "@mui/icons-material";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth, db } from "../Config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { styled } from "@mui/material/styles";

// Import your PNG logo
import LogoImage from "../assets/Ctechsheet.png";

// ---------------------------------------------------------------------------
// Shared design tokens — same palette/type used across Todo, Timesheet,
// Header, Sidebar, Notifications, Profile, User Management and the admin
// Timesheet page. Worth lifting into a single `theme/tokens.js` file.
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

// Styled Components
const LoginButton = styled(Button)({
  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
  color: '#ffffff',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '0.3px',
  padding: '14px 28px',
  fontSize: '16px',
  transition: 'all 0.25s ease-out',
  boxShadow: `0 4px 14px ${alpha(COLORS.primary, 0.3)}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primaryDark} 100%)`,
    boxShadow: `0 8px 24px ${alpha(COLORS.primary, 0.4)}`,
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    background: alpha(COLORS.primary, 0.2),
    color: 'rgba(255,255,255,0.7)',
    transform: 'none',
    boxShadow: 'none',
  },
});

const LoginCard = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 20px 60px rgba(16,24,40,0.10)',
  padding: theme.spacing(5),
  width: '100%',
  maxWidth: '480px',
  transition: 'all 0.25s ease-out',
  '&:hover': {
    boxShadow: '0 25px 80px rgba(79,70,229,0.14)',
    borderColor: alpha(COLORS.primary, 0.3),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    borderRadius: '20px',
  },
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100px',
  height: '100px',
  background: 'transparent',
  borderRadius: '12px',
  marginBottom: theme.spacing(3),
  transition: 'transform 0.25s ease-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  [theme.breakpoints.down('sm')]: {
    width: '80px',
    height: '80px',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '12px',
  },
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.2s ease-out',
    backgroundColor: COLORS.bg,
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: COLORS.primary,
      },
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: COLORS.primary,
        borderWidth: '2px',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: COLORS.muted,
    fontWeight: 500,
    '&.Mui-focused': {
      color: COLORS.primary,
      fontWeight: 600,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '14px 16px',
  },
});

const FeatureCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: alpha(COLORS.primary, 0.05),
  borderRadius: '14px',
  border: `1px solid ${COLORS.border}`,
  transition: 'all 0.2s ease-out',
  '&:hover': {
    backgroundColor: alpha(COLORS.primary, 0.09),
    borderColor: alpha(COLORS.primary, 0.25),
    transform: 'translateX(4px)',
  },
}));

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, role, loading: authLoading, authInitialized } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!authInitialized || authLoading || !user) return;

    navigate(role === "Admin" ? "/admin/users" : "/employee/daily-timesheet", {
      replace: true,
    });
  }, [authInitialized, authLoading, navigate, role, user]);

  // Function to get user role and status from Firestore
  const getUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return {
          role: userDoc.data().role || "Employee",
          status: userDoc.data().status || "active"
        };
      }
      return {
        role: "Employee",
        status: "active"
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {
        role: "Employee",
        status: "active"
      };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Set persistence to LOCAL so user stays logged in even after closing browser
      await setPersistence(auth, browserLocalPersistence);

      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user role and status from Firestore
      const userData = await getUserData(user.uid);

      // Check if user account is inactive
      if (userData.status === "inactive") {
        setLoading(false);
        setError(
          "Your account is inactive. Please contact the administrator to activate your account."
        );
        // Sign out the user if account is inactive
        await auth.signOut();
        return;
      }

      setLoading(false);

      // Redirect based on role
      if (userData.role === "Admin") {
        navigate("/admin/users", { replace: true });
      } else {
        navigate("/employee/daily-timesheet", { replace: true });
      }

    } catch (err) {
      setLoading(false);
      setError(
        err.code === 'auth/invalid-email' ? 'Please enter a valid email address' :
        err.code === 'auth/user-not-found' ? 'No account found with this email' :
        err.code === 'auth/wrong-password' ? 'Incorrect password. Please try again' :
        err.code === 'auth/too-many-requests' ? 'Account temporarily locked. Try again later' :
        err.code === 'auth/network-request-failed' ? 'Network error. Please check your connection' :
        'Login failed. Please check your credentials'
      );
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <GlobalStyles styles={fontImport} />
      <Shell
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.bg,
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          },
        }}
      >
        {/* Background decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: { xs: '150px', sm: '200px', md: '300px' },
          height: { xs: '150px', sm: '200px', md: '300px' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(COLORS.primary, 0.07)} 0%, ${alpha(COLORS.primary, 0)} 70%)`,
          zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: { xs: '120px', sm: '180px', md: '250px' },
          height: { xs: '120px', sm: '180px', md: '250px' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(COLORS.info, 0.08)} 0%, ${alpha(COLORS.info, 0)} 70%)`,
          zIndex: 0,
        }} />

        {/* Geometric shapes */}
        <Box sx={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: alpha(COLORS.primary, 0.08),
          transform: 'rotate(45deg)',
          zIndex: 0,
          display: { xs: 'none', md: 'block' },
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: alpha(COLORS.info, 0.1),
          zIndex: 0,
          display: { xs: 'none', md: 'block' },
        }} />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <Fade in timeout={600}>
            <Grid
              container
              spacing={{ xs: 3, md: 6 }}
              alignItems="center"
              justifyContent="center"
            >
              {/* Left Column - Brand & Features */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  textAlign: { xs: 'center', md: 'left' },
                  maxWidth: { xs: '100%', md: '480px' },
                  mx: 'auto',
                  px: { xs: 2, sm: 0 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                    <BrandLogo>
                      <img
                        src={LogoImage}
                        alt="C-Tech Engineering Logo"
                        onError={(e) => {
                          console.error('Failed to load logo image');
                          e.target.style.display = 'none';
                        }}
                      />
                    </BrandLogo>
                    <Box>
                      <Typography sx={{
                        fontWeight: 800,
                        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: { xs: '1.5rem', sm: '1.5rem', md: '1.8rem' }
                      }}>
                        <Display>C-TECH ENGINEERING</Display>
                      </Typography>
                      <Typography variant="body2" sx={{
                        color: COLORS.muted,
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                      }}>
                        Employee Daily Work Management
                      </Typography>
                    </Box>
                  </Box>

                  <Typography sx={{
                    fontWeight: 700,
                    color: COLORS.ink,
                    mb: 2,
                    fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' }
                  }}>
                    <Display>Welcome back</Display>
                  </Typography>

                  <Typography variant="body1" sx={{
                    color: COLORS.muted,
                    fontWeight: 500,
                    mb: 4,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    lineHeight: 1.6
                  }}>
                    Sign in to access your dashboard and manage timesheets, employees, and projects efficiently.
                  </Typography>

                  {/* Feature Cards */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2,
                    mb: 4
                  }}>
                    <FeatureCard>
                      <VerifiedUser sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          Secure access
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.muted }}>
                          Enterprise-grade security
                        </Typography>
                      </Box>
                    </FeatureCard>

                    <FeatureCard>
                      <Dashboard sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          Real-time dashboard
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.muted }}>
                          Live analytics & insights
                        </Typography>
                      </Box>
                    </FeatureCard>

                    <FeatureCard>
                      <Person sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          Team management
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.muted }}>
                          Manage employees & roles
                        </Typography>
                      </Box>
                    </FeatureCard>

                    <FeatureCard>
                      <CorporateFare sx={{ color: COLORS.primary }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          Timesheet tracking
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.muted }}>
                          Automated hour tracking
                        </Typography>
                      </Box>
                    </FeatureCard>
                  </Box>
                </Box>
              </Grid>

              {/* Right Column - Login Form */}
              <Grid item xs={12} md={6}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100%'
                }}>
                  <LoginCard elevation={0}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 0.5, fontSize: '1.4rem' }}>
                        <Display>Sign in</Display>
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.muted, fontWeight: 500 }}>
                        Enter your credentials to continue
                      </Typography>
                    </Box>

                    {error && (
                      <Alert
                        severity="error"
                        sx={{
                          mb: 3,
                          borderRadius: '12px',
                          alignItems: 'center',
                          border: `1px solid ${alpha(COLORS.danger, 0.2)}`,
                          backgroundColor: alpha(COLORS.danger, 0.08),
                          '& .MuiAlert-icon': { color: COLORS.danger },
                        }}
                        onClose={() => setError("")}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {error}
                        </Typography>
                      </Alert>
                    )}

                    <form onSubmit={handleLogin}>
                      <Box sx={{ mb: 3 }}>
                        <StyledTextField
                          fullWidth
                          label="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          type="email"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailOutlined sx={{ color: COLORS.primary }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 2.5 }}
                          disabled={loading}
                          size={isMobile ? "small" : "medium"}
                        />

                        <StyledTextField
                          fullWidth
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockOutlined sx={{ color: COLORS.primary }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowPassword}
                                  onMouseDown={handleMouseDownPassword}
                                  edge="end"
                                  size={isMobile ? "small" : "medium"}
                                  sx={{ color: COLORS.primary }}
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          disabled={loading}
                          size={isMobile ? "small" : "medium"}
                        />
                      </Box>

                      <LoginButton
                        fullWidth
                        type="submit"
                        disabled={loading || !email || !password}
                        startIcon={!loading && <LoginIcon />}
                        size={isMobile ? "medium" : "large"}
                      >
                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} color="inherit" />
                            Signing in…
                          </Box>
                        ) : (
                          'Sign in'
                        )}
                      </LoginButton>
                    </form>
                  </LoginCard>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Box>
      </Shell>
    </>
  );
}