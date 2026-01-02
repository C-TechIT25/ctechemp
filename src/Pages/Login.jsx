import React, { useState } from "react";
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
  Link,
  Container,
  Fade,
  Grid,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { 
  Visibility, 
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  ArrowForward,
  Dashboard,
  Security,
  Person,
  CorporateFare,
  Login as LoginIcon,
  VerifiedUser,
  WorkspacePremium
} from "@mui/icons-material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../Config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";

// Import your PNG logo
import LogoImage from "../assets/Ctechsheet.png"; // Update this path to your actual logo file location

// Green Gradient Theme - Matching other components
const PRIMARY_GRADIENT = 'linear-gradient(135deg, #2196F3 0%, #08599bff 100%)';
const PRIMARY_LIGHT_GRADIENT = 'linear-gradient(135deg, #2196F3 0%, #07508bff 100%)';
const PRIMARY_COLOR = '#2196F3';
const SECONDARY_COLOR = '#2196F3';
const BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.95)';
const BORDER_COLOR = 'rgba(46, 125, 50, 0.15)';
const TEXT_PRIMARY = '#2196F3';
const TEXT_SECONDARY = 'rgba(0, 0, 0, 0.6)';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#F44336';
const INFO_COLOR = '#2196F3';

// Styled Components
const LoginButton = styled(Button)(({ theme }) => ({
  background: PRIMARY_GRADIENT,
  color: '#ffffff',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '0.3px',
  padding: '14px 28px',
  fontSize: '16px',
  transition: 'all 0.3s ease-out',
  '&:hover': {
    background: PRIMARY_LIGHT_GRADIENT,
    boxShadow: '0 8px 32px rgba(46, 113, 125, 0.3)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    background: 'rgba(46, 125, 50, 0.2)',
    color: 'rgba(46, 89, 125, 0.5)',
    transform: 'none',
    boxShadow: 'none',
  },
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  background: BACKGROUND_COLOR,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${BORDER_COLOR}`,
  boxShadow: '0 20px 60px rgba(46, 125, 121, 0.08)',
  padding: theme.spacing(5),
  width: '100%',
  maxWidth: '480px',
  transition: 'all 0.3s ease-out',
  '&:hover': {
    boxShadow: '0 25px 80px rgba(46, 125, 50, 0.15)',
    borderColor: PRIMARY_COLOR,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    borderRadius: '20px',
  },
}));

const BrandHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(4),
}));

// Updated BrandLogo to use PNG image
const BrandLogo = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100px', // Increased width for logo
  height: '100px', // Increased height for logo
  background: 'transparent', // Removed gradient background
  borderRadius: '12px', // Slightly rounded corners
  marginBottom: theme.spacing(3),
  boxShadow: 'none', // Removed shadow
  transition: 'transform 0.3s ease-out',
  '&:hover': {
    transform: 'scale(1.05)', // Scale effect instead of rotation
  },
  [theme.breakpoints.down('sm')]: {
    width: '80px', // Smaller on mobile
    height: '80px',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // Ensures the image fits within the box
    borderRadius: '12px', // Match the container's border radius
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.2s ease-out',
    backgroundColor: 'rgba(46, 125, 118, 0.03)',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: PRIMARY_COLOR,
      },
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: PRIMARY_COLOR,
        borderWidth: '2px',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: TEXT_SECONDARY,
    fontWeight: 500,
    '&.Mui-focused': {
      color: TEXT_PRIMARY,
      fontWeight: 600,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '14px 16px',
  },
  '& .MuiInputAdornment-root': {
    marginRight: theme.spacing(1),
  },
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(46, 109, 125, 0.05)',
  borderRadius: '12px',
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-out',
  '&:hover': {
    backgroundColor: 'rgba(46, 125, 114, 0.1)',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Function to get user role from Firestore
  const getUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data().role || "Employee"; // Default to Employee if role not found
      }
      return "Employee"; // Default role
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "Employee"; // Default role on error
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Get user role from Firestore
      const userRole = await getUserRole(user.uid);
      
      setLoading(false);
      
      // 3. Redirect based on role (NO DASHBOARD)
      if (userRole === "Admin") {
        navigate("/admin/users"); // Admin goes directly to User Management
      } else {
        // Employee, TeamLead, or any other role
        navigate("/employee/daily-timesheet"); // Employee goes directly to Daily Timesheet
      }
      
    } catch (err) {
      setLoading(false);
      setError(
        err.code === 'auth/invalid-email' ? 'Please enter a valid email address' :
        err.code === 'auth/user-not-found' ? 'No account found with this email' :
        err.code === 'auth/wrong-password' ? 'Incorrect password. Please try again' :
        err.code === 'auth/too-many-requests' ? 'Account temporarily locked. Try again later' :
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
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: 'linear-gradient(135deg, rgba(249, 250, 251, 1) 0%, rgba(243, 244, 246, 1) 100%)',
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
        background: PRIMARY_GRADIENT,
      },
    }}>
      {/* Background decorative elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: { xs: '150px', sm: '200px', md: '300px' },
        height: { xs: '150px', sm: '200px', md: '300px' },
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46, 116, 125, 0.05) 0%, rgba(46, 125, 118, 0) 70%)',
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: { xs: '120px', sm: '180px', md: '250px' },
        height: { xs: '120px', sm: '180px', md: '250px' },
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76, 155, 175, 0.05) 0%, rgba(76, 175, 175, 0) 70%)',
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
        background: 'rgba(46, 122, 125, 0.1)',
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
        background: 'rgba(76, 168, 175, 0.1)',
        zIndex: 0,
        display: { xs: 'none', md: 'block' },
      }} />

      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Fade in={true} timeout={800}>
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
                    {/* Replace the WorkspacePremium icon with your PNG logo */}
                    <img 
                      src={LogoImage} 
                      alt="C-Tech Engineering Logo" 
                      onError={(e) => {
                        console.error('Failed to load logo image');
                        e.target.style.display = 'none';
                        // Fallback to icon if image fails to load
                        const fallback = document.createElement('div');
                        fallback.innerHTML = '<svg><WorkspacePremium/></svg>';
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                  </BrandLogo>
                  <Box>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 800, 
                      color: TEXT_PRIMARY,
                      background: PRIMARY_GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize:{ xs: '1.5rem', sm: '1.5rem', md: '1.8rem'}
                    }}>
                      C-TECH ENGINEERING
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: TEXT_SECONDARY,
                      fontWeight: 500,
                      letterSpacing: '0.5px'
                    }}>
                      Employee Daily Work Management
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  color: TEXT_PRIMARY,
                  mb: 2,
                  fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' }
                }}>
                  Welcome Back
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: TEXT_SECONDARY,
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
                    <VerifiedUser sx={{ color: SECONDARY_COLOR }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color={TEXT_PRIMARY}>
                        Secure Access
                      </Typography>
                      <Typography variant="caption" color={TEXT_SECONDARY}>
                        Enterprise-grade security
                      </Typography>
                    </Box>
                  </FeatureCard>
                  
                  <FeatureCard>
                    <Dashboard sx={{ color: SECONDARY_COLOR }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color={TEXT_PRIMARY}>
                        Real-time Dashboard
                      </Typography>
                      <Typography variant="caption" color={TEXT_SECONDARY}>
                        Live analytics & insights
                      </Typography>
                    </Box>
                  </FeatureCard>
                  
                  <FeatureCard>
                    <Person sx={{ color: SECONDARY_COLOR }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color={TEXT_PRIMARY}>
                        Team Management
                      </Typography>
                      <Typography variant="caption" color={TEXT_SECONDARY}>
                        Manage employees & roles
                      </Typography>
                    </Box>
                  </FeatureCard>
                  
                  <FeatureCard>
                    <CorporateFare sx={{ color: SECONDARY_COLOR }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color={TEXT_PRIMARY}>
                        Timesheet Tracking
                      </Typography>
                      <Typography variant="caption" color={TEXT_SECONDARY}>
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
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: TEXT_PRIMARY,
                      mb: 1
                    }}>
                      Sign In
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: TEXT_SECONDARY,
                      fontWeight: 500
                    }}>
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
                        border: `1px solid ${ERROR_COLOR}20`,
                        backgroundColor: `${ERROR_COLOR}10`,
                        '& .MuiAlert-icon': {
                          color: ERROR_COLOR,
                        }
                      }}
                      onClose={() => setError("")}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {error}
                      </Typography>
                    </Alert>
                  )}

                  <form onSubmit={handleLogin}>
                    <Box sx={{ mb: 3 }}>
                      <StyledTextField
                        fullWidth
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        type="email"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlined sx={{ color: TEXT_PRIMARY }} />
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
                              <LockOutlined sx={{ color: TEXT_PRIMARY }} />
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
                                sx={{ color: TEXT_PRIMARY }}
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
                          Signing in...
                        </Box>
                      ) : (
                        'Sign In'
                      )}
                    </LoginButton>

                 
                  </form>
                </LoginCard>
              </Box>
            </Grid>
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
}