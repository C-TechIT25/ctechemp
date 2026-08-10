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
  GlobalStyles,
  alpha,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { useState, useEffect } from "react";
import LogoImage from "../assets/Ctechsheet.png";
import {
  People as PeopleIcon,
  Timer as TimerIcon,
  Task as TaskIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";

export const drawerWidth = 280;

// ---------------------------------------------------------------------------
// Shared design tokens — same palette/type used across Todo, Timesheet,
// Header and Sidebar. Worth lifting into a single `theme/tokens.js` file.
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

const Display = ({ children, sx = {} }) => (
  <Box component="span" sx={{ fontFamily: "'Outfit', sans-serif", ...sx }}>
    {children}
  </Box>
);

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'mobileOpen',
})(({ theme, mobileOpen, isMobile }) => ({
  width: drawerWidth,
  flexShrink: 0,
  fontFamily: "'Inter', sans-serif",
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    color: "#E0E3FF",
    border: "none",
    background: `linear-gradient(165deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
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
  backgroundColor: "rgba(0, 0, 0, 0.15)",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  minHeight: '64px',
  marginTop: theme.spacing(-8),
}));

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== "active",
})(({ active }) => ({
  borderRadius: 14,
  maxWidth: '240px',
  margin: '4px 16px',
  padding: '10px 16px',
  cursor: 'pointer',
  backgroundColor: active ? "rgba(255, 255, 255, 0.97)" : "transparent",
  border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: active ? "rgba(255, 255, 255, 0.97)" : "rgba(255, 255, 255, 0.08)",
  },
  "& .MuiListItemIcon-root": {
    minWidth: 38,
    color: active ? COLORS.primary : "#ffffff",
    fontSize: "1.2rem",
  },
  "& .MuiListItemText-primary": {
    color: active ? COLORS.primaryDark : "#ffffff",
    fontWeight: active ? 700 : 500,
    fontSize: "0.92rem",
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
    { label: "User Management", path: "/admin/users", icon: <PeopleIcon /> },
    { label: "Timesheet", path: "/admin/timesheet", icon: <TimerIcon /> },
    { label: "Employee Digital ID", path: "/admin/create-employee", icon: <PersonIcon /> },
  ];

  const employeeMenu = [
    { label: "Daily Timesheet", path: "/employee/daily-timesheet", icon: <TimerIcon /> },
    { label: "Todo List", path: "/employee/todo", icon: <TaskIcon /> },
  ];

  const menu = role === "Admin" ? adminMenu : employeeMenu;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const activeItem = menu.find((item) => isActive(item.path));

  // Remember the last page the person was on, so it can be restored
  // (e.g. on next login) even though routing itself is URL-driven.
  useEffect(() => {
    try {
      localStorage.setItem("ctech_last_active_page", location.pathname);
    } catch {
      // localStorage may be unavailable (private mode, etc.) — safe to ignore.
    }
  }, [location.pathname]);

  const handleMenuItemClick = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      <GlobalStyles styles={fontImport} />
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
              borderRadius: 2.5,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.2)",
              mr: 2,
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={LogoImage}
              alt="C-Tech Sheet"
              sx={{ width: 32, height: 32, objectFit: "contain" }}
            />
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
              <Display>{role === "Admin" ? "Admin Panel" : "Employee Portal"}</Display>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.78)",
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

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1 }} />

        <List sx={{ mt: 1, pb: 2, overflow: 'auto' }}>
          {menu.map((item) => (
            <StyledListItem button key={item.label} onClick={() => handleMenuItemClick(item.path)} active={isActive(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ noWrap: true }} />
            </StyledListItem>
          ))}
        </List>

        {/* Bottom panel: active page indicator + live clock */}
        <Box sx={{ mt: "auto", p: 2, pb: 2 }}>
          <Box
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              bgcolor: COLORS.surface,
              border: `1px solid ${alpha(COLORS.primary, 0.15)}`,
              boxShadow: `0 10px 28px ${alpha(COLORS.primaryDark, 0.22)}`,
            }}
          >
            {/* Currently viewing */}
            <Box
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                borderBottom: `1px solid ${alpha(COLORS.primary, 0.1)}`,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(COLORS.primary, 0.1),
                  color: COLORS.primary,
                  flexShrink: 0,
                  "& svg": { fontSize: "1.15rem" },
                }}
              >
                {activeItem ? activeItem.icon : <Box component="img" src={LogoImage} alt="C-Tech Sheet" sx={{ width: 22, height: 22, objectFit: "contain" }} />}
                <Box
                  sx={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    bgcolor: COLORS.success,
                    border: "2px solid white",
                    animation: "sidebarPulseDot 2s infinite",
                    "@keyframes sidebarPulseDot": {
                      "0%": { boxShadow: `0 0 0 0 ${alpha(COLORS.success, 0.6)}` },
                      "70%": { boxShadow: `0 0 0 6px ${alpha(COLORS.success, 0)}` },
                      "100%": { boxShadow: `0 0 0 0 ${alpha(COLORS.success, 0)}` },
                    },
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ color: COLORS.faint, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", fontSize: "0.62rem", display: "block" }}
                >
                  Currently viewing
                </Typography>
                <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: COLORS.ink }}>
                  <Display>{activeItem ? activeItem.label : "Dashboard"}</Display>
                </Typography>
              </Box>
            </Box>

            {/* Date / time */}
            <Box sx={{ p: 1.75, textAlign: "center" }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: COLORS.primaryDark,
                  fontWeight: 700,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <CalendarIcon fontSize="small" />
                {dayName}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.primaryDark, fontWeight: 500, mb: 0.5 }}>
                {dateString}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: COLORS.primary,
                  fontSize: "0.85rem",
                  display: "block",
                  backgroundColor: alpha(COLORS.primary, 0.1),
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {timeString}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              color: COLORS.primaryDark,
              textAlign: "center",
              mt: 1,
              fontSize: "0.78rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 0.5,
              borderRadius: 2,
            }}
          >
            Version 2.2.5
          </Typography>
        </Box>
      </StyledDrawer>
    </>
  );
}