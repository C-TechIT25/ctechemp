import React, { Suspense } from 'react';
import PageSkeleton from '../components/PageSkeleton';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Box } from '@mui/material';

const DashboardLayout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: 0 ,mt: 8, ml: -5}}>
        <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
