import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

const skeletonSx = { bgcolor: 'rgba(148, 163, 184, 0.18)' };

function StatSkeleton() {
  return (
    <Paper elevation={0} sx={{ flex: '1 1 150px', minWidth: 0, p: 2, borderRadius: 3, border: '1px solid rgba(30, 41, 59, 0.08)' }}>
      <Skeleton animation="wave" width="45%" height={18} sx={skeletonSx} />
      <Skeleton animation="wave" width="30%" height={36} sx={{ ...skeletonSx, mt: 0.5 }} />
    </Paper>
  );
}

function TableSkeleton({ rows }) {
  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 3, border: '1px solid rgba(30, 41, 59, 0.08)' }}>
      <Box sx={{ p: 2, bgcolor: 'rgba(248, 250, 252, 0.9)', display: 'flex', gap: 2 }}>
        {[28, 22, 18, 14].map((width) => (
          <Skeleton key={width} animation="wave" width={`${width}%`} height={24} sx={skeletonSx} />
        ))}
      </Box>
      {Array.from({ length: rows }, (_, index) => (
        <Box
          key={index}
          sx={{ px: 2, py: 1.6, display: 'flex', alignItems: 'center', gap: 2, borderTop: '1px solid rgba(30, 41, 59, 0.06)' }}
        >
          <Skeleton animation="wave" variant="circular" width={36} height={36} sx={{ ...skeletonSx, flexShrink: 0 }} />
          <Skeleton animation="wave" width="28%" height={22} sx={skeletonSx} />
          <Skeleton animation="wave" width="22%" height={22} sx={skeletonSx} />
          <Skeleton animation="wave" width="18%" height={22} sx={{ ...skeletonSx, display: { xs: 'none', sm: 'block' } }} />
          <Skeleton animation="wave" width="12%" height={28} sx={{ ...skeletonSx, ml: 'auto', borderRadius: 4 }} />
        </Box>
      ))}
    </Paper>
  );
}

function ProfileSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid rgba(30, 41, 59, 0.08)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Skeleton animation="wave" variant="circular" width={112} height={112} sx={skeletonSx} />
          <Box sx={{ flex: 1, width: '100%' }}>
            <Skeleton animation="wave" width="42%" height={38} sx={skeletonSx} />
            <Skeleton animation="wave" width="28%" height={22} sx={skeletonSx} />
            <Skeleton animation="wave" width="58%" height={20} sx={{ ...skeletonSx, mt: 1 }} />
          </Box>
        </Stack>
      </Paper>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {[0, 1].map((card) => (
          <Paper key={card} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(30, 41, 59, 0.08)' }}>
            <Skeleton animation="wave" width="38%" height={28} sx={skeletonSx} />
            {[72, 88, 64, 80].map((width, index) => (
              <Skeleton key={`${width}-${index}`} animation="wave" width={`${width}%`} height={22} sx={{ ...skeletonSx, mt: 1.5 }} />
            ))}
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}

export default function PageSkeleton({ variant = 'table', fullScreen = false, compact = false, rows = 6 }) {
  return (
    <Box
      role="status"
      aria-label="Loading content"
      sx={{
        minHeight: fullScreen ? '100vh' : compact ? 360 : 'calc(100vh - 64px)',
        bgcolor: '#F6F7FB',
        px: compact ? 0 : { xs: 2, sm: 4 },
        py: compact ? 0 : 3,
      }}
    >
      <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
        {variant === 'profile' ? (
          <ProfileSkeleton />
        ) : (
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton animation="wave" width="min(320px, 64%)" height={42} sx={skeletonSx} />
                <Skeleton animation="wave" width="min(460px, 82%)" height={22} sx={skeletonSx} />
              </Box>
              <Skeleton animation="wave" width={124} height={42} sx={{ ...skeletonSx, borderRadius: 2, display: { xs: 'none', sm: 'block' } }} />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {[0, 1, 2, 3].map((item) => <StatSkeleton key={item} />)}
            </Box>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(30, 41, 59, 0.08)' }}>
              <Skeleton animation="wave" width="100%" height={48} sx={{ ...skeletonSx, borderRadius: 2 }} />
            </Paper>
            <TableSkeleton rows={rows} />
          </Stack>
        )}
      </Box>
    </Box>
  );
}
