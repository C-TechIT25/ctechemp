import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Header user={user} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 ,mt: 8, ml: -5}}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;