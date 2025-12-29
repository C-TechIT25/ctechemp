import { Box, Toolbar, CssBaseline, useTheme, useMediaQuery ,Typography} from "@mui/material";
import { useState } from "react";
import Sidebar, { drawerWidth } from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7fafc" }}>
      <CssBaseline />
      
      <Header onMenuClick={handleDrawerToggle} />
      
      <Sidebar 
        mobileOpen={mobileOpen} 
        onClose={handleDrawerClose} 
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(isMobile && mobileOpen && {
            marginLeft: `${drawerWidth}px`,
            width: `calc(100% - ${drawerWidth}px)`,
          }),
        }}
      >
        <Toolbar />
        
        {/* Main Content Area */}
        <Box
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            minHeight: "calc(100vh - 100px)",
            p: { xs: 2, sm: 3 },
            overflow: "auto",
          }}
        >
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}