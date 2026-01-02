import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
  ListItemIcon,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react"; // Added for date/time
import {
  People as PeopleIcon,
  Timer as TimerIcon,
  Task as TaskIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";

export const drawerWidth = 280;

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'mobileOpen',
})(({ theme, mobileOpen, isMobile }) => ({
  width: drawerWidth,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    backgroundColor: "#1a1f36",
    color: "#a0aec0",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(135deg, #1565C0 0%, #2196F3 100%)",
    [theme.breakpoints.up('sm')]: {
      position: 'fixed',
    },
    ...(isMobile && {
      ...(!mobileOpen && {
        width: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }),
    }),
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(3, 2),
  backgroundColor: "rgba(0, 0, 0, 0.2)",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  minHeight: '64px',
  marginTop: theme.spacing(-8),
}));

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== "active",
})(({ active, theme }) => ({
  borderRadius: 12,
  maxWidth:'240px',
  margin: theme.spacing(1, 2),
  padding: theme.spacing(1, 2),
  backgroundColor: active
    ? "rgba(255, 255, 255, 1)"
    : "transparent",
  borderLeft: active
    ? `4px solid ${theme.palette.primary.main}`
    : "4px solid transparent",
  border : active ? `1px solid transparent` : "1px solid white",
  "&:hover": {
    backgroundColor: active
      ? "rgba(255, 255, 255, 1)"
      : "rgba(255, 255, 255, 0.05)",
    transition: "all 0.3s ease",
  },
  "& .MuiListItemIcon-root": {
    minWidth: 40,
    color: active ? "#1565C0" : "#ffffff",
    fontSize: "1.2rem",
  },
  "& .MuiListItemText-primary": {
    color: active ? "#1565C0" : "#ffffff",
    fontWeight: active ? 600 : 400,
    fontSize: "0.95rem",
  },
}));

export default function Sidebar({ mobileOpen, onClose }) {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const adminMenu = [
    {
      label: "User Management",
      path: "/admin/users",
      icon: <PeopleIcon />,
    },
    {
      label: "Timesheet",
      path: "/admin/timesheet",
      icon: <TimerIcon />,
    },
  ];

  const employeeMenu = [
    {
      label: "Daily Timesheet",
      path: "/employee/daily-timesheet",
      icon: <TimerIcon />,
    },
    {
      label: "Todo List",
      path: "/employee/todo",
      icon: <TaskIcon />,
    },
  ];

  const menu = role === "Admin" ? adminMenu : employeeMenu;

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <StyledDrawer
      variant={isMobile ? "temporary" : "permanent"}
      open={mobileOpen}
      onClose={onClose}
      mobileOpen={mobileOpen}
      isMobile={isMobile}
    >
      <Toolbar />
      <SidebarHeader>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #1565C0 0%, #2196F3 100%)",
            mr: 2,
            fontSize: "1.2rem",
          }}
        >
          {role === "Admin" ? (
            <AdminIcon sx={{ color: "#ffffff", fontSize: "1.2rem" }} />
          ) : (
            <PersonIcon sx={{ color: "#ffffff", fontSize: "1.2rem" }} />
          )}
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.2px",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {role === "Admin" ? "Admin Panel" : "Employee Portal"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ 
              color: "rgba(255, 255, 255, 0.8)", 
              fontSize: "0.75rem",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Welcome back, {user?.name || "User"}
          </Typography>
        </Box>
      </SidebarHeader>
      
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />
      
      <List sx={{ mt: 2, pb: 2, overflow: 'auto' }}>
        {menu.map((item) => (
          <StyledListItem
            button
            key={item.label}
            onClick={() => handleMenuItemClick(item.path)}
            active={isActive(item.path)}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                noWrap: true,
              }}
            />
          </StyledListItem>
        ))}
      </List>
      
      {/* Date/Time Display */}
      <Box sx={{ mt: "auto", p: 2, mb: 1 }}>
        <Box
          sx={{
            bgcolor: "rgba(255, 255, 255, 1)",
            borderRadius: 2,
            p: 2,
            textAlign: "center",
            border: "1px solid rgba(33, 150, 243, 0.2)",
            boxShadow: "0 4px 12px rgba(33, 150, 243, 0.1)",
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: "#1565C0", 
              fontWeight: 600,
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5
            }}
          >
            <CalendarIcon fontSize="small" />
            {dayName}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "#1565C0", 
              fontWeight: 500,
              mb: 0.5
            }}
          >
            {dateString}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#2196F3",
              fontSize: "0.85rem",
              display: "block",
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              padding: "4px 8px",
              borderRadius: "8px",
              fontWeight: 600
            }}
          >
            {timeString}
          </Typography>
        </Box>
         <Typography 
          variant="caption"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 1)",
            color: "#2196F3",
            textAlign: "center",
            mt: 1,
            fontSize: "1rem",
            textAlignLast: "center",
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
          }}
        >
          Version 1.0.0
        </Typography>
      </Box>
    </StyledDrawer>
  );
}