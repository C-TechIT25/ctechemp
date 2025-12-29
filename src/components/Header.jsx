import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useTheme,
  useMediaQuery,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../Config";
import {
  Menu as MenuIcon,
  CalendarMonth,
  ExitToApp,
  Person,
} from "@mui/icons-material";

export default function Header({ onMenuClick }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [now, setNow] = useState(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const open = Boolean(anchorEl);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await signOut(auth);
  };

  const dayName = now.toLocaleDateString("en-IN", { weekday: "long" });
  const dateString = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeString = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });


  // Get user name from localStorage or default
  const getUserName = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        return parsedUser.name || parsedUser.displayName || "User";
      } catch {
        return "User";
      }
    }
    return "User";
  };

  const userName = auth.currentUser.email;

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 20px rgba(46, 125, 50, 0.15)",
          ml: { sm: '280px' },
          width: { sm: `calc(100% - 280px)` },
          backdropFilter: "blur(10px)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.05)",
          }
        }}
      >
        <Toolbar sx={{ position: "relative", zIndex: 1 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuClick}
              sx={{ 
                mr: 2,
                background: "rgba(255, 255, 255, 0.15)",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.25)",
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Left side: Title */}
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Enterprise Dashboard
          </Typography>

          {/* Middle: Date / Time / Day - Hide on small screens */}
          {!isSmall && (
            <Box sx={{ 
              mr: 3, 
              textAlign: "center",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: "rgba(255, 255, 255, 0.15)",
              padding: "6px 16px",
              borderRadius: "12px",
              backdropFilter: "blur(5px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              minWidth: "180px"
            }}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                {dayName}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.9)", display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarMonth fontSize="small" />
                {dateString} | {timeString}
              </Typography>
            </Box>
          )}

          {/* Right side: User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* User Info */}
            {!isSmall && (
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                  {userName}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  Welcome back
                </Typography>
              </Box>
            )}
            
            {/* User Profile */}
            <IconButton
              size="small"
              edge="end"
              onClick={handleProfileMenuOpen}
              sx={{
                border: "2px solid rgba(255, 255, 255, 0.3)",
                padding: "2px",
                transition: "all 0.3s ease",
                "&:hover": {
                  border: "2px solid white",
                  transform: "scale(1.05)",
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: "linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 200,
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            boxShadow: "0 8px 32px rgba(46, 125, 50, 0.15)",
            border: "1px solid rgba(46, 125, 50, 0.1)",
            "& .MuiMenuItem-root": {
              py: 1.5,
              "&:hover": {
                backgroundColor: "rgba(46, 125, 50, 0.05)",
              },
            },
          },
        }}
      >
        {/* User Info */}
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(0, 0, 0, 0.08)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(46, 125, 50, 0.2)",
              }}
            >
              {auth.currentUser.email.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                {auth.currentUser.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active now
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Person fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />

        <MenuItem 
          onClick={handleLogout} 
          sx={{ 
            color: "#d32f2f",
            "&:hover": {
              backgroundColor: "rgba(211, 47, 47, 0.05)",
            }
          }}
        >
          <ListItemIcon>
            <ExitToApp fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </MenuItem>
      </Menu>

      {/* Spacer for content below AppBar */}
      <Toolbar />
    </>
  );
}