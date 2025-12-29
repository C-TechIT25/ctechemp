// src/Pages/Login.jsx
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
  Fade
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
  CorporateFare
} from "@mui/icons-material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../Config";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";

// Theme colors
const PRIMARY_GRADIENT = 'linear-gradient(135deg, #7a2514, rgba(93, 118, 151, 0.95))';
const PRIMARY_COLOR = '#7a2514';
const BACKGROUND_COLOR = 'rgba(255, 255, 255, 1)';
const BORDER_COLOR = 'rgba(92, 91, 91, 0.21)';
const TEXT_PRIMARY = '#7a2514';
const TEXT_SECONDARY = 'rgba(0, 0, 0, 0.6)';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#F44336';

// Styled Components
const LoginButton = styled(Button)(({ theme }) => ({
  background: PRIMARY_GRADIENT,
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.55)',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '0.3px',
  padding: '12px 24px',
  fontSize: '16px',
  transition: 'all 0.2s ease-out',
  '&:hover': {
    background: 'linear-gradient(135deg, #7a2514, rgba(93, 118, 151, 1))',
    boxShadow: '0 8px 32px rgba(9, 116, 165, 0.3)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    color: 'rgba(0, 0, 0, 0.26)',
    transform: 'none',
    boxShadow: 'none',
  },
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  background: BACKGROUND_COLOR,
  border: `1px solid ${BORDER_COLOR}`,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(6),
  width: '100%',
  maxWidth: '420px',
  transition: 'all 0.3s ease-out',
  '&:hover': {
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
    borderColor: PRIMARY_COLOR,
  },
}));

const BrandHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(4),
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  background: PRIMARY_GRADIENT,
  borderRadius: '16px',
  marginBottom: theme.spacing(2),
 
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.2s ease-out',
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
    '&.Mui-focused': {
      color: TEXT_PRIMARY,
    },
  },
}));

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate("/dashboard");
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
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
      },
    }}>
      {/* Background decorative elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(9, 116, 165, 0.05) 0%, rgba(9, 116, 165, 0) 70%)',
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(93, 118, 151, 0.05) 0%, rgba(93, 118, 151, 0) 70%)',
        zIndex: 0,
      }} />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1,ml:90 }}>
        <Fade in={true} timeout={800}>
          <LoginCard elevation={0}>
            <BrandHeader>
              <BrandLogo>
                <Dashboard sx={{ fontSize: 32, color: 'white' }} />
              </BrandLogo>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: TEXT_PRIMARY,
                mb: 1,
                letterSpacing: '-0.5px'
              }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ 
                color: TEXT_SECONDARY,
                fontWeight: 500
              }}>
                Sign in to your account to continue
              </Typography>
            </BrandHeader>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '12px',
                  alignItems: 'center',
                  '& .MuiAlert-icon': {
                    color: ERROR_COLOR,
                  }
                }}
                onClose={() => setError("")}
              >
                {error}
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
                  sx={{ mb: 2 }}
                  disabled={loading}
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
                          size="small"
                          sx={{ color: TEXT_PRIMARY }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  disabled={loading}
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 1.5 
                }}>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security fontSize="small" sx={{ color: SUCCESS_COLOR }} />
                    <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
                      Secure login
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <LoginButton
                fullWidth
                type="submit"
                disabled={loading || !email || !password}
                endIcon={!loading && <ArrowForward />}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Signing in...
                  </Box>
                ) : (
                  'Sign in to Dashboard'
                )}
              </LoginButton>
            </form>

          </LoginCard>
        </Fade>

      </Container>
    </Box>
  );
}